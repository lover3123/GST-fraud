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
from app.utils.ml import mock_anomaly_score
from app.utils.rules import find_duplicate_irns, is_valid_gstin


logger = get_task_logger(__name__)


def _is_missing(value) -> bool:
    return value is None or pd.isna(value)


def _pick_first(row: dict, *keys: str):
    for key in keys:
        if key in row and not _is_missing(row[key]):
            return row[key]
    return None


def _parse_csv(path: str) -> list[dict]:
    df = pd.read_csv(path)
    records: list[dict] = []
    for row in df.to_dict(orient="records"):
        irn = _pick_first(row, "irn", "IRN", "invoice_id", "Invoice_ID", "invoice_number", "Invoice_Number")
        vendor_gstin = _pick_first(
            row,
            "vendor_gstin",
            "Vendor_GSTIN",
            "vendorGSTIN",
            "supplier_gstin",
            "Supplier_GSTIN",
            "GSTIN_Supplier",
        )
        invoice_date = _pick_first(
            row,
            "invoice_date",
            "Invoice_Date",
            "invoiceDate",
            "date",
            "Date",
        )
        taxable_value = _pick_first(
            row,
            "taxable_value",
            "Taxable_Value",
            "taxableAmount",
            "invoice_amount",
            "Invoice_Amount",
            "total_amount",
            "Total_Amount",
        )
        record = {
            "irn": str(irn or "").strip(),
            "vendor_gstin": str(vendor_gstin or "").strip().upper(),
            "invoice_date": invoice_date,
            "taxable_value": float(taxable_value or 0.0),
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
            logger.info("Parsing file %s with extension %s", path, ext)
            if ext == ".csv":
                csv_records = _parse_csv(path)
                logger.info("Parsed %d records from CSV", len(csv_records))
                records.extend(csv_records)
            elif ext == ".pdf":
                pdf_records = _parse_pdf(path)
                logger.info("Parsed %d records from PDF", len(pdf_records))
                records.extend(pdf_records)
        
        logger.info("Total records parsed: %d", len(records))

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

        invoices_added = 0
        for record in records:
            irn = record.get("irn") or f"IRN-{uuid.uuid4().hex[:16]}"
            vendor_gstin = (record.get("vendor_gstin") or "").upper()
            invoice_date = _normalize_date(record.get("invoice_date"))
            taxable_value = float(record.get("taxable_value") or 0.0)

            rule_flags = []
            if irn in duplicate_irns or irn in existing_irns:
                rule_flags.append("duplicate_irn")
            if not is_valid_gstin(vendor_gstin):
                rule_flags.append("invalid_gstin")

            score, explanation = mock_anomaly_score()
            if rule_flags:
                explanation = {"rules": rule_flags, **explanation}

            status = InvoiceStatus.CLEAN
            if rule_flags or score >= 0.7:
                status = InvoiceStatus.FLAGGED

            if irn not in existing_irns:
                invoice = Invoice(
                    irn=irn,
                    client_id=None,
                    vendor_gstin=vendor_gstin,
                    batch_id=batch_id,
                    invoice_date=invoice_date,
                    taxable_value=taxable_value,
                    risk_score=score,
                    ai_explanation=explanation,
                    status=status,
                )
                db.add(invoice)
                existing_irns.add(irn)
                invoices_added += 1

        logger.info("Added %d invoices to batch %s", invoices_added, batch_id)
        batch.status = "COMPLETED"
        batch.completed_at = datetime.utcnow()
        db.commit()
        logger.info("Batch %s completed successfully", batch_id)
    except Exception:
        db.rollback()
        batch = db.get(Batch, batch_id)
        if batch:
            batch.status = "FAILED"
            batch.completed_at = datetime.utcnow()
            db.commit()
        logger.exception("Batch processing failed: %s", batch_id)
        raise
    finally:
        db.close()
