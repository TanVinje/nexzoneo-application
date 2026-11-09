from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import OfferVisibilityRule
from app.schemas import PublicOfferResponse, WhiteLabelConfigResponse
from app.services.ranking_service import get_white_label_config

router = APIRouter(prefix="/white-label", tags=["white-label"])


@router.get("/config", response_model=WhiteLabelConfigResponse)
def get_config(
    company_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
):
    config = get_white_label_config(db, str(company_id) if company_id else None)
    if not config:
        return WhiteLabelConfigResponse(
            app_name="Nexzoneo",
            logo_url=None,
            primary_color="#141B4D",
            secondary_color="#53619A",
            marketplace_mode_enabled=True,
            ranking_boost_enabled=True,
            welcome_text="Welcome to Nexzoneo",
            delivery_fee_flat=0,
            tax_rate_percent=0,
            banner_title="Order ahead, skip the wait",
            banner_subtitle="Browse local favorites near you",
        )
    return config


@router.get("/offers/public", response_model=List[PublicOfferResponse])
def public_offers(db: Session = Depends(get_db)):
    """Promo banners for the customer home screen."""
    offers = (
        db.query(OfferVisibilityRule)
        .filter(OfferVisibilityRule.is_active.is_(True), OfferVisibilityRule.visibility == "public")
        .all()
    )
    return [
        PublicOfferResponse(
            offer_name=o.offer_name,
            offer_subtitle=o.offer_subtitle,
            offer_color=o.offer_color or "#141B4D",
            company_id=o.company_id,
        )
        for o in offers
    ]
