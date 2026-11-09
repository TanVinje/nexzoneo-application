from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: Optional[str] = None
    role: str = "customer"
    company_name: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str]
    saved_address: Optional[str] = None
    role: str
    company_id: Optional[UUID]

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    saved_address: Optional[str] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class PushTokenUpdate(BaseModel):
    push_token: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    icon_url: Optional[str]

    class Config:
        from_attributes = True


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    logo_url: Optional[str]
    description: Optional[str]
    address: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    email: Optional[str]
    phone: Optional[str]
    rating_average: Decimal
    rating_count: int
    is_white_label_owner: bool
    brand_primary_color: Optional[str]
    brand_secondary_color: Optional[str]

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: UUID
    company_id: UUID
    category_id: UUID
    name: str
    description: Optional[str]
    image_url: Optional[str]
    price: Decimal
    stock_quantity: int
    is_available: bool
    order_method: str
    rating_average: Decimal
    rating_count: int
    company: Optional[CompanyResponse] = None
    category: Optional[CategoryResponse] = None
    ranking_score: Optional[float] = None

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    category_id: UUID
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Decimal = Field(ge=0)
    stock_quantity: int = Field(ge=0, default=0)
    is_available: bool = True
    order_method: str = "delivery"


class ProductUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, ge=0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    is_available: Optional[bool] = None
    order_method: Optional[str] = None


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    company_id: UUID
    items: List[OrderItemCreate]
    order_method: str = "delivery"
    delivery_address: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class CustomerSummary(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None


class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID
    status: str
    payment_status: str
    subtotal: Decimal = Decimal("0")
    delivery_fee: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    total_price: Decimal
    order_method: str
    delivery_address: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    company: Optional[CompanyResponse] = None
    customer: Optional[CustomerSummary] = None

    class Config:
        from_attributes = True


class OrderQuoteRequest(BaseModel):
    company_id: UUID
    items: List[OrderItemCreate]
    order_method: str = "delivery"


class OrderQuoteResponse(BaseModel):
    subtotal: Decimal
    delivery_fee: Decimal
    tax_amount: Decimal
    total_price: Decimal
    tax_rate_percent: Decimal
    currency_note: str = "Amounts calculated server-side"


class PaymentConfigResponse(BaseModel):
    stripe_enabled: bool
    publishable_key: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class OrderStatusUpdate(BaseModel):
    status: str


class PaymentRequest(BaseModel):
    simulate_success: bool = True


class ProductRatingCreate(BaseModel):
    product_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class SellerRatingCreate(BaseModel):
    company_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class WhiteLabelConfigResponse(BaseModel):
    app_name: str
    logo_url: Optional[str]
    primary_color: str
    secondary_color: str
    marketplace_mode_enabled: bool
    ranking_boost_enabled: bool
    welcome_text: Optional[str]
    company_id: Optional[UUID] = None
    delivery_fee_flat: Decimal = Decimal("0")
    tax_rate_percent: Decimal = Decimal("0")
    banner_title: Optional[str] = None
    banner_subtitle: Optional[str] = None

    class Config:
        from_attributes = True


class WhiteLabelConfigUpdate(BaseModel):
    app_name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    marketplace_mode_enabled: Optional[bool] = None
    ranking_boost_enabled: Optional[bool] = None
    welcome_text: Optional[str] = None
    delivery_fee_flat: Optional[Decimal] = Field(default=None, ge=0)
    tax_rate_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    banner_title: Optional[str] = None
    banner_subtitle: Optional[str] = None


class PublicOfferResponse(BaseModel):
    offer_name: str
    offer_subtitle: Optional[str] = None
    offer_color: Optional[str] = None
    company_id: UUID
