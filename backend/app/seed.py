from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Category,
    Company,
    OfferVisibilityRule,
    Product,
    User,
    WhiteLabelConfig,
)


def seed_database():
    db: Session = SessionLocal()
    try:
        if db.query(User).first():
            return

        # White-label owner company
        nexzoneo = Company(
            name="Nexzoneo Market",
            description="Your local marketplace for quality products",
            address="123 Market Street, Bangkok",
            latitude=Decimal("13.7563"),
            longitude=Decimal("100.5018"),
            email="hello@nexzoneo.com",
            phone="+66 2 000 0000",
            is_white_label_owner=True,
            brand_primary_color="#141B4D",
            brand_secondary_color="#53619A",
        )
        db.add(nexzoneo)
        db.flush()

        db.add(
            WhiteLabelConfig(
                company_id=nexzoneo.id,
                app_name="Nexzoneo",
                primary_color="#141B4D",
                secondary_color="#53619A",
                welcome_text="Discover local products near you",
                marketplace_mode_enabled=True,
                ranking_boost_enabled=True,
                delivery_fee_flat=Decimal("0"),
                tax_rate_percent=Decimal("0"),
                banner_title="Order ahead, skip the wait",
                banner_subtitle="Local favorites delivered or ready for pickup",
            )
        )

        # Second seller
        local_shop = Company(
            name="Local Fresh Shop",
            description="Fresh groceries and daily essentials",
            address="45 Sukhumvit Road, Bangkok",
            latitude=Decimal("13.7300"),
            longitude=Decimal("100.5690"),
            email="shop@localfresh.com",
            phone="+66 2 111 1111",
            brand_primary_color="#53619A",
            brand_secondary_color="#7890B0",
        )
        db.add(local_shop)
        db.flush()

        db.add(
            WhiteLabelConfig(
                company_id=local_shop.id,
                app_name="Local Fresh",
                primary_color="#53619A",
                secondary_color="#7890B0",
                welcome_text="Fresh from your neighborhood",
                delivery_fee_flat=Decimal("0"),
                tax_rate_percent=Decimal("0"),
                banner_title="Farm-fresh deals today",
                banner_subtitle="Pickup or delivery — choose at checkout",
            )
        )

        categories = [
            Category(name="Food & Grocery"),
            Category(name="Electronics"),
            Category(name="Fashion"),
            Category(name="Home & Garden"),
            Category(name="Services"),
        ]
        db.add_all(categories)
        db.flush()

        products_data = [
            (nexzoneo.id, categories[0].id, "Organic Honey 500g", "Pure local honey", "12.99", 50, None),
            (nexzoneo.id, categories[0].id, "Artisan Coffee Beans", "Roasted in Bangkok", "18.50", 30, None),
            (nexzoneo.id, categories[1].id, "Wireless Earbuds", "Noise cancelling", "49.99", 20, None),
            (nexzoneo.id, categories[2].id, "Cotton T-Shirt", "Soft premium cotton", "24.00", 100, None),
            (local_shop.id, categories[0].id, "Fresh Mango Box", "Seasonal Thai mangoes", "8.99", 40, None),
            (local_shop.id, categories[0].id, "Vegetable Bundle", "Daily fresh vegetables", "6.50", 60, None),
            (local_shop.id, categories[3].id, "Indoor Plant Set", "Low maintenance plants", "35.00", 15, None),
        ]
        for company_id, cat_id, name, desc, price, stock, image_url in products_data:
            db.add(
                Product(
                    company_id=company_id,
                    category_id=cat_id,
                    name=name,
                    description=desc,
                    image_url=image_url,
                    price=Decimal(price),
                    stock_quantity=stock,
                    is_available=True,
                    order_method="delivery",
                )
            )

        # Demo users
        db.add(
            User(
                name="Demo Customer",
                email="customer@demo.com",
                password_hash=get_password_hash("demo123"),
                role="customer",
                phone="+66 81 000 0001",
            )
        )
        db.add(
            User(
                name="Nexzoneo Seller",
                email="seller@nexzoneo.com",
                password_hash=get_password_hash("demo123"),
                role="seller",
                company_id=nexzoneo.id,
                phone="+66 81 000 0002",
            )
        )
        db.add(
            User(
                name="Local Shop Seller",
                email="seller@localfresh.com",
                password_hash=get_password_hash("demo123"),
                role="seller",
                company_id=local_shop.id,
                phone="+66 81 000 0003",
            )
        )

        db.add(
            OfferVisibilityRule(
                company_id=nexzoneo.id,
                offer_name="Tony's 5.9% Exclusive Deal",
                offer_subtitle="Partner-only offer",
                offer_color="#141B4D",
                visibility="exclusive",
                is_active=False,
                approved_by=None,
            )
        )
        db.add(
            OfferVisibilityRule(
                company_id=nexzoneo.id,
                offer_name="Free pickup this week",
                offer_subtitle="Skip the line — order ahead",
                offer_color="#141B4D",
                visibility="public",
                is_active=True,
                approved_by="seed",
            )
        )
        db.add(
            OfferVisibilityRule(
                company_id=local_shop.id,
                offer_name="Fresh mango special",
                offer_subtitle="Seasonal fruit boxes",
                offer_color="#53619A",
                visibility="public",
                is_active=True,
                approved_by="seed",
            )
        )

        db.commit()

        from app.seed_demo_products import seed_demo_products

        seed_demo_products(db)
    finally:
        db.close()
