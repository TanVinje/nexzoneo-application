import logging
from typing import Any, Optional, Tuple

import stripe

from app.core.config import settings
from app.models import Order

logger = logging.getLogger(__name__)


def stripe_enabled() -> bool:
    return bool(settings.stripe_secret_key)


def get_publishable_key() -> Optional[str]:
    return settings.stripe_publishable_key or None


def _configure_stripe() -> None:
    stripe.api_key = settings.stripe_secret_key


def create_checkout_session(order: Order) -> Tuple[str, str]:
    _configure_stripe()
    amount_cents = int(float(order.total_price) * 100)
    success_url = f"{settings.payment_return_url}?order_id={order.id}&status=success"
    cancel_url = f"{settings.payment_return_url}?order_id={order.id}&status=cancel"
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": settings.stripe_currency,
                    "product_data": {"name": f"Order #{str(order.id)[:8]}"},
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": str(order.id)},
    )
    return session.url, session.id


def handle_webhook(payload: bytes, sig_header: Optional[str]) -> Optional[Any]:
    if not settings.stripe_webhook_secret:
        return None
    _configure_stripe()
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except Exception as exc:
        logger.warning("Stripe webhook verification failed: %s", exc)
        raise
    return event
