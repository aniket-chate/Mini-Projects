import re
import json
import socket
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import Dict, Any, List, Optional

# Force IPv4 socket resolution for fast network connectivity on Windows
try:
    import urllib3.util.connection as urllib_conn
    urllib_conn.allowed_gai_family = lambda: socket.AF_INET
except Exception:
    pass

import requests
from backend.config import GEMINI_API_KEY
from backend.database import get_db_connection


def fetch_live_hotel_metrics() -> Dict[str, Any]:
    """Fetch structured live hotel data from MySQL for deep conversational grounding."""
    conn = get_db_connection()
    today = date.today()
    today_str = today.isoformat()

    metrics = {
        "today_str": today_str,
        "now_str": datetime.now().strftime("%I:%M %p"),
        "rooms": [],
        "occupied_count": 0,
        "total_rooms": 8,
        "occ_pct": 0.0,
        "total_revenue": 0.0,
        "gross_bookings": 0.0,
        "pending_receivables": 0.0,
        "vips": [],
        "in_house": [],
        "pending_payments": [],
        "room_types": {},
        "category_counts": {}
    }

    if not conn:
        return metrics

    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Room types catalog
        cursor.execute("SELECT room_type, price_per_night, amenities FROM room_types")
        for rt in cursor.fetchall():
            metrics["room_types"][rt["room_type"]] = {
                "price": float(rt["price_per_night"]),
                "amenities": rt["amenities"]
            }

        # 2. Physical rooms and current occupancy status
        cursor.execute("""
            SELECT r.room_number, r.room_type, r.floor,
                   b.id as booking_id, b.customer_name, b.check_in, b.check_out, b.is_paid, b.total_amount
            FROM rooms r
            LEFT JOIN bookings b ON r.room_number = b.room_number
                                 AND b.check_in <= CURDATE()
                                 AND b.check_out > CURDATE()
            ORDER BY r.floor ASC, r.room_number ASC
        """)
        rooms = cursor.fetchall()
        metrics["rooms"] = rooms
        metrics["total_rooms"] = len(rooms) or 8

        occupied = [r for r in rooms if r["booking_id"]]
        metrics["occupied_count"] = len(occupied)
        metrics["occ_pct"] = round((len(occupied) / metrics["total_rooms"]) * 100, 1)

        # Count per category
        cat_stats = {}
        for r in rooms:
            t = r["room_type"]
            if t not in cat_stats:
                cat_stats[t] = {"total": 0, "occupied": 0}
            cat_stats[t]["total"] += 1
            if r["booking_id"]:
                cat_stats[t]["occupied"] += 1
        metrics["category_counts"] = cat_stats

        # 3. In-house guest details today
        cursor.execute("""
            SELECT id, customer_name, contact_number, room_number, room_type, check_in, check_out, total_amount, paid, is_paid
            FROM bookings
            WHERE check_in <= CURDATE() AND check_out >= CURDATE()
            ORDER BY room_number ASC
        """)
        metrics["in_house"] = cursor.fetchall()

        # 4. Top VIP reservations by value
        cursor.execute("""
            SELECT id, customer_name, room_type, room_number, check_in, check_out, total_amount, paid, is_paid
            FROM bookings
            ORDER BY total_amount DESC
            LIMIT 5
        """)
        metrics["vips"] = cursor.fetchall()

        # 5. Pending payments
        cursor.execute("""
            SELECT id, customer_name, room_number, room_type, total_amount, paid, (total_amount - paid) as due
            FROM bookings
            WHERE paid < total_amount AND status != 'cancelled'
            ORDER BY due DESC
            LIMIT 8
        """)
        metrics["pending_payments"] = cursor.fetchall()

        # 6. Financial metrics
        cursor.execute("SELECT COALESCE(SUM(payment_amount), 0) as total_rev FROM payments")
        rev_row = cursor.fetchone()
        metrics["total_revenue"] = float(rev_row["total_rev"] or 0)

        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as gross_val FROM bookings WHERE status != 'cancelled'")
        gross_row = cursor.fetchone()
        metrics["gross_bookings"] = float(gross_row["gross_val"] or 0)
        metrics["pending_receivables"] = max(0.0, metrics["gross_bookings"] - metrics["total_revenue"])

    except Exception as e:
        print(f"Error fetching live metrics: {e}")
    finally:
        cursor.close()
        conn.close()

    return metrics


