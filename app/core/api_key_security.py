import hashlib
import secrets
from datetime import datetime

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.api_key import ApiKey

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def _get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_api_key() -> tuple[str, str, str]:
    """
    Generate a new API key.
    Returns: (full_key, key_prefix, hashed_key)
    """
    raw = "sk_grd_" + secrets.token_urlsafe(32)
    prefix = raw[:12]
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, prefix, hashed


def hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def validate_api_key(
    api_key: str = Security(API_KEY_HEADER),
    db: Session = Depends(_get_db),
) -> ApiKey:
    """
    FastAPI dependency — validates X-API-Key header against the DB.
    Raises 401 if key is missing or invalid.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header.",
        )
    hashed = hash_key(api_key)
    key_record = db.query(ApiKey).filter(
        ApiKey.hashed_key == hashed,
        ApiKey.is_active == True,
    ).first()

    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key.",
        )
    # Update last-used timestamp
    key_record.last_used_at = datetime.utcnow()
    db.commit()
    return key_record
