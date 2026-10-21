from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
import uuid
from backend.database import get_db_connection

router = APIRouter(prefix="/api/payments", tags=["Payments"])

class PaymentRequest(BaseModel):
    booking_id: int
    amount: float
    payment_method: str = "online"
    transaction_id: Optional[str] = None


@router.post("")
def record_payment(req: PaymentRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        # Get booking details
        cursor.execute("""
            SELECT id, customer_name, total_amount, IFNULL(paid, 0.00) as paid, is_paid
            FROM bookings WHERE id = %s
        """, (req.booking_id,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        total = float(booking['total_amount'] or 0.0)
        current_paid = float(booking['paid'] or 0.0)
        remaining = max(0.0, total - current_paid)

        if remaining <= 0 or booking['is_paid']:
            return {"success": False, "message": "Booking is already fully paid!"}

        if req.amount > remaining:
            raise HTTPException(status_code=400, detail=f"Amount ₹{req.amount} exceeds remaining balance ₹{remaining:.2f}")

        # Insert transaction
        tx_id = req.transaction_id or f"TX-{uuid.uuid4().hex[:8].upper()}"
        cursor.execute("""
            INSERT INTO payments (booking_id, payment_amount, payment_method, transaction_id)
            VALUES (%s, %s, %s, %s)
        """, (req.booking_id, Decimal(str(req.amount)), req.payment_method, tx_id))

        new_paid = current_paid + req.amount
        is_fully_paid = (total - new_paid) <= 0.01

        # Update booking
        cursor.execute("""
            UPDATE bookings 
            SET paid = %s, is_paid = %s
            WHERE id = %s
        """, (Decimal(str(round(new_paid, 2))), is_fully_paid, req.booking_id))
        conn.commit()

        return {
            "success": True,
            "message": f"Payment of ₹{req.amount:.2f} processed successfully!",
            "transaction_id": tx_id,
            "total_amount": total,
            "paid_so_far": round(new_paid, 2),
            "remaining_due": round(max(0.0, total - new_paid), 2),
            "is_fully_paid": is_fully_paid
        }
    finally:
        cursor.close()
        conn.close()

@router.get("/recent")
def list_recent_payments(limit: int = 15):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.id, p.booking_id, p.payment_amount, p.payment_method, 
                   p.transaction_id, p.payment_date, b.customer_name, b.room_type
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            ORDER BY p.id DESC
            LIMIT %s
        """, (limit,))
        return {"success": True, "payments": cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()
