from fastapi import APIRouter, HTTPException
from backend.database import get_db_connection

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/telemetry")
def get_hotel_telemetry():
    """Real-time futuristic analytics and telemetry metrics for hotel management."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        # Overview stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_bookings,
                (SELECT COALESCE(SUM(payment_amount), 0) FROM payments) as total_revenue,
                SUM(CASE WHEN is_paid = TRUE THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN is_paid = FALSE THEN 1 ELSE 0 END) as pending_count
            FROM bookings
        """)
        overview = cursor.fetchone()

        # Occupancy by room type
        cursor.execute("""
            SELECT r.room_type,
                   COUNT(b.id) as occupied_count,
                   COUNT(DISTINCT r.room_number) as total_count,
                   ROUND(COUNT(b.id) * 100.0 / COUNT(DISTINCT r.room_number), 1) as occupancy_rate
            FROM rooms r
            LEFT JOIN bookings b ON r.room_number = b.room_number 
                                 AND b.check_in <= CURDATE() 
                                 AND b.check_out > CURDATE()
            GROUP BY r.room_type
        """)
        occupancy_breakdown = cursor.fetchall()

        # Total hotel rooms and overall occupancy
        cursor.execute("SELECT COUNT(*) as total_rooms FROM rooms")
        total_rooms = cursor.fetchone()['total_rooms'] or 1
        
        cursor.execute("""
            SELECT COUNT(DISTINCT room_number) as active_rooms 
            FROM bookings 
            WHERE check_in <= CURDATE() AND check_out > CURDATE()
        """)
        active_rooms = cursor.fetchone()['active_rooms'] or 0
        overall_occupancy_pct = round((active_rooms / total_rooms) * 100, 1)

        # Revenue by Payment Method
        cursor.execute("""
            SELECT payment_method, SUM(payment_amount) as total
            FROM payments
            GROUP BY payment_method
        """)
        revenue_by_method = cursor.fetchall()

        # Recent 5 activity logs
        cursor.execute("""
            SELECT id, customer_name, room_type, room_number, total_amount, created_at, is_paid
            FROM bookings
            ORDER BY id DESC LIMIT 5
        """)
        recent_activity = cursor.fetchall()

        return {
            "success": True,
            "telemetry": {
                "total_bookings": overview['total_bookings'] or 0,
                "total_revenue": float(overview['total_revenue'] or 0.0),
                "paid_bookings": int(overview['paid_count'] or 0),
                "pending_bookings": int(overview['pending_count'] or 0),
                "total_rooms": total_rooms,
                "active_occupied_rooms": active_rooms,
                "overall_occupancy_percent": overall_occupancy_pct,
                "occupancy_breakdown": occupancy_breakdown,
                "revenue_by_method": revenue_by_method,
                "recent_activity": recent_activity
            }
        }
    finally:
        cursor.close()
        conn.close()
