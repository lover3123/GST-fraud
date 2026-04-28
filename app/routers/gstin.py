import logging
import os
import re

import pandas as pd
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter()

_GSTIN_DATA: dict = {}


def _load_gstin_data() -> None:
    global _GSTIN_DATA
    csv_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../real_companies_gst_data.csv")
    )
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        for _, row in df.iterrows():
            key = str(row["gstin"]).strip().upper()
            _GSTIN_DATA[key] = row.to_dict()
        logger.info("Loaded %d GSTIN records", len(_GSTIN_DATA))
    else:
        logger.warning("GSTIN data CSV not found at %s", csv_path)


def _risk_label(score: float) -> str:
    if score < 0.3:
        return "LOW"
    elif score < 0.6:
        return "MEDIUM"
    return "HIGH"


def _get_flags(row: dict) -> list[str]:
    flags = []
    sales = float(row.get("annual_sales", 0) or 0)
    purchases = float(row.get("annual_purchases", 0) or 0)
    itc = float(row.get("itc_claimed", 0) or 0)
    refund = float(row.get("refund_claimed", 0) or 0)
    if sales > 0 and refund / sales > 0.05:
        flags.append("High refund-to-sales ratio")
    if purchases > 0 and itc / purchases > 0.85:
        flags.append("Excessive ITC claim relative to purchases")
    if purchases > sales > 0:
        flags.append("Purchases exceed reported sales")
    return flags or ["No anomalies detected"]


@router.get("/gstin/lookup")
def gstin_lookup(gstin: str) -> dict:
    if not _GSTIN_DATA:
        _load_gstin_data()

    gstin_upper = gstin.strip().upper()
    if not re.match(r"^[0-9A-Z]{15}$", gstin_upper):
        raise HTTPException(status_code=400, detail="Invalid GSTIN format. Must be 15 alphanumeric characters.")

    row = _GSTIN_DATA.get(gstin_upper)
    if not row:
        raise HTTPException(status_code=404, detail=f"GSTIN {gstin_upper} not found in database.")

    risk_score = float(row.get("risk_score", 0.0) or 0.0)
    return {
        "gstin": gstin_upper,
        "company_name": str(row.get("company_name", "Unknown")),
        "state": str(row.get("state", "Unknown")),
        "annual_sales": float(row.get("annual_sales", 0) or 0),
        "annual_purchases": float(row.get("annual_purchases", 0) or 0),
        "itc_claimed": float(row.get("itc_claimed", 0) or 0),
        "refund_claimed": float(row.get("refund_claimed", 0) or 0),
        "risk_score": risk_score,
        "risk_label": _risk_label(risk_score),
        "flags": _get_flags(row),
    }
