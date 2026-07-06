"""Add 5 demo products with images. Safe to run multiple times (skips existing names)."""

import uuid
from decimal import Decimal
from pathlib import Path
from urllib.request import urlretrieve

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import Category, Company, Product

DEMO_PRODUCTS = [
    {
        "name": "Tropical Smoothie Bowl",
        "description": "Fresh mango, coconut flakes, and granola — a Bangkok breakfast favorite.",
        "price": "9.99",
        "stock": 40,
        "category": "Food & Grocery",
        "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
        "filename": "demo-smoothie-bowl.jpg",
    },
    {
        "name": "Studio Wireless Headphones",
        "description": "Over-ear comfort with deep bass and 30-hour battery life.",
        "price": "79.99",
        "stock": 18,
        "category": "Electronics",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        "filename": "demo-headphones.jpg",
    },
    {
        "name": "Handwoven Market Tote",
        "description": "Eco-friendly cotton tote, perfect for farmers market runs.",
        "price": "22.50",
        "stock": 55,
        "category": "Fashion",
        "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
        "filename": "demo-tote-bag.jpg",
    },
    {
        "name": "Lavender Candle Trio",
        "description": "Three soy candles with calming lavender and vanilla scents.",
        "price": "28.00",
        "stock": 30,
        "category": "Home & Garden",
        "image": "https://images.unsplash.com/photo-1603006905003-6ff8ad8c2039?w=600&q=80",
        "filename": "demo-candles.jpg",
    },
    {
        "name": "Single-Origin Cold Brew",
        "description": "Slow-steeped Thai arabica, ready to pour over ice.",
        "price": "14.99",
        "stock": 45,
        "category": "Food & Grocery",
        "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
        "filename": "demo-cold-brew.jpg",
    },
]


def _download_image(url: str, dest: Path) -> None:
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    urlretrieve(url, dest)


def seed_demo_products(db: Session) -> int:
    company = (
        db.query(Company)
        .filter(Company.is_white_label_owner.is_(True))
        .first()
    )
    if not company:
        company = db.query(Company).first()
    if not company:
        print("No company found. Run main seed first.")
        return 0

    categories = {c.name: c for c in db.query(Category).all()}
    upload_dir = Path(settings.upload_dir)
    added = 0

    for item in DEMO_PRODUCTS:
        if db.query(Product).filter(Product.name == item["name"]).first():
            print(f"Skip (exists): {item['name']}")
            continue

        cat = categories.get(item["category"])
        if not cat:
            print(f"Skip (no category): {item['name']}")
            continue

        dest = upload_dir / item["filename"]
        try:
            _download_image(item["image"], dest)
        except Exception as exc:
            print(f"Image download failed for {item['name']}: {exc}")
            image_url = item["image"]
        else:
            image_url = f"/uploads/{item['filename']}"

        db.add(
            Product(
                company_id=company.id,
                category_id=cat.id,
                name=item["name"],
                description=item["description"],
                image_url=image_url,
                price=Decimal(item["price"]),
                stock_quantity=item["stock"],
                is_available=True,
                order_method="delivery",
            )
        )
        added += 1
        print(f"Added: {item['name']}")

    if added:
        db.commit()
    return added


if __name__ == "__main__":
    db = SessionLocal()
    try:
        count = seed_demo_products(db)
        print(f"Done. {count} product(s) added.")
    finally:
        db.close()
