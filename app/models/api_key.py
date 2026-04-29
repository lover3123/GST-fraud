from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)          # Human label e.g. "Tally Integration"
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)     # First 8 chars shown in UI e.g. "sk_grd_ab"
    hashed_key: Mapped[str] = mapped_column(String(256), nullable=False, unique=True)  # SHA-256 of full key
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
