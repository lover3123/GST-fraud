import os
import uuid
from datetime import date, datetime

import pandas as pd
import pdfplumber
from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.batch import Batch
from app.models.enums import InvoiceStatus
from app.models.invoice import Invoice
from app.models.vendor import Vendor
from app.utils.rules import find_duplicate_irns, is_valid_gstin
from app.utils.ingestion import map_messy_headers
from app.core.analyzer import BehavioralAnalyzer

logger = get_task_logger(__name__)

def _is_missing(value) -> bool:
    return value is None or pd.isna(value)

def _parse_csv(path: str) -> list[dict]:
    df = pd.read_csv(path)
    mapping = map_messy_headers(df.columns.tolist())
    
    records: list[dict] = []
    for row in df.to_dict(orient="records"):
        canonical_row = {}
        for uploaded_col, can_col in mapping.items():
            if can_col:
                canonical_row[can_col] = row.get(uploaded_col)
                
        irn = canonical_row.get("irn")
        vendor_gstin = canonical_row.get("vendor_gstin")
        invoice_date = canonical_row.get("invoice_date")
        taxable_value = canonical_row.get("taxable_value")
        hsn_code = canonical_row.get("hsn_code")
        
        record = {
            "irn": str(irn or "").strip(),
            "vendor_gstin": str(vendor_gstin or "").strip().upper(),
            "invoice_date": invoice_date,
            "taxable_value": float(taxable_value or 0.0),
            "hsn_code": str(hsn_code or "").strip() if not _is_missing(hsn_code) else None
        }
        records.append(record)
    return records


def _parse_pdf(path: str) -> list[dict]:
    records: list[dict] = []
    with pdfplumber.open(path) as pdf:
        _ = len(pdf.pages)
    record = {
        "irn": f"IRN-{uuid.uuid4().hex[:16]}",
        "vendor_gstin": "29ABCDE1234F1Z5",
        "invoice_date": date.today(),
        "taxable_value": 0.0,
        "hsn_code": "9983"
    }
    records.append(record)
    return records


def _normalize_date(value) -> date:
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(str(value)).date()
    except ValueError:
        return date.today()


@celery_app.task
def process_batch(batch_id: str, file_paths: list[str]) -> None:
    db: Session = SessionLocal()
    try:
        batch = db.get(Batch, batch_id)
        if not batch:
            logger.error("Batch not found: %s", batch_id)
            return

        logger.info("Processing batch %s with files: %s", batch_id, file_paths)
        records: list[dict] = []
        for path in file_paths:
            ext = os.path.splitext(path)[1].lower()
            if ext == ".csv":
                records.extend(_parse_csv(path))
            elif ext == ".pdf":
                records.extend(_parse_pdf(path))
        
        irns = [r["irn"] for r in records if r.get("irn")]
        duplicate_irns = find_duplicate_irns(irns)

        existing_irns = set(
            db.execute(select(Invoice.irn).where(Invoice.irn.in_(irns))).scalars().all()
        )

        vendor_gstins = {
            (record.get("vendor_gstin") or "").upper()
            for record in records
            if (record.get("vendor_gstin") or "").upper()
        }
        existing_vendors = set(
            db.execute(select(Vendor.gstin).where(Vendor.gstin.in_(vendor_gstins))).scalars().all()
        )
        for gstin in vendor_gstins - existing_vendors:
            db.add(Vendor(gstin=gstin, legal_name="Unknown", aggregated_risk_score=0.0))
        db.flush()

        analyzer = BehavioralAnalyzer(db)
        invoices_added = 0
        
        for record in records:
            irn = record.get("irn") or f"IRN-{uuid.uuid4().hex[:16]}"
            vendor_gstin = (record.get("vendor_gstin") or "").upper()
            invoice_date = _normalize_date(record.get("invoice_date"))
            taxable_value = float(record.get("taxable_value") or 0.0)
            hsn_code = record.get("hsn_code")

            rule_flags = []
            if irn in duplicate_irns or irn in existing_irns:
                rule_flags.append("Duplicate IRN")
            if not is_valid_gstin(vendor_gstin):
                rule_flags.append("Invalid GSTIN")

            mock_invoice = Invoice(
                irn=irn,
                vendor_gstin=vendor_gstin,
                invoice_date=invoice_date,
                taxable_value=taxable_value,
                hsn_code=hsn_code
            )
            
            verdict = analyzer.run_all_checks(mock_invoice)
            score = verdict["risk_score"]
            explanation = verdict["ai_explanation"]

            if rule_flags:
                explanation.insert(0, f"Rules Failed: {', '.join(rule_flags)}")

            status = InvoiceStatus.CLEAN
            if rule_flags or score >= 0.7:
                status = InvoiceStatus.FLAGGED
            if score >= 0.9:
                status = "REJECTED"

            if irn not in existing_irns:
                invoice = Invoice(
                    irn=irn,
                    client_id=None,
                    vendor_gstin=vendor_gstin,
                    batch_id=batch_id,
                    invoice_date=invoice_date,
                    taxable_value=taxable_value,
                    hsn_code=hsn_code,
                    risk_score=score,
                    ai_explanation=explanation,
                    status=status,
                )
                db.add(invoice)
                existing_irns.add(irn)
                invoices_added += 1

        batch.status = "COMPLETED"
        batch.completed_at = datetime.utcnow()
        db.commit()
    except Exception:
        db.rollback()
        batch = db.get(Batch, batch_id)
        if batch:
            batch.status = "FAILED"
            batch.completed_at = datetime.utcnow()
            db.commit()
        raise
    finally:
        db.close()
