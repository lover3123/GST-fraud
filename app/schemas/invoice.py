from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class InvoiceDetectRequest(BaseModel):
    irn: str = Field(..., description="Invoice Reference Number")
    vendor_gstin: str = Field(..., description="15-character GSTIN of the vendor")
    invoice_date: date = Field(..., description="Date of the invoice")
    taxable_value: float = Field(..., description="Pre-tax amount of the invoice")
    hsn_code: Optional[str] = Field(None, description="HSN/SAC Code")

class InvoiceDetectResponse(BaseModel):
    irn: str
    status: str
    risk_score: float
    ai_explanation: list[str]
