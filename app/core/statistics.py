import math
import numpy as np
from scipy.stats import chisquare

def check_benford_compliance(amounts: list[float]) -> dict:
    """
    Checks if a list of invoice amounts complies with Benford's Law.
    
    Benford's Law states that in many naturally occurring collections of numbers, 
    the leading significant digit 'd' (1-9) occurs with probability:
        P(d) = log10(1 + 1/d)
    
    This function performs a Chi-squared Goodness-of-Fit test comparing the 
    actual frequency of leading digits against the theoretical Benford distribution.
    
    Args:
        amounts: List of taxable_value floats.
        
    Returns:
        dict: Contains chi_sq_stat, p_value, deviation_report, risk_comment, and risk_score.
    """
    if not amounts or len(amounts) < 10:
        return {
            "chi_sq_stat": 0.0,
            "p_value": 1.0,
            "deviation_report": [],
            "risk_comment": "Insufficient data to perform a reliable Benford's Law analysis (need at least 10 amounts).",
            "risk_score": 0.0
        }

    # Extract first significant digit
    leading_digits = []
    for amt in amounts:
        if amt and amt > 0:
            first_digit = int(str(abs(amt)).replace('.', '').lstrip('0')[0])
            leading_digits.append(first_digit)
            
    if not leading_digits:
        return {
            "chi_sq_stat": 0.0, "p_value": 1.0, "deviation_report": [],
            "risk_comment": "No valid amounts found for Benford's analysis.",
            "risk_score": 0.0
        }

    total_count = len(leading_digits)
    
    # Calculate actual frequencies
    actual_counts = [leading_digits.count(d) for d in range(1, 10)]
    
    # Calculate theoretical frequencies (Benford's Law: P(d) = log10(1 + 1/d))
    expected_probs = [math.log10(1 + 1/d) for d in range(1, 10)]
    expected_counts = [p * total_count for p in expected_probs]

    # Perform Chi-squared test
    # Add small epsilon to expected counts to avoid divide-by-zero warnings internally
    expected_counts = np.maximum(expected_counts, 1e-8) 
    chi_sq_stat, p_value = chisquare(f_obs=actual_counts, f_exp=expected_counts)
    
    deviation_report = []
    for d in range(1, 10):
        actual = actual_counts[d-1]
        expected = expected_counts[d-1]
        if expected > 0:
            deviation_pct = ((actual - expected) / expected) * 100
            if abs(deviation_pct) > 20: # Mark as significant deviation if off by > 20%
                deviation_report.append(f"Digit {d}: expected ~{int(expected)}, got {actual} ({deviation_pct:+.1f}% deviation)")

    # If p < 0.05, the data rejects the null hypothesis (it does NOT follow Benford's Law naturally)
    is_anomalous = p_value < 0.05
    
    risk_score = 0.0
    if is_anomalous:
        risk_score = 0.85
        if p_value < 0.01:
            risk_score = 0.95
        risk_comment = "The distribution of leading digits in this batch deviates significantly from natural financial patterns, suggesting manual entry manipulation."
    else:
        risk_comment = "The leading digits follow a natural Benford's Law distribution. No statistical anomaly detected."

    return {
        "chi_sq_stat": float(chi_sq_stat),
        "p_value": float(p_value),
        "deviation_report": deviation_report,
        "risk_comment": risk_comment,
        "risk_score": risk_score
    }


def detect_value_outliers(current_amount: float, historical_amounts: list[float]) -> dict:
    """
    Detects extreme statistical outliers using Z-Score anomaly detection.
    
    The Z-Score measures how many standard deviations an element is from the mean.
    Formula: z = (x - μ) / σ
    
    Args:
        current_amount: The taxable_value of the current invoice.
        historical_amounts: The last N amounts from the same vendor.
        
    Returns:
        dict: Contains z_score, is_outlier, risk_comment, risk_score.
    """
    if not historical_amounts or len(historical_amounts) < 2:
        return {
            "z_score": 0.0,
            "is_outlier": False,
            "risk_comment": "Insufficient historical data to establish a baseline for Z-Score analysis.",
            "risk_score": 0.0
        }
        
    # Take only up to last 100 amounts
    recent_history = historical_amounts[-100:]
    
    mean = np.mean(recent_history)
    std_dev = np.std(recent_history)
    
    # Handle divide-by-zero (e.g., all previous invoices had the exact same amount)
    if std_dev == 0:
        if current_amount == mean:
             z_score = 0.0
        else:
             # Standard deviation is 0 but new value is different -> infinite Z-score conceptually.
             z_score = 99.9 if current_amount > mean else -99.9 
    else:
        z_score = (current_amount - mean) / std_dev
        
    is_outlier = abs(z_score) > 3.0
    
    if is_outlier:
        risk_score = min(0.99, 0.50 + (abs(z_score) * 0.1)) # Scales up with Z-score
        direction = "above" if z_score > 0 else "below"
        risk_comment = f"This invoice amount is {abs(z_score):.1f} standard deviations {direction} this vendor's historical average."
    else:
        risk_score = 0.0
        risk_comment = "The invoice amount falls within the expected statistical range for this vendor."

    return {
        "z_score": float(z_score),
        "is_outlier": bool(is_outlier),
        "risk_comment": risk_comment,
        "risk_score": float(risk_score)
    }
