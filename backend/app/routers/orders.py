from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from app.core.utils import as_id

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Order, OrderItem, ProductRating, SellerRating, User
from app.schemas import (
    CheckoutSessionResponse,
    OrderCreate,
    OrderResponse,
    PaymentConfigResponse,
    PaymentRequest,
    ProductRatingCreate,
    SellerRatingCreate,
)
from app.services.order_service import create_order, mark_order_paid, process_payment
from app.services.stripe_service import create_checkout_session, get_publishable_key, handle_webhook, stripe_enabled

router = APIRouter(tags=["orders", "ratings"])


@router.post("/orders", response_model=OrderResponse)
def place_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    return create_order(db, user, data)


@router.get("/orders/my", response_model=List[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.company))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.company))
        .filter(Order.id == as_id(order_id), Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/orders/{order_id}/pay", response_model=OrderResponse)
def pay_order(
    order_id: str,
    data: PaymentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    order = db.query(Order).filter(Order.id == as_id(order_id), Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if stripe_enabled() and data.simulate_success:
        raise HTTPException(
            status_code=400,
            detail="Stripe is enabled. Use checkout to pay with a card.",
        )
    return process_payment(db, order, data.simulate_success)


@router.get("/orders/{order_id}/payment-config", response_model=PaymentConfigResponse)
def payment_config(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    order = db.query(Order).filter(Order.id == as_id(order_id), Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return PaymentConfigResponse(
        stripe_enabled=stripe_enabled(),
        publishable_key=get_publishable_key(),
    )


@router.post("/orders/{order_id}/checkout", response_model=CheckoutSessionResponse)
def create_order_checkout(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    if not stripe_enabled():
        raise HTTPException(status_code=400, detail="Stripe is not configured on this server")
    order = db.query(Order).filter(Order.id == as_id(order_id), Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "Awaiting Payment":
        raise HTTPException(status_code=400, detail="Order is not awaiting payment")
    checkout_url, session_id = create_checkout_session(order)
    order.stripe_checkout_session_id = session_id
    db.commit()
    return CheckoutSessionResponse(checkout_url=checkout_url, session_id=session_id)


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = handle_webhook(payload, sig)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")
    if not event:
        raise HTTPException(status_code=400, detail="Webhook not configured")

    if event.type == "checkout.session.completed":
        session = event.data.object
        order_id = session.metadata.get("order_id") if session.metadata else None
        if order_id:
            order = db.query(Order).filter(Order.id == as_id(order_id)).first()
            if order:
                mark_order_paid(db, order, session.id)

    return {"received": True}


@router.post("/ratings/product")
def rate_product(
    data: ProductRatingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    existing = (
        db.query(ProductRating)
        .filter(ProductRating.user_id == user.id, ProductRating.product_id == as_id(data.product_id))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already rated")
    rating = ProductRating(
        user_id=user.id,
        product_id=as_id(data.product_id),
        rating=data.rating,
        comment=data.comment,
    )
    db.add(rating)
    from app.services.rating_service import update_product_rating_stats

    update_product_rating_stats(db, str(data.product_id))
    db.commit()
    return {"ok": True}


@router.post("/ratings/seller")
def rate_seller(
    data: SellerRatingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    existing = (
        db.query(SellerRating)
        .filter(SellerRating.user_id == user.id, SellerRating.company_id == as_id(data.company_id))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already rated")
    rating = SellerRating(
        user_id=user.id,
        company_id=as_id(data.company_id),
        rating=data.rating,
        comment=data.comment,
    )
    db.add(rating)
    from app.services.rating_service import update_company_rating_stats

    update_company_rating_stats(db, str(data.company_id))
    db.commit()
    return {"ok": True}
