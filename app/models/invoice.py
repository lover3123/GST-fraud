from datetime import date

from sqlalchemy import JSON, Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import InvoiceStatus


class Invoice(Base):
    __tablename__ = "invoices"

    irn: Mapped[str] = mapped_column(String(64), primary_key=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True, index=True)
    vendor_gstin: Mapped[str] = mapped_column(ForeignKey("vendors.gstin"), nullable=False, index=True)
    batch_id: Mapped[str | None] = mapped_column(ForeignKey("batches.id"), nullable=True, index=True)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    taxable_value: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ai_explanation: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[InvoiceStatus] = mapped_column(String(20), nullable=False, default=InvoiceStatus.PENDING)
