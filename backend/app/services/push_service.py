import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_expo_push(token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    if not token or not token.startswith("ExponentPushToken"):
        return False
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "data": data or {},
    }
    try:
        response = httpx.post(EXPO_PUSH_URL, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("Expo push failed: %s", exc)
        return False


def notify_order_accepted(token: Optional[str], order_id: str, total: str) -> None:
    send_expo_push(
        token or "",
        "Order accepted! 🎉",
        f"Your order was accepted. Pay ${total} to continue.",
        {"orderId": order_id, "type": "order_accepted"},
    )
