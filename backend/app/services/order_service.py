import logging
from decimal import Decimal

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.utils import as_id
from app.models import Order, OrderItem, Product, User
from app.schemas import OrderCreate
from app.services.push_service import notify_order_accepted

logger = logging.getLogger(__name__)

VALID_STATUSES = {
    "Pending",
    "Seller Accepted",
    "Seller Rejected",
    "Awaiting Payment",
    "Paid",
    "Processing",
    "Ready for Pickup",
    "Ready for Delivery",
    "Out for Delivery",
    "Completed",
    "Cancelled",
    "Refunded",
}

STATUS_TRANSITIONS = {
    "Pending": {"Seller Accepted", "Seller Rejected", "Cancelled"},
    "Seller Accepted": {"Awaiting Payment", "Cancelled"},
    "Seller Rejected": {"Cancelled"},
    "Awaiting Payment": {"Paid", "Cancelled"},
    "Paid": {"Processing", "Cancelled"},
    "Processing": {"Ready for Pickup", "Ready for Delivery", "Out for Delivery", "Completed"},
    "Ready for Pickup": {"Completed"},
    "Ready for Delivery": {"Out for Delivery", "Completed"},
    "Out for Delivery": {"Completed"},
}


def create_order(db: Session, user: User, data: OrderCreate) -> Order:
    if not data.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must have items")

    products = []
    total = Decimal("0")
    for item in data.items:
        product = (
            db.query(Product)
            .filter(Product.id == as_id(item.product_id), Product.company_id == as_id(data.company_id))
            .first()
        )
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if not product.is_available or product.stock_quantity < item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{product.name} unavailable")
        line_total = Decimal(str(product.price)) * item.quantity
        total += line_total
        products.append((product, item.quantity))

    order = Order(
        user_id=user.id,
        company_id=as_id(data.company_id),
        status="Pending",
        payment_status="unpaid",
        total_price=total,
        order_method=data.order_method,
        delivery_address=data.delivery_address,
    )
    db.add(order)
    db.flush()

    for product, quantity in products:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=as_id(product.id),
                quantity=quantity,
                unit_price=product.price,
            )
        )
        product.stock_quantity -= quantity

    db.commit()
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.company))
        .filter(Order.id == order.id)
        .first()
    )


def _restore_order_stock(db: Session, order: Order) -> None:
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity


def update_order_status(db: Session, order: Order, new_status: str) -> Order:
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    allowed = STATUS_TRANSITIONS.get(order.status, set())
    if new_status not in allowed and new_status != order.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {order.status} to {new_status}",
        )

    old_status = order.status
    order.status = new_status
    if new_status == "Seller Accepted":
        order.status = "Awaiting Payment"
    elif new_status == "Seller Rejected":
        order.status = "Cancelled"

    if order.status == "Cancelled" and old_status not in ("Cancelled", "Refunded"):
        _restore_order_stock(db, order)

    db.commit()
    db.refresh(order)

    if order.status == "Awaiting Payment" and old_status == "Pending":
        customer = db.query(User).filter(User.id == order.user_id).first()
        if customer:
            notify_order_accepted(
                customer.push_token,
                str(order.id),
                f"{float(order.total_price):.2f}",
            )

    return order


def mark_order_paid(db: Session, order: Order, session_id: Optional[str] = None) -> Order:
    if order.status != "Awaiting Payment":
        return order
    order.status = "Paid"
    order.payment_status = "paid"
    if session_id:
        order.stripe_checkout_session_id = session_id
    db.commit()
    db.refresh(order)
    return order


def process_payment(db: Session, order: Order, success: bool = True) -> Order:
    if order.status != "Awaiting Payment":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order not awaiting payment")
    if success:
        order.status = "Paid"
        order.payment_status = "paid"
    else:
        order.payment_status = "failed"
    db.commit()
    db.refresh(order)
    return order
