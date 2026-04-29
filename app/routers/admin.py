from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.api_key_security import generate_api_key
from app.db.session import SessionLocal
from app.models.api_key import ApiKey

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ──────────────────────────────────────────────────────────────────

class CreateApiKeyRequest(BaseModel):
    name: str  # Human label e.g. "Tally Integration"

class ApiKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None

class CreateApiKeyResponse(ApiKeyResponse):
    full_key: str  # Only shown ONCE on creation


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/admin/api-keys", response_model=CreateApiKeyResponse, status_code=201)
def create_api_key(payload: CreateApiKeyRequest, db: Session = Depends(get_db)):
    """
    Create a new API key. The full_key is shown only once — store it securely.
    """
    full_key, prefix, hashed = generate_api_key()
    record = ApiKey(
        name=payload.name,
        key_prefix=prefix,
        hashed_key=hashed,
        is_active=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return CreateApiKeyResponse(
        id=record.id,
        name=record.name,
        key_prefix=record.key_prefix,
        is_active=record.is_active,
        created_at=record.created_at,
        last_used_at=record.last_used_at,
        full_key=full_key,
    )


@router.get("/admin/api-keys", response_model=list[ApiKeyResponse])
def list_api_keys(db: Session = Depends(get_db)):
    """
    List all API keys (partial prefix only — never exposes the full key again).
    """
    keys = db.query(ApiKey).order_by(ApiKey.created_at.desc()).all()
    return [
        ApiKeyResponse(
            id=k.id,
            name=k.name,
            key_prefix=k.key_prefix,
            is_active=k.is_active,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
        )
        for k in keys
    ]


@router.delete("/admin/api-keys/{key_id}", status_code=204)
def revoke_api_key(key_id: int, db: Session = Depends(get_db)):
    """
    Permanently revoke (delete) an API key by ID.
    """
    record = db.get(ApiKey, key_id)
    if not record:
        raise HTTPException(status_code=404, detail="API key not found.")
    db.delete(record)
    db.commit()