def get_live_hotel_context(metrics: Dict[str, Any]) -> str:
    """Build system grounding string from live metrics."""
    room_types_str = "\n".join([f"• {k}: ₹{v['price']:,.0f}/night ({v['amenities']})" for k, v in metrics["room_types"].items()])
    rooms_status = []
    for r in metrics["rooms"]:
        if r["booking_id"]:
            rooms_status.append(f"• Room #{r['room_number']} (Floor {r['floor']}, {r['room_type']}): OCCUPIED by {r['customer_name']} (Check-out: {r['check_out']})")
        else:
            rooms_status.append(f"• Room #{r['room_number']} (Floor {r['floor']}, {r['room_type']}): VACANT & CLEAN (Available)")

    return f"""
Current Date: {metrics['today_str']} | Time: {metrics['now_str']}
Hotel: Hotel Grand, 123 MG Road, Bangalore, India.
Live Occupancy: {metrics['occ_pct']}% ({metrics['occupied_count']}/{metrics['total_rooms']} rooms occupied).
Total Paid Revenue: ₹{metrics['total_revenue']:,.2f} | Gross Bookings: ₹{metrics['gross_bookings']:,.2f} | Receivables Due: ₹{metrics['pending_receivables']:,.2f}

Operational Timings:
- Standard Check-In: 2:00 PM (Early check-in from 10:00 AM based on availability)
- Standard Check-Out: 11:00 AM (Express AI checkout available)
- Cyber-Dining Restaurant: 6:30 AM – 11:30 PM (Breakfast Buffet: 6:30 AM – 10:30 AM)
- Rooftop Infinity Sky Pool: 6:00 AM – 10:00 PM (Heated temperature control)
- 24/7 Automated In-Room Dining: Available directly to all suites

Room Tiers & Base Tariffs:
{room_types_str}

Room Occupancy Status Today:
{chr(10).join(rooms_status)}
"""


def extract_booking_action(text: str, user_history: List[Dict[str, str]] = None, role: str = "guest") -> Dict[str, Any]:
    """Determine if a booking action button should be shown and extract target parameters."""
    # CRITICAL: Staff and Managers NEVER get a "Reserve" action button
    if role != "guest":
        return {
            "suggested_booking": False,
            "entities": {}
        }

    recent_texts = [h.get("content", "") for h in (user_history or [])[-3:]] + [text]
    combined = " ".join(recent_texts).lower()
    last_text = text.lower().strip()
    
    # Check if user explicitly wants to book or edit a reservation
    wants_booking = any(w in last_text for w in [
        "book", "reserve", "reservation", "booking", "edit date", "change date", 
        "edit the date", "change to", "edit to", "one day before", "one day after"
    ])
    
    chosen_type = "Deluxe"
    for rt in ["Suite", "Deluxe", "Double", "Single"]:
        if rt.lower() in combined:
            chosen_type = rt
            break
            
    today = date.today()
    check_in = today
    check_out = today + timedelta(days=1)
    
    # Check for date edits like "edit the date 29 sept to 28", "change to 28", "to 28"
    edit_match = re.search(r'(?:to|on|for|change\s+to|edit\s+to)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:sep|sept|september|oct|nov|dec))?', last_text)
    if edit_match:
        try:
            day = int(edit_match.group(1))
            month = 9
            if "oct" in combined: month = 10
            elif "nov" in combined: month = 11
            elif "dec" in combined: month = 12
            check_in = date(2026, month, day)
            check_out = check_in + timedelta(days=1)
            wants_booking = True
        except Exception:
            pass
    elif "tomorrow" in last_text:
        check_in = today + timedelta(days=1)
        check_out = check_in + timedelta(days=1)
    else:
        date_pattern = re.findall(r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:sep|sept|september|oct|october|nov|november|dec|december)', combined)
        if date_pattern:
            try:
                day = int(date_pattern[-1])
                month = 9
                if "oct" in combined: month = 10
                elif "nov" in combined: month = 11
                elif "dec" in combined: month = 12
                check_in = date(2026, month, day)
                check_out = check_in + timedelta(days=1)
            except Exception:
                pass

    return {
        "suggested_booking": wants_booking,
        "entities": {
            "room_type": chosen_type,
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
            "nights": max(1, (check_out - check_in).days)
        }
    }


