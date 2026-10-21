from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from backend.database import get_db_connection
from backend.ai_engine.dynamic_pricing import calculate_dynamic_rate

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

class BookingCreateRequest(BaseModel):
    customer_name: str
    contact_number: str
    email: str
    aadhaar: str
    room_type: str
    check_in: date
    check_out: date
    guests: int = 1
    payment_method: str = "online"
    room_number: Optional[str] = None
    username: Optional[str] = None

class BookingUpdateRequest(BaseModel):
    customer_name: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    aadhaar: Optional[str] = None

def mask_aadhaar(aadhaar: Optional[str]) -> str:
    if not aadhaar:
        return ""
    val = str(aadhaar).strip()
    if len(val) >= 4:
        return "X" * (len(val) - 4) + val[-4:]
    return "XXXX"

@router.get("")
def list_bookings(limit: int = 50):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, customer_name, contact_number, email, aadhaar,
                   room_type, check_in, check_out, guests, total_amount,
                   payment_method, check_in_time, is_paid, IFNULL(paid, 0.00) as paid,
                   room_number, IFNULL(status, 'confirmed') as status, created_at
            FROM bookings
            ORDER BY id DESC
            LIMIT %s
        """, (limit,))
        rows = cursor.fetchall()
        for r in rows:
            if "aadhaar" in r:
                r["aadhaar"] = mask_aadhaar(r.get("aadhaar"))
        return {"success": True, "count": len(rows), "bookings": rows}
    finally:
        cursor.close()
        conn.close()

@router.get("/my")
def get_my_bookings(username: str = Query(...)):
    """Fetch bookings created by or associated with a specific guest."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, customer_name, contact_number, email, aadhaar,
                   room_type, check_in, check_out, guests, total_amount,
                   payment_method, check_in_time, is_paid, IFNULL(paid, 0.00) as paid,
                   room_number, IFNULL(status, 'confirmed') as status, created_at, username
            FROM bookings
            WHERE username = %s OR customer_name LIKE %s
            ORDER BY id DESC
        """, (username, f"%{username}%"))
        rows = cursor.fetchall()
        for r in rows:
            if "aadhaar" in r:
                r["aadhaar"] = mask_aadhaar(r.get("aadhaar"))
        return {"success": True, "count": len(rows), "bookings": rows}
    finally:
        cursor.close()
        conn.close()

@router.post("")
def create_booking(req: BookingCreateRequest):
    if req.check_out <= req.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        # Verify room type exists & fetch base price
        cursor.execute("SELECT price_per_night FROM room_types WHERE room_type = %s", (req.room_type,))
        type_row = cursor.fetchone()
        if not type_row:
            raise HTTPException(status_code=404, detail="Invalid room type")
        base_price = float(type_row['price_per_night'])

        # Check room availability
        cursor.execute("""
            SELECT room_number FROM rooms 
            WHERE room_type = %s 
            AND room_number NOT IN (
                SELECT DISTINCT room_number FROM bookings 
                WHERE room_type = %s 
                AND room_number IS NOT NULL
                AND check_in < %s AND check_out > %s
            )
        """, (req.room_type, req.room_type, req.check_out, req.check_in))
        available_rooms = [r['room_number'] for r in cursor.fetchall()]

        if not available_rooms:
            raise HTTPException(status_code=400, detail=f"No {req.room_type} rooms available for these dates")

        allocated_room = req.room_number if req.room_number in available_rooms else available_rooms[0]

        # Calculate rate via AI Dynamic Pricing
        cursor.execute("SELECT COUNT(*) as total_rooms FROM rooms")
        total_rooms = cursor.fetchone()['total_rooms'] or 1
        cursor.execute("SELECT COUNT(DISTINCT room_number) as occ FROM bookings WHERE check_in <= CURDATE() AND check_out > CURDATE()")
        occ = cursor.fetchone()['occ'] or 0
        occupancy_pct = round((occ / total_rooms) * 100, 1)

        pricing = calculate_dynamic_rate(base_price, req.check_in, req.check_out, occupancy_pct)
        total_amount = Decimal(str(pricing['total_amount']))

        # Insert booking
        cursor.execute("""
            INSERT INTO bookings 
            (customer_name, contact_number, email, aadhaar, room_type, 
             check_in, check_out, guests, total_amount, payment_method, 
             check_in_time, room_number, paid, is_paid, status, username)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            req.customer_name.strip().title(),
            req.contact_number.strip(),
            req.email.strip().lower(),
            req.aadhaar.strip(),
            req.room_type,
            req.check_in,
            req.check_out,
            req.guests,
            total_amount,
            req.payment_method.lower(),
            datetime.now().strftime('%H:%M:%S'),
            allocated_room,
            Decimal("0.00"),
            False,
            "confirmed",
            req.username
        ))
        booking_id = cursor.lastrowid
        conn.commit()

        return {
            "success": True,
            "message": f"Reservation confirmed! Room #{allocated_room} allocated.",
            "booking_id": booking_id,
            "allocated_room": allocated_room,
            "pricing": pricing
        }
    finally:
        cursor.close()
        conn.close()

@router.get("/search")
def search_bookings(q: str = Query(..., description="Customer name or Aadhaar number")):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        query_pattern = f"%{q.strip()}%"
        cursor.execute("""
            SELECT id, customer_name, contact_number, email, aadhaar,
                   room_type, check_in, check_out, guests, total_amount,
                   payment_method, check_in_time, is_paid, IFNULL(paid, 0.00) as paid,
                   room_number, IFNULL(status, 'confirmed') as status
            FROM bookings
            WHERE customer_name LIKE %s OR aadhaar LIKE %s OR contact_number LIKE %s
            ORDER BY id DESC
        """, (query_pattern, query_pattern, query_pattern))
        results = cursor.fetchall()
        for r in results:
            if "aadhaar" in r:
                r["aadhaar"] = mask_aadhaar(r.get("aadhaar"))
        return {"success": True, "results": results}
    finally:
        cursor.close()
        conn.close()

@router.delete("/{booking_id}")
def delete_booking(booking_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (booking_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")

        # Delete payments then booking
        cursor.execute("DELETE FROM payments WHERE booking_id = %s", (booking_id,))
        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
        conn.commit()
        return {"success": True, "message": f"Booking #{booking_id} cancelled and removed"}
    finally:
        cursor.close()
        conn.close()
