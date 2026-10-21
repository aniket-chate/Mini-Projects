import re
from typing import Dict, Any

URGENT_KEYWORDS = [
    "leak", "broken", "dirty", "roach", "ac not working", "air conditioning",
    "stolen", "unacceptable", "terrible", "rude", "smell", "pest", "emergency",
    "water", "no electricity", "hot water"
]

POSITIVE_KEYWORDS = [
    "great", "excellent", "amazing", "loved", "clean", "luxurious",
    "wonderful", "friendly", "best", "perfect", "futuristic", "stunning"
]

def analyze_sentiment(comment: str, rating: int) -> Dict[str, Any]:
    """
    Analyzes guest feedback and comments to calculate sentiment rating,
    detect satisfaction polarity, and flag urgent staff alerts.
    """
    text_lower = comment.lower()
    urgent_flags = [kw for kw in URGENT_KEYWORDS if kw in text_lower]
    is_urgent = bool(urgent_flags) or rating <= 2

    # Polarity calculation
    pos_count = sum(1 for kw in POSITIVE_KEYWORDS if kw in text_lower)
    neg_count = sum(1 for kw in URGENT_KEYWORDS if kw in text_lower)

    if rating >= 4:
        sentiment = "Positive"
        score = 0.8 + (rating - 4) * 0.1
    elif rating == 3:
        sentiment = "Neutral" if neg_count == 0 else "Mixed/Concern"
        score = 0.5
    else:
        sentiment = "Negative"
        score = 0.2

    action = "None"
    if is_urgent:
        action = f"Immediate notification dispatched to Duty Manager: issues flagged ({', '.join(urgent_flags[:3]) if urgent_flags else 'Low Rating'})"
    elif sentiment == "Positive":
        action = "Send complimentary AI loyalty rewards voucher."

    return {
        "sentiment": sentiment,
        "sentiment_score": round(score, 2),
        "urgent_alert": is_urgent,
        "flagged_issues": urgent_flags,
        "recommended_action": action
    }
