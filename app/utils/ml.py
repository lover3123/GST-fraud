import random


def mock_anomaly_score() -> tuple[float, dict]:
    score = round(random.uniform(0.0, 1.0), 4)
    explanation = {
        "amount_round_figure": round(random.uniform(0.1, 0.5), 2),
        "new_vendor": round(random.uniform(0.1, 0.4), 2),
    }
    return score, explanation
