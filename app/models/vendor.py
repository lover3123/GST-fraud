from datetime import datetime

from sqlalchemy import Float, String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vendor(Base):
    __tablename__ = "vendors"

    gstin: Mapped[str] = mapped_column(String(20), primary_key=True)
    legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    aggregated_risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_active: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.utcnow)
    metadata_history: Mapped[dict | None] = mapped_column(JSON, nullable=True)
