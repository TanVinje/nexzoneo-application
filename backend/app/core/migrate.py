from sqlalchemy import inspect, text

from app.core.database import engine


def run_migrations():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "saved_address" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN saved_address TEXT"))
    if "push_token" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN push_token TEXT"))

    if "orders" in inspector.get_table_names():
        order_columns = {col["name"] for col in inspector.get_columns("orders")}
        if "stripe_checkout_session_id" not in order_columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE orders ADD COLUMN stripe_checkout_session_id VARCHAR(255)"))