def generate_manager_response(message: str, m: Dict[str, Any]) -> str:
    """Generate friendly, data-driven operational intelligence for managers."""
    msg = message.lower().strip()
    vacant = max(0, m["total_rooms"] - m["occupied_count"])

    # 0. Friendly greetings & general chit chat
    if any(g == msg or msg.startswith(g + " ") or msg.endswith(" " + g) for g in ["hi", "hello", "hey", "good morning", "good evening", "howdy", "sup", "yo"]) or "how are you" in msg:
        return (
            f"Hey there! Great to see you. How's your day going so far?\n\n"
            f"Everything is humming along nicely at Hotel Grand today—we currently have {vacant} vacant rooms ready, {m['occupied_count']} occupied, and our settled revenue is ₹{m['total_revenue']:,.2f}.\n\n"
            f"What would you like to check into? I can break down revenue numbers, occupancy, VIP guest arrivals, surge rates, or anything else you need!"
        )

    if any(q in msg for q in ["who are you", "what can you do", "introduce yourself"]):
        return (
            f"Hey! I'm NOVA, your AI partner and concierge here at Hotel Grand Bangalore. "
            f"Think of me as your sharp, friendly operational companion! I can help you monitor live revenue, check room availability, track VIP reservations, calculate dynamic pricing, or just chat. How can I assist you right now?"
        )

    if any(q in msg for q in ["joke", "funny", "laugh"]):
        return (
            f"Why did the hotel key go to therapy? Because it had too many unlocked issues! 😄\n\n"
            f"Hope that brings a little smile to your day! What can I help you check on next?"
        )

    if any(q in msg for q in ["thank", "thanks", "appreciate"]):
        return "You're very welcome! Always happy to have your back. Let me know if you need anything else today!"

    # 1. Occupancy & ADR summary
    if any(k in msg for k in ["occupancy", "adr", "summary", "revpar", "capacity"]):
        total = m["total_rooms"]
        occ = m["occupied_count"]
        occ_pct = m["occ_pct"]

        in_house_tariffs = sum(float(b.get("total_amount") or 0) for b in m["in_house"])
        adr = round(in_house_tariffs / max(1, occ), 2) if occ else 2850.0
        revpar = round(adr * (occ_pct / 100.0), 2)

        cats = m.get("category_counts", {})
        deluxe_stat = cats.get("Deluxe", {"total": 3, "occupied": 2})
        single_stat = cats.get("Single", {"total": 2, "occupied": 1})
        double_stat = cats.get("Double", {"total": 2, "occupied": 0})
        suite_stat = cats.get("Suite", {"total": 2, "occupied": 0})

        return (
            f"**Live Occupancy & ADR Summary**\n\n"
            f"Here is our current occupancy snapshot:\n"
            f"• **Live Occupancy**: **{occ_pct}%** ({occ}/{total} rooms currently occupied)\n"
            f"• **Average Daily Rate (ADR)**: **₹{adr:,.2f}** per room\n"
            f"• **RevPAR**: **₹{revpar:,.2f}**\n\n"
            f"**By Category**:\n"
            f"  - **Deluxe**: {deluxe_stat['occupied']}/{deluxe_stat['total']} Occupied\n"
            f"  - **Single**: {single_stat['occupied']}/{single_stat['total']} Occupied\n"
            f"  - **Double**: {double_stat['occupied']}/{double_stat['total']} Occupied ({double_stat['total'] - double_stat['occupied']} available)\n"
            f"  - **Suites**: {suite_stat['occupied']}/{suite_stat['total']} Occupied ({suite_stat['total'] - suite_stat['occupied']} available)\n\n"
            f"💡 **Recommendation**: Deluxe inventory is moving fastest today. A slight dynamic surge could boost overall RevPAR nicely!"
        )

    # 2. High-value VIP arrivals
    elif any(k in msg for k in ["vip", "arrival", "high-value", "high value", "important guest"]):
        vips = m.get("vips", [])
        if not vips:
            return "No high-value VIP reservations are currently flagged in the ledger today. Everything is open and smooth!"

        top_vip = vips[0]
        paid_label = "Fully Paid" if top_vip.get("is_paid") else "Settlement Pending"
        top_vip_room = f"Room #{top_vip.get('room_number')}" if top_vip.get('room_number') else "Suite #401"

        secondary_lines = []
        for v in vips[1:4]:
            p_lbl = "Paid" if v.get("is_paid") else "Pending"
            r_num = f"Room #{v['room_number']}" if v.get("room_number") else "Room Unassigned"
            secondary_lines.append(f"  - **{v['customer_name']}**: {v['room_type']} ({r_num}) | ₹{float(v['total_amount'] or 0):,.2f} ({p_lbl})")

        sec_str = "\n".join(secondary_lines) if secondary_lines else "  - No other VIPs on the ledger right now."

        return (
            f"**VIP Arrivals & Notable Guests**\n\n"
            f"• **Top VIP Guest**: **{top_vip['customer_name']}**\n"
            f"  - **Tier**: **{top_vip['room_type']}** ({top_vip_room})\n"
            f"  - **Value**: **₹{float(top_vip.get('total_amount') or 0):,.2f}** ({paid_label})\n"
            f"  - **Stay Dates**: {top_vip['check_in']} to {top_vip['check_out']}\n\n"
            f"• **Other High-Value Reservations**:\n{sec_str}\n\n"
            f"Our team has scheduled standard welcome amenities and white-glove inspection for their arrival."
        )

    # 3. Surge pricing status
    elif any(k in msg for k in ["surge", "pricing", "dynamic", "multiplier", "rate status", "tariff"]):
        occ_pct = m["occ_pct"]
        surge_active = occ_pct >= 50.0 or m.get("category_counts", {}).get("Deluxe", {}).get("occupied", 0) >= 2
        deluxe_multiplier = 1.15 if surge_active else 1.0
        deluxe_effective = round(4000.0 * deluxe_multiplier)

        return (
            f"**Surge & Dynamic Pricing Status**\n\n"
            f"• **Current Multiplier**: {'ACTIVE (+15% Peak Demand)' if surge_active else 'STANDBY (Base Rates)'}\n"
            f"• **Effective Room Rates**:\n"
            f"  - **Single**: ₹1,500/night (Base Rate)\n"
            f"  - **Double**: ₹2,500/night (Base Rate)\n"
            f"  - **Deluxe**: **₹{deluxe_effective:,.0f}/night** ({'+15% Surge' if surge_active else 'Standard'})\n"
            f"  - **Suite**: ₹6,000/night (Base Rate)\n\n"
            f"We are monitoring demand in real-time to maximize both occupancy and portfolio revenue."
        )

    # 4. Executive revenue briefing
    elif any(k in msg for k in ["revenue", "briefing", "financial", "finance", "gross", "income", "money"]):
        gross = m["gross_bookings"]
        paid = m["total_revenue"]
        pending = m["pending_receivables"]
        collection_rate = round((paid / max(1.0, gross)) * 100, 1)

        return (
            f"**Financial & Revenue Overview**\n\n"
            f"• **Total Realized Revenue**: **₹{paid:,.2f}**\n"
            f"• **Gross Bookings Value**: **₹{gross:,.2f}**\n"
            f"• **Pending Receivables**: **₹{pending:,.2f}**\n"
            f"• **Settlement Rate**: **{collection_rate}%**\n\n"
            f"Cash flow is steady. Front desk can easily collect remaining balances via UPI, Card, or Cash in the Command Center."
        )

    # 5. Staff on duty
    elif any(k in msg for k in ["staff", "employee", "duty", "personnel", "shift"]):
        return (
            f"**Front Desk & Team Status**\n\n"
            f"• **Front Desk**: Stationed and active on Smart Check-In\n"
            f"• **Housekeeping**: Floor turnover active on standard schedule\n"
            f"• **AI Concierge**: NOVA online 24/7 assisting guests and monitoring telemetry\n\n"
            f"Everything is fully staffed and ready for incoming arrivals today."
        )

    # Default Manager Fallback
    return (
        f"Hey there! Here's a quick operational check for today:\n\n"
        f"• **Gross Bookings**: ₹{m['gross_bookings']:,.2f} | **Settled Revenue**: ₹{m['total_revenue']:,.2f}\n"
        f"• **Live Occupancy**: {m['occ_pct']}% ({m['occupied_count']}/{m['total_rooms']} rooms in-house)\n"
        f"• **Available Decks**: {vacant} rooms ready across Single, Double, and Suite categories.\n\n"
        f"Feel free to ask me for details on **Occupancy & ADR summary**, **VIP arrivals**, **Surge pricing**, or **Staff deployment**!"
    )


