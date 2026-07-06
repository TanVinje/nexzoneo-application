from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.utils import as_id

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Company, Order, OrderItem, Product, User
from app.schemas import (
    CompanyResponse,
    CompanyUpdate,
    OrderResponse,
    OrderStatusUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    WhiteLabelConfigResponse,
    WhiteLabelConfigUpdate,
)
from app.services.order_serialization import serialize_order
from app.services.order_service import update_order_status

router = APIRouter(prefix="/seller", tags=["seller"])

ORDER_LOAD = (
    joinedload(Order.items).joinedload(OrderItem.product),
    joinedload(Order.company),
    joinedload(Order.user),
)


@router.post("/products", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    if not user.company_id:
        raise HTTPException(status_code=400, detail="Seller has no company")
    payload = data.model_dump()
    payload["category_id"] = as_id(payload["category_id"])
    product = Product(company_id=user.company_id, **payload)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    product = db.query(Product).filter(Product.id == as_id(product_id), Product.company_id == user.company_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        if key.endswith("_id") and value is not None:
            value = as_id(value)
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    from app.models import OrderItem, ProductRating

    product = db.query(Product).filter(Product.id == as_id(product_id), Product.company_id == user.company_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    in_orders = db.query(OrderItem).filter(OrderItem.product_id == product.id).count() > 0
    if in_orders:
        product.is_available = False
        db.commit()
        return {
            "ok": True,
            "soft_deleted": True,
            "message": "This product appears in past orders, so it was hidden from the store instead of permanently deleted.",
        }

    db.query(ProductRating).filter(ProductRating.product_id == product.id).delete()
    db.delete(product)
    db.commit()
    return {"ok": True, "soft_deleted": False, "message": "Product deleted"}


@router.get("/products", response_model=List[ProductResponse])
def seller_products(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    return db.query(Product).filter(Product.company_id == user.company_id).all()


@router.get("/orders", response_model=List[OrderResponse])
def seller_orders(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    orders = (
        db.query(Order)
        .options(*ORDER_LOAD)
        .filter(Order.company_id == user.company_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [serialize_order(o, include_customer=True) for o in orders]


@router.get("/orders/{order_id}", response_model=OrderResponse)
def seller_order_detail(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    order = (
        db.query(Order)
        .options(*ORDER_LOAD)
        .filter(Order.id == as_id(order_id), Order.company_id == user.company_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order, include_customer=True)


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
def seller_update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    order = db.query(Order).filter(Order.id == as_id(order_id), Order.company_id == user.company_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    update_order_status(db, order, data.status)
    order = (
        db.query(Order)
        .options(*ORDER_LOAD)
        .filter(Order.id == as_id(order_id))
        .first()
    )
    return serialize_order(order, include_customer=True)


@router.get("/company", response_model=CompanyResponse)
def get_seller_company(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    if not user.company_id:
        raise HTTPException(status_code=404, detail="No company linked")
    company = db.query(Company).filter(Company.id == user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("/company", response_model=CompanyResponse)
def update_seller_company(
    data: CompanyUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    if not user.company_id:
        raise HTTPException(status_code=404, detail="No company linked")
    company = db.query(Company).filter(Company.id == user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return company


@router.get("/white-label/config", response_model=WhiteLabelConfigResponse)
def get_seller_white_label(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    from app.models import WhiteLabelConfig

    config = db.query(WhiteLabelConfig).filter(WhiteLabelConfig.company_id == user.company_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config


@router.put("/white-label/config", response_model=WhiteLabelConfigResponse)
def update_seller_white_label(
    data: WhiteLabelConfigUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("seller", "admin")),
):
    from app.models import WhiteLabelConfig

    config = db.query(WhiteLabelConfig).filter(WhiteLabelConfig.company_id == user.company_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config
