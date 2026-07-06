import math
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models import Company, Product, WhiteLabelConfig


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def text_relevance(query: str, product: Product) -> float:
    if not query:
        return 0.5
    q = query.lower()
    score = 0.0
    if q in product.name.lower():
        score += 1.0
    if product.description and q in product.description.lower():
        score += 0.5
    if product.company and q in product.company.name.lower():
        score += 0.3
    return score


def rank_products(
    products: List[Product],
    query: str = "",
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    white_label_company_id: Optional[str] = None,
    ranking_boost_enabled: bool = True,
) -> List[Product]:
    scored = []
    for product in products:
        score = text_relevance(query, product)
        score += float(product.rating_average or 0) * 0.2
        score += float(product.company.rating_average or 0) * 0.15 if product.company else 0
        score += 0.5 if product.is_available and product.stock_quantity > 0 else -1.0

        if (
            ranking_boost_enabled
            and white_label_company_id
            and str(product.company_id) == white_label_company_id
            and product.company
            and product.company.is_white_label_owner
        ):
            score += 2.0

        if user_lat is not None and user_lon is not None and product.company:
            if product.company.latitude and product.company.longitude:
                dist = haversine_km(
                    user_lat,
                    user_lon,
                    float(product.company.latitude),
                    float(product.company.longitude),
                )
                score -= min(dist * 0.05, 2.0)

        if product.stock_quantity <= 0 or not product.is_available:
            score -= 1.5

        product.ranking_score = score  # type: ignore[attr-defined]
        scored.append(product)

    scored.sort(key=lambda p: getattr(p, "ranking_score", 0), reverse=True)
    return scored


def get_white_label_config(db: Session, company_id: Optional[str] = None) -> Optional[WhiteLabelConfig]:
    if company_id:
        return (
            db.query(WhiteLabelConfig)
            .filter(WhiteLabelConfig.company_id == company_id)
            .first()
        )
    return (
        db.query(WhiteLabelConfig)
        .join(Company)
        .filter(Company.is_white_label_owner.is_(True))
        .first()
    )
