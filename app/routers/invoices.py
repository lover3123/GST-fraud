import logging
import os
import tempfile
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from redis import RedisError
from sqlalchemy import func, select

from app.core.redis import get_redis_client
from app.db.session import SessionLocal
from app.models.batch import Batch
from app.models.invoice import Invoice
from app.tasks.ingestion import process_batch


logger = logging.getLogger(__name__)
router = APIRouter()


def _queue_is_available() -> bool:
    try:
        get_redis_client().ping()
        return True
    except RedisError:
        return False


@router.post("/invoices/bulk-upload", status_code=202)
def bulk_upload(files: list[UploadFile] = File(...)) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    temp_dir = tempfile.mkdtemp(prefix="gst_guardian_")
    file_paths: list[str] = []

    for upload in files:
        ext = os.path.splitext(upload.filename or "")[1].lower()
        if ext not in {".pdf", ".csv"}:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        file_id = uuid.uuid4().hex
        temp_path = os.path.join(temp_dir, f"{file_id}{ext}")
        with open(temp_path, "wb") as buffer:
            buffer.write(upload.file.read())
        file_paths.append(temp_path)

    batch_id = str(uuid.uuid4())
    db = SessionLocal()
    try:
        db.add(Batch(id=batch_id, status="PENDING"))
        db.commit()
    finally:
        db.close()

    if _queue_is_available():
        try:
            process_batch.delay(batch_id, file_paths)
            return {"batch_id": batch_id, "status": "PENDING"}
        except Exception as e:
            logger.warning("Failed to queue task, falling back to sync: %s", e)

    try:
        # Call synchronously when Redis is not available
        process_batch(batch_id, file_paths)
        return {"batch_id": batch_id, "status": "COMPLETED"}
    except Exception as exc:
        logger.error("Batch processing failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/batches/{batch_id}")
def get_batch_status(batch_id: str) -> dict:
    db = SessionLocal()
    try:
        batch = db.get(Batch, batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        total = db.execute(
            select(func.count()).select_from(Invoice).where(Invoice.batch_id == batch_id)
        ).scalar_one()

        return {
            "batch_id": batch.id,
            "status": batch.status,
            "created_at": batch.created_at.isoformat(),
            "completed_at": batch.completed_at.isoformat() if batch.completed_at else None,
            "invoice_count": total,
        }
    finally:
        db.close()


@router.get("/invoices")
def list_invoices(batch_id: str | None = None) -> dict:
    db = SessionLocal()
    try:
        query = select(Invoice)
        if batch_id:
            query = query.where(Invoice.batch_id == batch_id)

        invoices = db.execute(query.order_by(Invoice.invoice_date.desc())).scalars().all()
        items = [
            {
                "irn": invoice.irn,
                "vendor_gstin": invoice.vendor_gstin,
                "invoice_date": invoice.invoice_date.isoformat(),
                "taxable_value": invoice.taxable_value,
                "risk_score": invoice.risk_score,
                "ai_explanation": invoice.ai_explanation,
                "status": invoice.status,
                "batch_id": invoice.batch_id,
            }
            for invoice in invoices
        ]
        return {"items": items}
    finally:
        db.close()


from app.schemas.invoice import InvoiceDetectRequest, InvoiceDetectResponse
from app.core.analyzer import BehavioralAnalyzer
from datetime import datetime

@router.post("/detect", response_model=InvoiceDetectResponse)
def detect_fraud(payload: InvoiceDetectRequest):
    """
    Real-Time Detection API:
    Instantly scores an invoice without saving it to a batch.
    """
    db = SessionLocal()
    try:
        # Create a mock Invoice object to pass into the Analyzer
        # It won't be saved unless we commit, which we don't.
        mock_invoice = Invoice(
            irn=payload.irn,
            vendor_gstin=payload.vendor_gstin,
            invoice_date=payload.invoice_date,
            taxable_value=payload.taxable_value,
            hsn_code=payload.hsn_code
        )
        
        analyzer = BehavioralAnalyzer(db)
        verdict = analyzer.run_all_checks(mock_invoice)
        
        return InvoiceDetectResponse(
            irn=payload.irn,
            status=verdict["status"],
            risk_score=verdict["risk_score"],
            ai_explanation=verdict["ai_explanation"]
        )
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
