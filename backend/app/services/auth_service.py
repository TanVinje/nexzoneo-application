from decimal import Decimal
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import Company, User, WhiteLabelConfig
from app.schemas import UserCreate


def register_user(db: Session, data: UserCreate) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    company_id = None
    if data.role == "seller":
        if not data.company_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name required for seller registration",
            )
        company = Company(name=data.company_name)
        db.add(company)
        db.flush()
        company_id = company.id
        db.add(
            WhiteLabelConfig(
                company_id=company.id,
                app_name=data.company_name,
                primary_color="#141B4D",
                secondary_color="#53619A",
            )
        )

    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=get_password_hash(data.password),
        role=data.role,
        company_id=company_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


def create_user_token(user: User) -> str:
    return create_access_token({"sub": str(user.id), "role": user.role})