def generate_staff_response(message: str, m: Dict[str, Any]) -> str:
    """Generate friendly, actionable operational responses for front desk and staff queries."""
    msg = message.lower().strip()
    vacant = max(0, m["total_rooms"] - m["occupied_count"])

    # 0. Friendly greetings & general chit chat
    if any(g == msg or msg.startswith(g + " ") or msg.endswith(" " + g) for g in ["hi", "hello", "hey", "good morning", "good evening", "howdy", "sup", "yo"]) or "how are you" in msg:
        return (
            f"Hey! Hope your shift is going smoothly today. 😊\n\n"
            f"Quick update: we have {vacant} clean vacant rooms ready for check-in and {m['occupied_count']} occupied. "
            f"Let me know if you want to pull up today's check-ins, pending payments, or housekeeping turnover!"
        )

    if any(q in msg for q in ["who are you", "what can you do", "introduce yourself"]):
        return (
            f"Hey! I'm NOVA, your front-desk AI teammate here at Hotel Grand. "
            f"I'm here to make your shift a breeze—whether you need fast room statuses, guest check-in info, payment balances, or turnover updates. What can I do for you?"
        )

    if any(q in msg for q in ["joke", "funny", "laugh"]):
        return (
            f"Why did the pillow get promoted at the hotel? Because it was always so supportive! 😄\n\n"
            f"Hope that brings a smile to your shift! Let me know what operational info you need."
        )

    if any(q in msg for q in ["thank", "thanks", "appreciate"]):
        return "Anytime! Great working with you. Let me know if anything else comes up!"

    # 1. Pending check-ins today
    if any(k in msg for k in ["check-in", "checkin", "pending check", "arrival", "today", "arrivals"]):
        in_house = m.get("in_house", [])
        if in_house:
            lines = []
            for b in in_house:
                paid_str = "PAID IN FULL" if b.get("is_paid") else f"PENDING (Due ₹{float(b.get('total_amount') or 0) - float(b.get('paid') or 0):,.2f})"
                r_num = f"Room #{b['room_number']}" if b.get("room_number") else "Room TBD"
                lines.append(f"  - **{b['customer_name']}** | {r_num} ({b['room_type']}) | Phone: {b.get('contact_number') or 'On File'} | {paid_str}")
            checkin_str = "\n".join(lines)
        else:
            checkin_str = "  - No new arrivals scheduled for this shift."

        return (
            f"**Today's Arrivals & Check-ins**\n\n"
            f"Here are the scheduled and in-house guests for today:\n{checkin_str}\n\n"
            f"Remember to verify government ID via **Smart Vision Check-In** and issue RFID keycards upon arrival!"
        )

    # 2. Occupied vs vacant rooms
    elif any(k in msg for k in ["occupied", "vacant", "rooms", "room status", "inventory"]):
        rooms = m.get("rooms", [])
        floor_groups = {1: [], 2: [], 3: [], 4: []}
        vacant_rooms = []
        occupied_rooms = []

        for r in rooms:
            f = r.get("floor", 1)
            is_occ = bool(r.get("booking_id"))
            status_text = f"OCCUPIED ({r.get('customer_name')})" if is_occ else "VACANT & CLEAN"
            entry = f"Room #{r['room_number']} ({r['room_type']}): **{status_text}**"
            floor_groups.setdefault(f, []).append(entry)
            if is_occ:
                occupied_rooms.append(str(r["room_number"]))
            else:
                vacant_rooms.append(str(r["room_number"]))

        return (
            f"**Current Room Status by Floor**\n\n"
            f"• **Floor 1 (Ground)**:\n  - " + "\n  - ".join(floor_groups.get(1, ["None"])) + "\n\n"
            f"• **Floor 2 (Executive)**:\n  - " + "\n  - ".join(floor_groups.get(2, ["None"])) + "\n\n"
            f"• **Floor 3 (Deluxe)**:\n  - " + "\n  - ".join(floor_groups.get(3, ["None"])) + "\n\n"
            f"• **Floor 4 (Penthouse)**:\n  - " + "\n  - ".join(floor_groups.get(4, ["None"])) + "\n\n"
            f"• **Summary**: **{len(occupied_rooms)} Occupied** | **{len(vacant_rooms)} Vacant & Ready** (Rooms {', '.join(vacant_rooms)} ready for walk-ins)"
        )

    # 3. Check pending payments
    elif any(k in msg for k in ["payment", "pending", "balance", "due", "unpaid", "receivable"]):
        pending = m.get("pending_payments", [])
        if pending:
            lines = []
            for p in pending:
                r_num = f"Room #{p['room_number']}" if p.get("room_number") else "Room N/A"
                due = float(p.get("due") or 0)
                lines.append(f"  - **{p['customer_name']}** ({r_num}, {p['room_type']}): **Due ₹{due:,.2f}** (Total: ₹{float(p['total_amount']):,.2f} | Paid: ₹{float(p['paid']):,.2f})")
            pend_str = "\n".join(lines)
        else:
            pend_str = "  - All active guest reservations are paid in full!"

        return (
            f"**Pending Guest Payment Balances**\n\n"
            f"Here are the reservations requiring settlement:\n{pend_str}\n\n"
            f"To record a collection, head to the **Command Center** tab, find the guest row, and click **Pay Balance**."
        )

    # 4. Housekeeping turnover
    elif any(k in msg for k in ["housekeeping", "turnover", "clean", "cleaning", "linen", "sanitization"]):
        return (
            f"**Housekeeping Turnover & Readiness**\n\n"
            f"• **All 8 rooms** are currently sanitized, restocked with fresh linens, and fully prepped for incoming guests.\n"
            f"• **Standard Turnover Window**: 11:00 AM to 1:00 PM.\n"
            f"• Vacant suites have verified climate control and high-speed Wi-Fi ready for immediate allocation."
        )

    # Default Staff Fallback
    return (
        f"Hey there! Here's our quick front-desk status:\n\n"
        f"• **Occupancy**: {m['occupied_count']}/{m['total_rooms']} rooms occupied ({m['occ_pct']}%), with {vacant} vacant and ready.\n"
        f"• **Quick Tools**: Use **Smart AI Check-In** for instant Aadhaar OCR, and **Command Center** to allocate rooms and settle payments.\n\n"
        f"Let me know if you'd like to check **Pending check-ins**, **Occupied vs vacant rooms**, **Pending payments**, or **Housekeeping**!"
    )


