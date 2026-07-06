from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.utils import as_id
from app.models import Company, Product, ProductRating, SellerRating


def update_product_rating_stats(db: Session, product_id: str) -> None:
    avg, count = (
        db.query(func.avg(ProductRating.rating), func.count(ProductRating.id))
        .filter(ProductRating.product_id == as_id(product_id))
        .one()
    )
    product = db.query(Product).filter(Product.id == as_id(product_id)).first()
    if product:
        product.rating_average = Decimal(str(round(float(avg or 0), 2)))
        product.rating_count = int(count or 0)


def update_company_rating_stats(db: Session, company_id: str) -> None:
    avg, count = (
        db.query(func.avg(SellerRating.rating), func.count(SellerRating.id))
        .filter(SellerRating.company_id == as_id(company_id))
        .one()
    )
    company = db.query(Company).filter(Company.id == as_id(company_id)).first()
    if company:
        company.rating_average = Decimal(str(round(float(avg or 0), 2)))
        company.rating_count = int(count or 0)
