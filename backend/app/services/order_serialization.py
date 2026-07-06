from app.models import Order
from app.schemas import CustomerSummary, OrderResponse


def serialize_order(order: Order, include_customer: bool = False) -> OrderResponse:
    customer = None
    if include_customer and order.user:
        customer = CustomerSummary(
            name=order.user.name,
            email=order.user.email,
            phone=order.user.phone,
        )
    base = OrderResponse.model_validate(order)
    if customer:
        return base.model_copy(update={"customer": customer})
    return base
