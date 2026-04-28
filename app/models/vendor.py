from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vendor(Base):
    __tablename__ = "vendors"

    gstin: Mapped[str] = mapped_column(String(20), primary_key=True)
    legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    aggregated_risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
