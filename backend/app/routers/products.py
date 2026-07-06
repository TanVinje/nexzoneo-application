from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.utils import as_id

from app.core.database import get_db
from app.models import Category, Company, Product
from app.schemas import CategoryResponse, CompanyResponse, ProductResponse
from app.services.ranking_service import get_white_label_config, rank_products

router = APIRouter(tags=["products"])


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.get("/products", response_model=List[ProductResponse])
def list_products(
    q: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    company_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Product).options(
        joinedload(Product.company), joinedload(Product.category)
    ).filter(Product.is_available.is_(True), Product.stock_quantity > 0)
    if category_id:
        query = query.filter(Product.category_id == as_id(category_id))
    if company_id:
        query = query.filter(Product.company_id == as_id(company_id))
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))

    products = query.all()
    wl = get_white_label_config(db, str(company_id) if company_id else None)
    wl_id = str(wl.company_id) if wl else None
    boost = wl.ranking_boost_enabled if wl else True
    ranked = rank_products(products, q or "", lat, lon, wl_id, boost)
    return ranked


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(joinedload(Product.company), joinedload(Product.category))
        .filter(Product.id == as_id(product_id))
        .first()
    )
    if not product:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/companies", response_model=List[CompanyResponse])
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()


@router.get("/companies/{company_id}", response_model=CompanyResponse)
def get_company(company_id: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == as_id(company_id)).first()
    if not company:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Company not found")
    return company
