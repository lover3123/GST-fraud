from datetime import datetime, date, timedelta
from typing import NamedTuple, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

# Import the actual ORM model for querying
from app.models.invoice import Invoice

class BehavioralVerdict(NamedTuple):
    is_anomaly: bool
    severity: str  # "RED", "AMBER", or "CLEAN"
    human_reason: Optional[str]


def _to_date(val) -> date:
    if isinstance(val, datetime):
         return val.date()
    return val


def analyze_vendor_velocity(current_invoice: Invoice, db: Session) -> BehavioralVerdict:
    """
    Dormancy & Velocity Analysis:
    Checks if a vendor has been dormant for >180 days and suddenly bills >200% of their historical average.
    """
    # Get the last invoice before the current one
    last_invoice = db.execute(
        select(Invoice.invoice_date)
        .where(
            and_(
                Invoice.vendor_gstin == current_invoice.vendor_gstin,
                Invoice.irn != current_invoice.irn,
                Invoice.invoice_date <= current_invoice.invoice_date
            )
        )
        .order_by(Invoice.invoice_date.desc())
        .limit(1)
    ).scalar_one_or_none()

    if not last_invoice:
        return BehavioralVerdict(False, "CLEAN", None)

    curr_date = _to_date(current_invoice.invoice_date)
    last_date = _to_date(last_invoice)
    time_gap = (curr_date - last_date).days

    if time_gap > 180:
        # Vendor is "Recently Awakened". Calculate average over last 24 months.
        two_years_ago = curr_date - timedelta(days=730)
        
        avg_result = db.execute(
            select(func.avg(Invoice.taxable_value))
            .where(
                and_(
                    Invoice.vendor_gstin == current_invoice.vendor_gstin,
                    Invoice.invoice_date >= two_years_ago,
                    Invoice.irn != current_invoice.irn
                )
            )
        ).scalar_one_or_none()
        
        historical_avg = float(avg_result) if avg_result else 0.0

        if historical_avg > 0 and current_invoice.taxable_value > (historical_avg * 2.0):
             pct_above = int((current_invoice.taxable_value / historical_avg) * 100)
             return BehavioralVerdict(
                 is_anomaly=True,
                 severity="RED",
                 human_reason=f"High Risk: Vendor was dormant for {time_gap} days and has suddenly billed {pct_above}% of their historical average."
             )
             
    return BehavioralVerdict(False, "CLEAN", None)


def check_filing_proximity(current_invoice: Invoice, db: Session) -> BehavioralVerdict:
    """
    Deadline Proximity Analysis (The "GSTR-1 Spike"):
    Checks if an invoice is billed near the 10th/11th, and if >80% of volume historically is on these days.
    """
    curr_date = _to_date(current_invoice.invoice_date)
    
    # Is current invoice within 24 hours of 10th or 11th?
    # Which means 9th, 10th, 11th, 12th.
    if curr_date.day not in [9, 10, 11, 12]:
         return BehavioralVerdict(False, "CLEAN", None)

    # Calculate historical volume
    annual_volume_query = db.execute(
         select(func.sum(Invoice.taxable_value), func.count(Invoice.irn))
         .where(
             and_(
                 Invoice.vendor_gstin == current_invoice.vendor_gstin,
                 Invoice.irn != current_invoice.irn
             )
         )
    ).first()
    
    total_volume = float(annual_volume_query[0]) if annual_volume_query and annual_volume_query[0] else 0.0
    total_count = int(annual_volume_query[1]) if annual_volume_query and annual_volume_query[1] else 0
    
    if total_count < 5 or total_volume == 0.0:
        return BehavioralVerdict(False, "CLEAN", None)

    # Get all historical invoices
    all_historical = db.execute(
        select(Invoice.invoice_date, Invoice.taxable_value)
        .where(
            and_(
                Invoice.vendor_gstin == current_invoice.vendor_gstin,
                Invoice.irn != current_invoice.irn
            )
        )
    ).all()
    
    spike_volume = 0.0
    for inv_date, val in all_historical:
        d = _to_date(inv_date)
        if d.day in [9, 10, 11, 12]:
             spike_volume += float(val)
             
    spike_ratio = spike_volume / total_volume

    if spike_ratio > 0.80:
         return BehavioralVerdict(
             is_anomaly=True,
             severity="AMBER",
             human_reason=f"Medium Risk: {int(spike_ratio*100)}% of this vendor's billing history is concentrated immediately before tax filing deadlines, suggesting artificial ITC generation."
         )

    return BehavioralVerdict(False, "CLEAN", None)


def detect_structuring_attempts(current_invoice: Invoice, db: Session) -> BehavioralVerdict:
    """
    Threshold Clustering (The "Anti-Structuring" Rule):
    Searches for multiple invoices in a 30-day window just below regulatory thresholds (e.g. 50k, 2L).
    """
    REGULATORY_THRESHOLDS = [50000.0, 200000.0]
    
    curr_date = _to_date(current_invoice.invoice_date)
    curr_val = float(current_invoice.taxable_value)
    
    # Check if current invoice is near a threshold (98% to 99.9%)
    matched_threshold = None
    for threshold in REGULATORY_THRESHOLDS:
        lower_bound = threshold * 0.98
        upper_bound = threshold * 0.999
        if lower_bound <= curr_val <= upper_bound:
            matched_threshold = threshold
            break
            
    if not matched_threshold:
        return BehavioralVerdict(False, "CLEAN", None)
        
    # Look back 30 days for similar clustering
    window_start = curr_date - timedelta(days=30)
    
    lower_bound = matched_threshold * 0.98
    upper_bound = matched_threshold * 0.999
    
    cluster_count = db.execute(
        select(func.count(Invoice.irn))
        .where(
            and_(
                Invoice.vendor_gstin == current_invoice.vendor_gstin,
                Invoice.invoice_date >= window_start,
                Invoice.invoice_date <= curr_date,
                Invoice.taxable_value >= lower_bound,
                Invoice.taxable_value <= upper_bound
            )
        )
    ).scalar_one()

    # The current invoice is already in DB conceptually, or if it isn't, we add 1 to the cluster count
    # Since we assume current_invoice might NOT be committed yet (e.g. during batch processing),
    # cluster_count includes historical ones. Total = cluster_count + 1
    total_cluster = cluster_count + 1
    
    if total_cluster >= 3:
         return BehavioralVerdict(
             is_anomaly=True,
             severity="RED",
             human_reason=f"High Risk: Repeated billing just below the ₹{int(matched_threshold):,} e-Way bill/PAN threshold detected ({total_cluster} invoices in 30 days) - Structuring Pattern."
         )

    return BehavioralVerdict(False, "CLEAN", None)
