from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import OfferVisibilityRule
from app.schemas import WhiteLabelConfigResponse
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
        )
    return config


@router.get("/offers/public")
def public_offers(db: Session = Depends(get_db)):
    """Only returns offers approved for public visibility."""
    offers = (
        db.query(OfferVisibilityRule)
        .filter(OfferVisibilityRule.is_active.is_(True), OfferVisibilityRule.visibility == "public")
        .all()
    )
    return [{"offer_name": o.offer_name, "company_id": str(o.company_id)} for o in offers]
