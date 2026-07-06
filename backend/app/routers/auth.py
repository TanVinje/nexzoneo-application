from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import get_password_hash, verify_password
from app.schemas import LoginRequest, PasswordUpdate, ProfileUpdate, PushTokenUpdate, Token, UserCreate, UserResponse
from app.services.auth_service import authenticate_user, create_user_token, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, data)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    return Token(access_token=create_user_token(user))


@router.get("/me", response_model=UserResponse)
def me(user=Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.put("/password")
def change_password(data: PasswordUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"ok": True}


@router.put("/push-token")
def update_push_token(data: PushTokenUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user.push_token = data.push_token
    db.commit()
    return {"ok": True}
