"""
app/core/syndicate.py
======================
Cross-GSTIN Syndicate Clustering Detection.

The Fraud Pattern:
    Automated fraud rings generate hundreds of invoices with near-identical
    taxable values (e.g., ₹49,800) across many DIFFERENT vendor GSTINs to stay
    under e-way bill and PAN mandatory thresholds (₹50,000 / ₹2,00,000).
    This "structuring" pattern is hard to see looking at one vendor at a time
    — you must look ACROSS all vendors simultaneously.

Algorithm:
    1. For the current invoice's taxable_value, search the ENTIRE invoices
       table for other vendor GSTINs billing within ±0.5% of that value.
    2. In a 30-day time window, count how many DISTINCT GSTINs (not just
       invoices) share this near-identical value.
    3. If >= 3 distinct GSTINs share the same suspicious amount in 30 days,
       it is statistically implausible and signals a coordinated syndicate.

XAI Output:
    "High Risk: ₹49,800 was billed by 7 distinct vendor GSTINs within
    30 days — a statistically improbable clustering pattern suggesting
    a coordinated fraud syndicate."
"""

from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.models.invoice import Invoice

# Regulatory thresholds that fraudsters target
REGULATORY_THRESHOLDS = [50_000.0, 1_00_000.0, 2_00_000.0]
TOLERANCE_PCT = 0.005      # 0.5% below the threshold
MIN_DISTINCT_GSTINS = 3    # Minimum distinct GSTINs to flag as syndicate
WINDOW_DAYS = 30


def _to_date(val) -> date:
    return val.date() if isinstance(val, datetime) else val


def detect_cross_entity_syndicate(
    current_invoice: Invoice,
    db: Session,
) -> tuple[bool, float, str]:
    """
    Detects coordinated syndicate patterns by finding near-identical
    taxable values billed by MULTIPLE DISTINCT vendor GSTINs.

    Args:
        current_invoice: The invoice being evaluated.
        db: Active SQLAlchemy session.

    Returns:
        (is_flagged: bool, score: float, explanation: str)
    """
    curr_val = float(current_invoice.taxable_value)
    curr_date = _to_date(current_invoice.invoice_date)
    window_start = curr_date - timedelta(days=WINDOW_DAYS)

    # Check if current value is near a regulatory threshold
    matched_threshold = None
    for threshold in REGULATORY_THRESHOLDS:
        lower = threshold * (1 - TOLERANCE_PCT)
        if lower <= curr_val <= threshold:
            matched_threshold = threshold
            break

    if not matched_threshold:
        # Even if not near a threshold, check for general suspicious clustering
        # across any value — look for 5+ distinct GSTINs with nearly identical amount
        lower = curr_val * 0.995
        upper = curr_val * 1.005
        matched_threshold = None  # No specific threshold, general check
    else:
        lower = matched_threshold * (1 - TOLERANCE_PCT)
        upper = matched_threshold

    # Count DISTINCT vendor GSTINs with near-identical amounts in the time window
    result = db.execute(
        select(
            func.count(Invoice.vendor_gstin.distinct()).label("distinct_gstins"),
            func.count(Invoice.irn).label("total_invoices"),
        )
        .where(
            and_(
                Invoice.invoice_date >= window_start,
                Invoice.invoice_date <= curr_date,
                Invoice.taxable_value >= lower,
                Invoice.taxable_value <= upper,
                Invoice.vendor_gstin != current_invoice.vendor_gstin,  # exclude self
            )
        )
    ).first()

    distinct_gstins = int(result.distinct_gstins) if result else 0
    total_invoices = int(result.total_invoices) if result else 0

    # Add 1 to include the current vendor itself
    total_distinct = distinct_gstins + 1
    total_invoices_incl = total_invoices + 1

    if total_distinct >= MIN_DISTINCT_GSTINS:
        threshold_label = f"₹{int(matched_threshold):,} threshold" if matched_threshold else f"₹{curr_val:,.0f}"
        score = min(0.99, 0.70 + (total_distinct * 0.05))
        return (
            True,
            score,
            f"Critical — Syndicate Pattern: ₹{curr_val:,.0f} was billed by "
            f"{total_distinct} distinct vendor GSTINs ({total_invoices_incl} total invoices) "
            f"within {WINDOW_DAYS} days near the {threshold_label}. "
            f"This statistically improbable clustering strongly suggests coordinated fraud."
        )

    return (
        False,
        0.0,
        "No cross-entity syndicate clustering detected for this invoice value."
    )
