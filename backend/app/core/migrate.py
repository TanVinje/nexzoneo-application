import uuid

from sqlalchemy import inspect, text

from app.core.database import engine


def _add_column_if_missing(table: str, column: str, ddl_type: str):
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns(table)}
    if column not in columns:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


def run_migrations():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    _add_column_if_missing("users", "saved_address", "TEXT")
    _add_column_if_missing("users", "push_token", "TEXT")
    _add_column_if_missing("orders", "stripe_checkout_session_id", "VARCHAR(255)")
    _add_column_if_missing("orders", "subtotal", "NUMERIC(10,2) DEFAULT 0")
    _add_column_if_missing("orders", "delivery_fee", "NUMERIC(10,2) DEFAULT 0")
    _add_column_if_missing("orders", "tax_amount", "NUMERIC(10,2) DEFAULT 0")
    _add_column_if_missing("white_label_configs", "delivery_fee_flat", "NUMERIC(10,2) DEFAULT 0")
    _add_column_if_missing("white_label_configs", "tax_rate_percent", "NUMERIC(5,2) DEFAULT 0")
    _add_column_if_missing("white_label_configs", "banner_title", "TEXT")
    _add_column_if_missing("white_label_configs", "banner_subtitle", "TEXT")
    _add_column_if_missing("offer_visibility_rules", "offer_subtitle", "TEXT")
    _add_column_if_missing("offer_visibility_rules", "offer_color", "TEXT DEFAULT '#141B4D'")

    # Backfill NULLs introduced by ALTER on existing SQLite rows
    with engine.begin() as conn:
        if "orders" in inspector.get_table_names():
            conn.execute(text("UPDATE orders SET subtotal = COALESCE(subtotal, total_price) WHERE subtotal IS NULL"))
            conn.execute(text("UPDATE orders SET delivery_fee = COALESCE(delivery_fee, 0) WHERE delivery_fee IS NULL"))
            conn.execute(text("UPDATE orders SET tax_amount = COALESCE(tax_amount, 0) WHERE tax_amount IS NULL"))
        if "white_label_configs" in inspector.get_table_names():
            conn.execute(text("UPDATE white_label_configs SET delivery_fee_flat = COALESCE(delivery_fee_flat, 4.99) WHERE delivery_fee_flat IS NULL"))
            conn.execute(text("UPDATE white_label_configs SET tax_rate_percent = COALESCE(tax_rate_percent, 0) WHERE tax_rate_percent IS NULL"))
            conn.execute(
                text(
                    "UPDATE white_label_configs SET banner_title = 'Order ahead, skip the wait' "
                    "WHERE banner_title IS NULL OR banner_title = ''"
                )
            )
            conn.execute(
                text(
                    "UPDATE white_label_configs SET banner_subtitle = 'Local favorites delivered or ready for pickup' "
                    "WHERE banner_subtitle IS NULL OR banner_subtitle = ''"
                )
            )

        # Ensure at least one public promo banner exists for home UI
        if "offer_visibility_rules" in inspector.get_table_names() and "companies" in inspector.get_table_names():
            public_count = conn.execute(
                text("SELECT COUNT(*) FROM offer_visibility_rules WHERE is_active = 1 AND visibility = 'public'")
            ).scalar()
            if not public_count:
                owner = conn.execute(
                    text("SELECT id FROM companies WHERE is_white_label_owner = 1 LIMIT 1")
                ).fetchone()
                if owner:
                    conn.execute(
                        text(
                            "INSERT INTO offer_visibility_rules "
                            "(id, company_id, offer_name, offer_subtitle, offer_color, visibility, approved_by, is_active) "
                            "VALUES (:id, :company_id, :name, :subtitle, :color, 'public', 'migrate', 1)"
                        ),
                        {
                            "id": str(uuid.uuid4()),
                            "company_id": owner[0],
                            "name": "Free pickup this week",
                            "subtitle": "Skip the line — order ahead",
                            "color": "#141B4D",
                        },
                    )