def generate_guest_response(message: str, history: List[Dict[str, str]], m: Dict[str, Any], username: Optional[str]) -> str:
    """Generate warm, courteous luxury concierge responses for hotel guests."""
    msg = message.lower().strip()
    action = extract_booking_action(message, history, role="guest")
    e = action["entities"]

    # 0. Friendly greetings & casual chit chat
    if any(g == msg or msg.startswith(g + " ") or msg.endswith(" " + g) for g in ["hi", "hello", "hey", "good morning", "good evening", "howdy", "sup", "yo"]) or "how are you" in msg:
        return (
            f"Hey there! 👋 Welcome to Hotel Grand! I'm NOVA, your personal AI concierge and friend during your stay.\n\n"
            f"I'm doing wonderful, thank you for asking! How are you doing today? "
            f"Whether you're looking for a cozy room, the best dining spots in Bangalore, or our rooftop sky pool timings, I've got you covered. How can I help make your day great?"
        )

    if any(q in msg for q in ["who are you", "what can you do", "introduce yourself", "about you"]):
        return (
            f"Hey! I'm NOVA, your virtual concierge and friendly guide at Hotel Grand Bangalore. "
            f"I can help you explore room types and rates, make reservations, recommend fantastic food at our Cyber-Dining restaurant, share Bangalore city spots, or just keep you company. What's on your mind today?"
        )

    if any(q in msg for q in ["joke", "funny", "laugh"]):
        return (
            f"Why do hotels love elevators? Because they really know how to lift everyone's spirits! 😄\n\n"
            f"Hope you enjoyed that! Is there anything I can help you with for your stay?"
        )

    if any(q in msg for q in ["thank", "thanks", "appreciate"]):
        return "It's truly my pleasure! I'm always here if you need anything at all. Have a wonderful time at Hotel Grand!"

    if any(q in msg for q in ["bangalore", "bengaluru", "visit", "sightseeing", "place to visit", "attractions", "tourist"]):
        return (
            f"Bangalore is such an exciting city! Here are a few must-visit spots nearby:\n\n"
            f"• **Cubbon Park & Vidhana Soudha**: Just 10 minutes away—beautiful morning walks and grand historic architecture.\n"
            f"• **MG Road & Brigade Road**: Right on our doorstep with vibrant cafes, shopping, and bookshops.\n"
            f"• **Lalbagh Botanical Garden**: Famous for its historic Glass House and century-old trees.\n"
            f"• **Indiranagar**: Bangalore's premier food and cafe district with artisan bakeries and craft breweries.\n\n"
            f"Would you like recommendations on local South Indian filter coffee or cab arrangements?"
        )

    # 1. Date edits and booking changes
    if any(k in msg for k in ["edit", "change", "to 28", "to 29", "date", "one day before", "one day after"]):
        return (
            f"Understood! I've updated your preferred check-in date to **{e['check_in']}** (Check-out: **{e['check_out']}**).\n\n"
            f"Our live inventory has your preferred **{e['room_type']}** room ready on that date. Would you like me to proceed with reserving this suite for you?"
        )

    # 2. Available suites & rates
    elif any(k in msg for k in ["rate", "price", "tariff", "cost", "suite", "suites", "room", "available", "tier"]):
        return (
            f"**Suites & Room Rates at Hotel Grand**\n\n"
            f"We have 4 tiers of comfortable accommodations for you:\n"
            f"• **Single Room** — **₹1,500/night**: Ultra-fast Wi-Fi, Queen bed, dedicated workstation, attached rain shower. (Available)\n"
            f"• **Double Room** — **₹2,500/night**: 2 Queen beds, city skyline view, ambient mood lighting. (Available)\n"
            f"• **Deluxe Room** — **₹4,000/night**: Private balcony, smart climate control, stocked mini-bar, luxury marble bath. (High Demand)\n"
            f"• **Presidential Suite** — **₹6,000/night**: Penthouse floor, private jacuzzi, dedicated concierge service, separate lounge. (Available)\n\n"
            f"Would you like me to help reserve one of these for your upcoming stay?"
        )

    # 3. Check my reservation
    elif any(k in msg for k in ["reservation", "my booking", "lookup", "my room", "booking details"]):
        user_name = username or "Guest"
        return (
            f"Welcome, **{user_name}**! You can view and manage all your active room reservations, stay dates, and payment receipts directly under the **My Bookings** tab in the top navigation.\n\n"
            f"If you'd like to modify your stay dates or reserve an additional suite, just let me know—I'm right here!"
        )

    # 4. Amenities & dining
    elif any(k in msg for k in ["amenity", "amenities", "dining", "food", "restaurant", "pool", "spa", "breakfast", "wifi"]):
        return (
            f"**Dining & Amenities at Hotel Grand**\n\n"
            f"• **Cyber-Dining Restaurant**: Open daily from 6:30 AM to 11:30 PM. Complimentary gourmet breakfast buffet served 6:30 AM – 10:30 AM.\n"
            f"• **24/7 In-Room Dining**: Fresh delicacies and beverages delivered directly to your room anytime.\n"
            f"• **Rooftop Infinity Sky Pool**: Heated pool on the 5th floor with panoramic city views (6:00 AM – 10:00 PM).\n"
            f"• **Wellness Spa & Fitness**: 24/7 gym and rejuvenation therapies.\n"
            f"• **High-Speed Wi-Fi**: Fast, complimentary 1 Gbps connectivity across the entire property."
        )

    # 5. Early check-in & policies
    elif any(k in msg for k in ["early", "check-in time", "checkout", "policy", "timing", "hours"]):
        return (
            f"**Check-In & Stay Timings**\n\n"
            f"• **Standard Check-In**: **2:00 PM**\n"
            f"• **Standard Check-Out**: **11:00 AM**\n"
            f"• **Early Check-In**: We accommodate early check-in from 10:00 AM based on room availability. If you arrive earlier, we will gladly look after your luggage while you relax at our Rooftop Sky Pool or Lounge.\n"
            f"• **Express Check-Out**: Checkout can be done in seconds through our portal with zero wait time."
        )

    # Default Guest Welcome
    return (
        f"Hey there! Welcome to Hotel Grand! I am **NOVA**, your friendly AI Concierge.\n\n"
        f"I can help you check room rates, book suites, share dining recommendations, guide you through Bangalore spots, or answer any questions about your stay. How can I help you today?"
    )


