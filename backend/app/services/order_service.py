import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.utils import as_id
from app.models import Order, OrderItem, Product, User, WhiteLabelConfig
from app.schemas import OrderCreate
from app.services.push_service import notify_order_accepted
from app.services.ranking_service import get_white_label_config

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


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_order_totals(
    subtotal: Decimal,
    order_method: str,
    wl: Optional[WhiteLabelConfig],
) -> Tuple[Decimal, Decimal, Decimal, Decimal, Decimal]:
    """Returns subtotal, delivery_fee, tax_amount, total, tax_rate_percent.

    Delivery fees are deferred (always 0) until settings.delivery_fees_enabled is true.
    """
    from app.core.config import settings

    subtotal = _money(subtotal)
    delivery_fee = Decimal("0")
    tax_rate = Decimal("0")
    if wl:
        tax_rate = Decimal(str(wl.tax_rate_percent or 0))
        if settings.delivery_fees_enabled and order_method == "delivery":
            delivery_fee = _money(Decimal(str(wl.delivery_fee_flat or 0)))
    taxable = subtotal + delivery_fee
    tax_amount = _money(taxable * tax_rate / Decimal("100")) if tax_rate else Decimal("0")
    total = _money(subtotal + delivery_fee + tax_amount)
    return subtotal, delivery_fee, tax_amount, total, tax_rate


def quote_order(
    db: Session,
    company_id: str,
    items: list,
    order_method: str,
) -> dict:
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must have items")
    if order_method not in ("delivery", "pickup"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="order_method must be delivery or pickup")

    subtotal = Decimal("0")
    for item in items:
        product = (
            db.query(Product)
            .filter(Product.id == as_id(item.product_id), Product.company_id == as_id(company_id))
            .first()
        )
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if not product.is_available or product.stock_quantity < item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{product.name} unavailable")
        subtotal += Decimal(str(product.price)) * item.quantity

    wl = get_white_label_config(db, str(company_id))
    subtotal, delivery_fee, tax_amount, total, tax_rate = calculate_order_totals(subtotal, order_method, wl)
    return {
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "tax_amount": tax_amount,
        "total_price": total,
        "tax_rate_percent": tax_rate,
    }


def create_order(db: Session, user: User, data: OrderCreate) -> Order:
    if not data.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must have items")
    if data.order_method not in ("delivery", "pickup"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="order_method must be delivery or pickup")
    if data.order_method == "delivery" and not (data.delivery_address or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery address required")

    products = []
    subtotal = Decimal("0")
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
        subtotal += line_total
        products.append((product, item.quantity))

    wl = get_white_label_config(db, str(data.company_id))
    subtotal, delivery_fee, tax_amount, total, _ = calculate_order_totals(subtotal, data.order_method, wl)

    order = Order(
        user_id=user.id,
        company_id=as_id(data.company_id),
        status="Pending",
        payment_status="unpaid",
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax_amount=tax_amount,
        total_price=total,
        order_method=data.order_method,
        delivery_address=data.delivery_address.strip() if data.delivery_address else None,
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
