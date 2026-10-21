from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any

def calculate_dynamic_rate(
    base_price: float,
    check_in: date,
    check_out: date,
    current_occupancy_percent: float
) -> Dict[str, Any]:
    """
    AI Dynamic Pricing Algorithm.
    Evaluates:
    - Current hotel occupancy pressure (Surge / Value)
    - Weekend vs weekday demand factor
    - Advance booking window reward
    """
    rate = float(base_price)
    multipliers = []
    
    # 1. Occupancy demand multiplier
    if current_occupancy_percent >= 80:
        surge = 0.25
        multipliers.append({"factor": "High Occupancy Demand (+25%)", "impact": "+25%"})
        rate *= (1 + surge)
    elif current_occupancy_percent >= 60:
        surge = 0.12
        multipliers.append({"factor": "Moderate Demand Surge (+12%)", "impact": "+12%"})
        rate *= (1 + surge)
    elif current_occupancy_percent <= 25:
        discount = 0.10
        multipliers.append({"factor": "Off-Peak Smart Saver (-10%)", "impact": "-10%"})
        rate *= (1 - discount)
    else:
        multipliers.append({"factor": "Standard Base Rate", "impact": "0%"})

    # 2. Weekend multiplier
    # Friday = 4, Saturday = 5
    if check_in.weekday() in (4, 5) or check_out.weekday() in (5, 6):
        weekend_boost = 0.15
        multipliers.append({"factor": "Weekend Leisure Peak (+15%)", "impact": "+15%"})
        rate *= (1 + weekend_boost)

    # 3. Early Bird Discount (> 7 days in advance)
    days_ahead = (check_in - date.today()).days
    if days_ahead >= 14:
        early_discount = 0.12
        multipliers.append({"factor": "Early Bird Booking Advantage (-12%)", "impact": "-12%"})
        rate *= (1 - early_discount)
    elif days_ahead >= 7:
        early_discount = 0.06
        multipliers.append({"factor": "Advance Reservation Discount (-6%)", "impact": "-6%"})
        rate *= (1 - early_discount)

    nights = max(1, (check_out - check_in).days)
    final_price_per_night = round(rate, 2)
    total_estimated = round(final_price_per_night * nights, 2)
    original_total = round(base_price * nights, 2)
    savings = round(original_total - total_estimated, 2)

    return {
        "base_price_per_night": base_price,
        "final_price_per_night": final_price_per_night,
        "nights": nights,
        "total_amount": total_estimated,
        "original_total": original_total,
        "savings_or_surge": round(total_estimated - original_total, 2),
        "multipliers": multipliers,
        "occupancy_evaluated": current_occupancy_percent
    }