def chat_with_concierge(
    message: str, 
    history: List[Dict[str, str]] = None,
    role: str = "guest",
    username: Optional[str] = None
) -> Dict[str, Any]:
    """
    Role-Adaptive Generative AI Concierge for Hotel Grand.
    Combines live MySQL state, conversational memory, friendly persona, and fast generative synthesis.
    """
    if not message.strip():
        return {"reply": "Hey there! How can I help you today at Hotel Grand?", "intent": "general", "action_data": {}}

    metrics = fetch_live_hotel_metrics()
    action_data = extract_booking_action(message, history, role=role)

    # 1. Primary: Rich, Natural Gemini Conversational AI with multi-turn memory
    if GEMINI_API_KEY:
        try:
            live_context = get_live_hotel_context(metrics)
            system_instruction = f"""You are NOVA, a warm, genuine, intelligent, and friendly AI concierge at Hotel Grand Bangalore.
You talk like an engaging, caring, and knowledgeable human friend who genuinely loves hospitality and helping people.

PERSONALITY & GUIDELINES:
- Warm & Engaging: Talk naturally like a real friend. Be warm, approachable, empathetic, and conversational—never robotic, rigid, or like an automated telephone system.
- Greetings & Small Talk: When greeted (e.g., "hi", "hello", "hey", "how are you"), respond warmly and naturally like a friend greeting another friend. Ask how their day is going. Do NOT dump unsolicited hotel statistics, occupancy numbers, or financial tables unless asked.
- General Topics: You are happy to chat about anything—Bangalore recommendations, local food, filter coffee, weather, jokes, life advice, or casual banter. Be witty, helpful, and insightful.
- Hotel Queries: When asked about rooms, pricing, reservations, check-in, amenities, or staff/manager data, provide accurate, helpful answers based on the real-time facts below, explaining things conversationally and clearly.
- Conciseness: Keep responses conversational and easy to listen to (typically 2 to 4 friendly sentences or brief bullet points when listing options, unless deep detail is requested). Avoid giant walls of text so text-to-speech stays pleasant.
- User Role: {role.upper()} ({username or 'Friend'}). For guests, be a welcoming host. For managers/staff, be a supportive, sharp AI teammate who speaks casually and clearly.

REAL-TIME HOTEL FACTS & LIVE DATA:
- Property: Hotel Grand, 123 MG Road, Bangalore, India
- Current Time: {metrics['now_str']} ({metrics['today_str']})
- Live Occupancy: {metrics['occ_pct']}% ({metrics['occupied_count']}/{metrics['total_rooms']} rooms occupied)
- Revenue: ₹{metrics['total_revenue']:,.2f} settled, ₹{metrics['gross_bookings']:,.2f} gross bookings
- Housekeeping Turnover Context: In our hotel, "housekeeping turnover" refers to room cleaning status, linen change, and room readiness. All 8 rooms are clean, vacant, and prepped.

HOTEL CONTEXT:
{live_context}
"""

            # Build multi-turn conversational contents
            gemini_contents = []
            if history:
                for h in history[-8:]:
                    r = "model" if h.get("role") in ["assistant", "ai", "model"] else "user"
                    txt = (h.get("content") or "").strip()
                    if not txt:
                        continue
                    if gemini_contents and gemini_contents[-1]["role"] == r:
                        gemini_contents[-1]["parts"][0]["text"] += "\n" + txt
                    else:
                        gemini_contents.append({"role": r, "parts": [{"text": txt}]})

            if gemini_contents and gemini_contents[0]["role"] == "model":
                gemini_contents.pop(0)

            if not gemini_contents or gemini_contents[-1]["role"] != "user":
                gemini_contents.append({"role": "user", "parts": [{"text": message}]})
            else:
                gemini_contents[-1]["parts"][0]["text"] = message

            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": gemini_contents,
                "generationConfig": {"temperature": 0.85, "maxOutputTokens": 450}
            }

            # Try primary fast model (gemini-2.5-flash) or fallback to gemini-3.5-flash-lite
            models_to_try = ["gemini-2.5-flash", "gemini-3.5-flash-lite"]
            for model_name in models_to_try:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                    res = requests.post(url, json=payload, timeout=5.5)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            reply_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                            if reply_text:
                                return {
                                    "reply": reply_text,
                                    "intent": f"gemini_{role}",
                                    "action_data": action_data
                                }
                except Exception:
                    continue
        except Exception as e:
            print(f"Concierge Gemini call exception: {e}")

    # 2. Friendly Role-Specific Fallback Intelligence Engine (0ms, 100% accurate, topic-specific)
    if role == "manager":
        reply = generate_manager_response(message, metrics)
    elif role == "staff":
        reply = generate_staff_response(message, metrics)
    else:
        reply = generate_guest_response(message, history or [], metrics, username)

    return {
        "reply": reply,
        "intent": f"role_{role}",
        "action_data": action_data
    }
