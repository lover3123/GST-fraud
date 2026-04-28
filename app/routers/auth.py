import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import select

from app.core.security import create_access_token, decode_token, verify_password
from app.db.session import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/auth/login", response_model=Token)
def login(request: LoginRequest) -> Token:
    db = SessionLocal()
    try:
        user = db.execute(
            select(User).where(User.username == request.username)
        ).scalar_one_or_none()

        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")

        token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
        return Token(
            access_token=token,
            token_type="bearer",
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name,
            },
        )
    finally:
        db.close()


@router.get("/auth/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = SessionLocal()
    try:
        user = db.execute(
            select(User).where(User.username == payload.get("sub"))
        ).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
        }
    finally:
        db.close()
