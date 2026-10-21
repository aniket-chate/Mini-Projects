from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime
from typing import Optional
from backend.database import get_db_connection
from backend.ai_engine.dynamic_pricing import calculate_dynamic_rate

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.get("")
def list_rooms():
    """List all rooms with their live current status for 3D visualizer."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        # Get all rooms with their type info
        cursor.execute("""
            SELECT r.room_number, r.room_type, rt.price_per_night, rt.amenities
            FROM rooms r
            JOIN room_types rt ON r.room_type = rt.room_type
            ORDER BY r.room_number ASC
        """)
        rooms = cursor.fetchall()


        # Check current occupancy for today
        today = date.today()
        cursor.execute("""
            SELECT b.room_number, b.id as booking_id, b.customer_name, b.check_in, b.check_out, b.is_paid
            FROM bookings b
            WHERE b.check_in <= %s AND b.check_out > %s
            AND b.room_number IS NOT NULL
        """, (today, today))
        active_bookings = {b['room_number']: b for b in cursor.fetchall()}

        # Combine
        result = []
        for r in rooms:
            num = r['room_number']
            occupied = num in active_bookings
            r['floor'] = int(str(num)[0]) if str(num) and str(num)[0].isdigit() else 1
            r['is_occupied'] = occupied
            r['current_booking'] = active_bookings.get(num, None)
            r['amenities_list'] = [a.strip() for a in r['amenities'].split(",") if a.strip()]
            result.append(r)


        return {"success": True, "rooms": result}
    finally:
        cursor.close()
        conn.close()

@router.get("/types")
def list_room_types():
    """List room types and amenities."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT room_type, price_per_night, amenities FROM room_types")
        types = cursor.fetchall()
        for t in types:
            t['amenities_list'] = [a.strip() for a in t['amenities'].split(",") if a.strip()]
        return {"success": True, "room_types": types}
    finally:
        cursor.close()
        conn.close()

@router.get("/availability")
def check_availability(
    room_type: str,
    check_in: date = Query(default_factory=date.today),
    check_out: Optional[date] = None
):
    """Check room availability and calculate dynamic AI pricing."""
    if not check_out or check_out <= check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        # Base price
        cursor.execute("SELECT price_per_night FROM room_types WHERE room_type = %s", (room_type,))
        type_row = cursor.fetchone()
        if not type_row:
            raise HTTPException(status_code=404, detail="Room type not found")
        base_price = float(type_row['price_per_night'])

        # Total rooms of this type
        cursor.execute("SELECT room_number FROM rooms WHERE room_type = %s", (room_type,))
        all_rooms = [r['room_number'] for r in cursor.fetchall()]

        # Booked rooms during this date window
        cursor.execute("""
            SELECT DISTINCT room_number FROM bookings 
            WHERE room_type = %s 
            AND room_number IS NOT NULL
            AND check_in < %s AND check_out > %s
        """, (room_type, check_out, check_in))
        booked_rooms = [r['room_number'] for r in cursor.fetchall()]

        available_rooms = [r for r in all_rooms if r not in booked_rooms]

        # Calculate current total hotel occupancy for AI pricing engine
        cursor.execute("SELECT COUNT(*) as total_rooms FROM rooms")
        total_hotel_rooms = cursor.fetchone()['total_rooms'] or 1

        cursor.execute("""
            SELECT COUNT(DISTINCT room_number) as occupied_count 
            FROM bookings 
            WHERE check_in <= CURDATE() AND check_out > CURDATE()
        """)
        occupied_count = cursor.fetchone()['occupied_count'] or 0
        occupancy_percent = round((occupied_count / total_hotel_rooms) * 100, 1)

        # AI Dynamic Pricing Calculation
        pricing = calculate_dynamic_rate(
            base_price=base_price,
            check_in=check_in,
            check_out=check_out,
            current_occupancy_percent=occupancy_percent
        )

        return {
            "success": True,
            "room_type": room_type,
            "check_in": check_in,
            "check_out": check_out,
            "total_rooms": len(all_rooms),
            "available_count": len(available_rooms),
            "available_rooms": available_rooms,
            "is_available": len(available_rooms) > 0,
            "pricing": pricing
        }
    finally:
        cursor.close()
        conn.close()
