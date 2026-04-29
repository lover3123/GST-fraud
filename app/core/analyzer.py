from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_
from app.models.invoice import Invoice
from app.core.statistics import check_benford_compliance
from app.core.behavioral import analyze_vendor_velocity, detect_structuring_attempts
from app.core.network import detect_circular_trading
from app.core.syndicate import detect_cross_entity_syndicate

class BehavioralAnalyzer:
    def __init__(self, db_session: Session):
        self.db = db_session

    def check_benford(self, current_invoice: Invoice) -> tuple[bool, float, str]:
        """
        Prompt 3.1: Statistical - Benford's Law for digit manipulation.
        """
        # Fetch historical amounts
        history = self.db.execute(
            select(Invoice.taxable_value)
            .where(Invoice.vendor_gstin == current_invoice.vendor_gstin)
        ).scalars().all()
        
        amounts = list(history) + [current_invoice.taxable_value]
        result = check_benford_compliance(amounts)
        
        is_flagged = result["risk_score"] >= 0.85
        return (is_flagged, result["risk_score"], result["risk_comment"])

    def check_dormancy(self, current_invoice: Invoice) -> tuple[bool, float, str]:
        """
        Prompt 3.2: Historical - Dormancy and Volume spikes.
        """
        verdict = analyze_vendor_velocity(current_invoice, self.db)
        is_flagged = verdict.is_anomaly
        score = 0.90 if verdict.severity == "RED" else 0.0
        explanation = verdict.human_reason or "Vendor history is active and volume is normal."
        return (is_flagged, score, explanation)

    def check_hsn_consistency(self, current_invoice: Invoice) -> tuple[bool, float, str]:
        """
        Prompt 3.3: Relational - HSN/SAC code shifts vs. Vendor Profile.
        """
        if not current_invoice.hsn_code:
            return (False, 0.0, "No HSN code provided on current invoice.")
            
        # Get historical HSN codes for this vendor
        historical_hsns = self.db.execute(
            select(Invoice.hsn_code)
            .where(
                and_(
                    Invoice.vendor_gstin == current_invoice.vendor_gstin,
                    Invoice.hsn_code.is_not(None),
                    Invoice.irn != current_invoice.irn
                )
            )
        ).scalars().all()
        
        if not historical_hsns:
            return (False, 0.0, "No historical HSN data to compare against.")
            
        # Find the most common historical HSN
        from collections import Counter
        most_common_hsn = Counter(historical_hsns).most_common(1)[0][0]
        
        # We assume first 2 digits represent the broad category
        if current_invoice.hsn_code[:2] != most_common_hsn[:2]:
            return (
                True, 
                0.80, 
                f"Vendor product mix shifted significantly (Historical primary HSN: {most_common_hsn}, Current: {current_invoice.hsn_code})."
            )
            
        return (False, 0.0, "HSN code is consistent with vendor history.")

    def check_clustering(self, current_invoice: Invoice) -> tuple[bool, float, str]:
        """
        Prompt 3.4: Syndicate - Clustering of values across multiple GSTINs / single GSTIN near thresholds.
        Checks for invoices within 0.5% of common regulatory thresholds.
        """
        # Let's use the explicit detect_structuring_attempts but adapt it for the 0.5% rule
        # Since we decoupled it, we can re-implement the exact 0.5% logic here for the wrapper.
        from datetime import date, datetime, timedelta
        
        def _to_date(val):
            return val.date() if isinstance(val, datetime) else val

        REGULATORY_THRESHOLDS = [50000.0, 100000.0, 200000.0]
        curr_val = float(current_invoice.taxable_value)
        
        matched_threshold = None
        for threshold in REGULATORY_THRESHOLDS:
            # Within 0.5% below the threshold
            if (threshold * 0.995) <= curr_val <= threshold:
                matched_threshold = threshold
                break
                
        if not matched_threshold:
            return (False, 0.0, "Invoice value is not near common regulatory thresholds.")
            
        curr_date = _to_date(current_invoice.invoice_date)
        window_start = curr_date - timedelta(days=30)
        
        lower_bound = matched_threshold * 0.995
        
        cluster_count = self.db.execute(
            select(func.count(Invoice.irn))
            .where(
                and_(
                    Invoice.vendor_gstin == current_invoice.vendor_gstin,
                    Invoice.invoice_date >= window_start,
                    Invoice.invoice_date <= curr_date,
                    Invoice.taxable_value >= lower_bound,
                    Invoice.taxable_value <= matched_threshold
                )
            )
        ).scalar_one()

        total_cluster = cluster_count + 1
        
        if total_cluster > 3:
             return (
                 True, 
                 0.95, 
                 f"Threshold Manipulation: Vendor has {total_cluster} invoices within 0.5% of ₹{int(matched_threshold):,} threshold in a 30-day window."
             )
             
        return (False, 0.0, "No threshold clustering detected.")

    def check_circular_trading(self, current_invoice: Invoice) -> tuple[bool, float, str]:
        """
        Prompt 3.5: Network — Circular billing loop detection (A→B→C→A).
        """
        return detect_circular_trading(current_invoice, self.db)

    def check_syndicate(self, current_invoice: Invoice) -> tuple[bool, float, str]:
        """
        Prompt 3.6: Syndicate — Cross-GSTIN value clustering across different vendors.
        """
        return detect_cross_entity_syndicate(current_invoice, self.db)

    def run_all_checks(self, current_invoice: Invoice) -> dict:
        """
        Runs all checks and aggregates the results into a final verdict.
        """
        results = {
            "benford": self.check_benford(current_invoice),
            "dormancy": self.check_dormancy(current_invoice),
            "hsn_consistency": self.check_hsn_consistency(current_invoice),
            "clustering": self.check_clustering(current_invoice),
            "circular_trading": self.check_circular_trading(current_invoice),
            "syndicate": self.check_syndicate(current_invoice),
        }
        
        explanations = []
        max_score = 0.0
        
        for check_name, (is_flagged, score, explanation) in results.items():
            if is_flagged:
                explanations.append(explanation)
                max_score = max(max_score, score)
                
        status = "FLAGGED" if explanations else "CLEAN"
        if max_score >= 0.90:
            status = "REJECTED" # Critical risk
            
        return {
            "status": status,
            "risk_score": max_score,
            "ai_explanation": explanations
        }
