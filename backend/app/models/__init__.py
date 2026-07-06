import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def uuid_col():
    return Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


def uuid_fk(table: str, nullable: bool = False):
    return Column(String(36), ForeignKey(f"{table}.id"), nullable=nullable)


class User(Base):
    __tablename__ = "users"

    id = uuid_col()
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    phone = Column(Text)
    saved_address = Column(Text)
    push_token = Column(Text)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)
    company_id = uuid_fk("companies", nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    company = relationship("Company", back_populates="sellers", foreign_keys=[company_id])
    orders = relationship("Order", back_populates="user")
    product_ratings = relationship("ProductRating", back_populates="user")
    seller_ratings = relationship("SellerRating", back_populates="user")

    __table_args__ = (
        CheckConstraint("role IN ('customer','seller','admin')", name="user_role_check"),
    )


class Company(Base):
    __tablename__ = "companies"

    id = uuid_col()
    name = Column(Text, nullable=False)
    logo_url = Column(Text)
    description = Column(Text)
    address = Column(Text)
    latitude = Column(Numeric(10, 7))
    longitude = Column(Numeric(10, 7))
    email = Column(Text)
    phone = Column(Text)
    rating_average = Column(Numeric(3, 2), default=0)
    rating_count = Column(Integer, default=0)
    is_white_label_owner = Column(Boolean, default=False)
    brand_primary_color = Column(Text, default="#141B4D")
    brand_secondary_color = Column(Text, default="#53619A")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    sellers = relationship("User", back_populates="company", foreign_keys="User.company_id")
    products = relationship("Product", back_populates="company")
    orders = relationship("Order", back_populates="company")
    white_label_config = relationship("WhiteLabelConfig", back_populates="company", uselist=False)


class Category(Base):
    __tablename__ = "categories"

    id = uuid_col()
    name = Column(Text, nullable=False)
    icon_url = Column(Text)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = uuid_col()
    company_id = uuid_fk("companies")
    category_id = uuid_fk("categories")
    name = Column(Text, nullable=False)
    description = Column(Text)
    image_url = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    order_method = Column(String(20), default="delivery")
    rating_average = Column(Numeric(3, 2), default=0)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    company = relationship("Company", back_populates="products")
    category = relationship("Category", back_populates="products")
    ratings = relationship("ProductRating", back_populates="product")

    __table_args__ = (
        CheckConstraint(
            "order_method IN ('delivery','pickup','shipping','request')",
            name="product_order_method_check",
        ),
    )


class Order(Base):
    __tablename__ = "orders"

    id = uuid_col()
    user_id = uuid_fk("users")
    company_id = uuid_fk("companies")
    status = Column(String(30), default="Pending")
    payment_status = Column(String(30), default="unpaid")
    total_price = Column(Numeric(10, 2), nullable=False)
    order_method = Column(String(20), default="delivery")
    delivery_address = Column(Text)
    stripe_checkout_session_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="orders")
    company = relationship("Company", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = uuid_col()
    order_id = uuid_fk("orders")
    product_id = uuid_fk("products")
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class ProductRating(Base):
    __tablename__ = "product_ratings"

    id = uuid_col()
    user_id = uuid_fk("users")
    product_id = uuid_fk("products")
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="product_ratings")
    product = relationship("Product", back_populates="ratings")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="product_rating_check"),
        UniqueConstraint("user_id", "product_id", name="unique_user_product_rating"),
    )


class SellerRating(Base):
    __tablename__ = "seller_ratings"

    id = uuid_col()
    user_id = uuid_fk("users")
    company_id = uuid_fk("companies")
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="seller_ratings")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="seller_rating_check"),
        UniqueConstraint("user_id", "company_id", name="unique_user_company_rating"),
    )


class WhiteLabelConfig(Base):
    __tablename__ = "white_label_configs"

    id = uuid_col()
    company_id = Column(String(36), ForeignKey("companies.id"), unique=True, nullable=False)
    app_name = Column(Text, default="Nexzoneo")
    logo_url = Column(Text)
    primary_color = Column(Text, default="#141B4D")
    secondary_color = Column(Text, default="#53619A")
    marketplace_mode_enabled = Column(Boolean, default=True)
    ranking_boost_enabled = Column(Boolean, default=True)
    welcome_text = Column(Text, default="Welcome to your local marketplace")

    company = relationship("Company", back_populates="white_label_config")


class OfferVisibilityRule(Base):
    __tablename__ = "offer_visibility_rules"

    id = uuid_col()
    company_id = uuid_fk("companies")
    offer_name = Column(Text, nullable=False)
    visibility = Column(String(20), default="exclusive")
    approved_by = Column(Text)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        CheckConstraint(
            "visibility IN ('public','private','partner_only','exclusive')",
            name="offer_visibility_check",
        ),
    )
