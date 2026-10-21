"""
Hotel Grand AI Management Platform - Manual System Check & Verification Tool
=============================================================================
This script provides both an automated end-to-end diagnostics check and an
interactive manual testing menu to verify:
  1. MySQL Database Connection & Schema Integrity (all tables & columns)
  2. Missing column auto-migration (payments.transaction_id, users.role, rooms.floor)
  3. Room Availability & Dynamic Pricing
  4. Booking Creation & Allocation
  5. Payment Processing & Transaction ID recording (verifies terminal error fix)
  6. AI Engine Services (NOVA Concierge, Sentiment Analysis)
  7. FastAPI Web Server Readiness

Usage:
  python manual_check.py          (Interactive Menu or Auto-diagnostics)
  python manual_check.py --auto   (Direct automated test suite)
"""

import sys
import os
from pathlib import Path
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid
import argparse

# 1. UTF-8 Console Support for Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 2. Ensure project root is in sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR if (SCRIPT_DIR / "backend").exists() else (SCRIPT_DIR / "hotel-ai-platform")
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import mysql.connector
from backend.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
from backend.database import get_db_connection, init_db
from backend.ai_engine.dynamic_pricing import calculate_dynamic_rate
from backend.ai_engine.concierge import chat_with_concierge
from backend.ai_engine.sentiment import analyze_sentiment


def print_banner():
    print("\n" + "=" * 65)
    print(" 🏨 HOTEL GRAND - NEXT-GEN AI MANAGEMENT PLATFORM")
    print("    SYSTEM VERIFICATION & MANUAL CHECK TOOL")
    print("=" * 65)


def check_database_schema():
    """Verify database connection, tables, and column migrations."""
    print("\n[1/5] Checking Database & Table Schema Integrity...")
    conn = get_db_connection()
    if not conn:
        print("  ❌ Could not connect to MySQL database! Please verify MySQL is running.")
        return False

    cursor = conn.cursor(dictionary=True)
    try:
        # Check tables
        cursor.execute("SHOW TABLES")
        tables = [list(row.values())[0] for row in cursor.fetchall()]
        print(f"  ✓ Connected to database: '{DB_NAME}' on {DB_HOST}:{DB_PORT}")
        print(f"  ✓ Existing tables: {', '.join(tables)}")

        # Ensure all columns exist
        required_columns = {
            "payments": ["id", "booking_id", "payment_amount", "payment_method", "transaction_id", "payment_date"],
            "users": ["id", "username", "password", "role", "created_at"],
            "rooms": ["room_number", "room_type", "floor"],
            "bookings": ["id", "customer_name", "contact_number", "room_type", "total_amount", "is_paid", "paid", "room_number", "status"]
        }

        all_ok = True
        for table, cols in required_columns.items():
            if table in tables:
                cursor.execute(f"DESCRIBE {table}")
                existing_cols = [r["Field"] for r in cursor.fetchall()]
                missing = [c for c in cols if c not in existing_cols]
                if missing:
                    print(f"  ⚠️ Table '{table}' was missing columns: {missing}. Applying auto-migration...")
                    init_db()
                    all_ok = False
                else:
                    print(f"  ✓ Table '{table}': All critical columns present (including {cols[-1]})")

        if all_ok:
            print("  ✅ All database tables and columns are valid!")
        return True
    except Exception as e:
        print(f"  ❌ Error inspecting database: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


def check_room_availability():
    """Check room inventory and availability."""
    print("\n[2/5] Checking Room Inventory & Dynamic Pricing...")
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT room_type, price_per_night, amenities FROM room_types")
        types = cursor.fetchall()
        print(f"  ✓ Room Types configured: {len(types)}")
        for t in types:
            print(f"    • {t['room_type']:<10} - ₹{t['price_per_night']:<8} ({t['amenities'][:45]}...)")

        cursor.execute("SELECT COUNT(*) as count FROM rooms")
        total_rooms = cursor.fetchone()["count"]
        print(f"  ✓ Total Physical Rooms in inventory: {total_rooms}")

        # Test Dynamic Pricing
        today = date.today()
        tomorrow = today + timedelta(days=1)
        pricing = calculate_dynamic_rate(4000.0, today, tomorrow, current_occupancy_percent=40.0)
        print(f"  ✓ Dynamic Pricing Engine Test (Deluxe 1-night): ₹{pricing['total_amount']} (Base: ₹{pricing['base_price_per_night']}, Final/Night: ₹{pricing['final_price_per_night']})")
        return True
    except Exception as e:
        print(f"  ❌ Error in room check: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


def test_booking_and_payment_flow():
    """
    Test booking creation and recording payment with transaction_id.
    This specifically reproduces and verifies the fix for the MySQL 1054 error.
    """
    print("\n[3/5] Testing Booking Creation & Payment Flow (with transaction_id)...")
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor(dictionary=True)
    test_booking_id = None
    try:
        # 1. Create a temporary test booking
        check_in = date.today() + timedelta(days=30)
        check_out = check_in + timedelta(days=1)
        test_phone = "9999900000"
        test_aadhaar = "123456789012"

        cursor.execute("""
            INSERT INTO bookings 
            (customer_name, contact_number, email, aadhaar, room_type, 
             check_in, check_out, guests, total_amount, payment_method, 
             check_in_time, room_number, paid, is_paid, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            "System Diagnostic Guest",
            test_phone,
            "diagnostic@hotelgrand.test",
            test_aadhaar,
            "Deluxe",
            check_in,
            check_out,
            2,
            Decimal("4000.00"),
            "online",
            "12:00:00",
            "301",
            Decimal("0.00"),
            False,
            "confirmed"
        ))
        test_booking_id = cursor.lastrowid
        conn.commit()
        print(f"  ✓ Created Test Booking #{test_booking_id} for Deluxe room")

        # 2. Record payment with transaction_id (This was the exact failure point in terminal!)
        tx_id = f"TEST-TX-{uuid.uuid4().hex[:8].upper()}"
        payment_amount = Decimal("4000.00")
        
        cursor.execute("""
            INSERT INTO payments (booking_id, payment_amount, payment_method, transaction_id)
            VALUES (%s, %s, %s, %s)
        """, (test_booking_id, payment_amount, "online", tx_id))
        payment_id = cursor.lastrowid

        # Update booking to fully paid
        cursor.execute("""
            UPDATE bookings SET paid = %s, is_paid = TRUE WHERE id = %s
        """, (payment_amount, test_booking_id))
        conn.commit()
        print(f"  ✓ Payment recorded successfully! Payment ID: #{payment_id}, Transaction ID: {tx_id}")

        # 3. Read back from payments table to ensure transaction_id is returned
        cursor.execute("""
            SELECT id, booking_id, payment_amount, payment_method, transaction_id, payment_date
            FROM payments WHERE id = %s
        """, (payment_id,))
        payment_record = cursor.fetchone()
        assert payment_record["transaction_id"] == tx_id, "Transaction ID mismatch!"
        print(f"  ✓ Verified Payment record retrieved from database with transaction_id: {payment_record['transaction_id']}")

        # 4. Clean up test record
        cursor.execute("DELETE FROM payments WHERE id = %s", (payment_id,))
        cursor.execute("DELETE FROM bookings WHERE id = %s", (test_booking_id,))
        conn.commit()
        print(f"  ✓ Cleaned up test booking #{test_booking_id} and payment #{payment_id}")
        print("  ✅ Booking and Payment pipeline is 100% OPERATIONAL!")
        return True
    except Exception as e:
        print(f"  ❌ Error in booking/payment test: {e}")
        if test_booking_id:
            try:
                cursor.execute("DELETE FROM payments WHERE booking_id = %s", (test_booking_id,))
                cursor.execute("DELETE FROM bookings WHERE id = %s", (test_booking_id,))
                conn.commit()
            except Exception:
                pass
        return False
    finally:
        cursor.close()
        conn.close()


def check_authentication_and_roles():
    """Test user authentication, role management, and RBAC permissions."""
    print("\n[4/6] Checking User Authentication & Role-Based Access Control (RBAC)...")
    from backend.routers.auth import login, LoginRequest
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Verify pre-seeded accounts
        cursor.execute("SELECT username, role FROM users WHERE username IN ('manager', 'staff', 'guest')")
        users = {r["username"]: r["role"] for r in cursor.fetchall()}
        print(f"  ✓ Pre-seeded accounts found: {users}")
        assert users.get("manager") == "manager", "Manager account missing or incorrect role"
        assert users.get("staff") == "staff", "Staff account missing or incorrect role"
        assert users.get("guest") == "guest", "Guest account missing or incorrect role"

        # 2. Test authentication logic via API endpoint handler
        mgr_res = login(LoginRequest(username="manager", password="manager123"))
        assert mgr_res["success"] and mgr_res["user"]["role"] == "manager", "Manager password auth failed"
        print(f"  ✓ Authenticated Manager account successfully ({mgr_res['message']})")

        staff_res = login(LoginRequest(username="staff", password="staff123"))
        assert staff_res["success"] and staff_res["user"]["role"] == "staff", "Staff password auth failed"
        print(f"  ✓ Authenticated Staff account successfully ({staff_res['message']})")

        guest_res = login(LoginRequest(username="guest", password="guest123"))
        assert guest_res["success"] and guest_res["user"]["role"] == "guest", "Guest password auth failed"
        print(f"  ✓ Authenticated Guest account successfully ({guest_res['message']})")

        print("  ✅ User Authentication and RBAC roles verified!")
        return True
    except Exception as e:
        print(f"  ❌ Error testing authentication: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


def check_ai_services():
    """Test AI Engine modules (Concierge & Sentiment) with role adaptation."""
    print("\n[5/6] Checking AI Concierge (Role Adaptive) & NLP Services...")
    try:
        # Test Sentiment Analysis
        sentiment_res = analyze_sentiment("The room was clean and futuristic! Amazing stay.", rating=5)
        print(f"  ✓ Sentiment Engine: '{sentiment_res['sentiment']}' (Score: {sentiment_res['sentiment_score']})")

        # 1. Test Guest Concierge
        guest_res = chat_with_concierge("Hello, what rooms do you have?", role="guest")
        preview_g = guest_res["reply"][:65].replace("\n", " ") + "..."
        print(f"  ✓ NOVA [Guest Mode]: \"{preview_g}\"")

        # 2. Test Staff Concierge
        staff_res = chat_with_concierge("Give me a quick briefing on rooms and occupancy.", role="staff")
        preview_s = staff_res["reply"][:65].replace("\n", " ") + "..."
        print(f"  ✓ NOVA [Staff Mode]: \"{preview_s}\"")

        # 3. Test Manager Concierge
        mgr_res = chat_with_concierge("What is our revenue and occupancy summary?", role="manager")
        preview_m = mgr_res["reply"][:65].replace("\n", " ") + "..."
        print(f"  ✓ NOVA [Manager Mode]: \"{preview_m}\"")

        # 4. Test User's screenshot scenario: Date change request
        history = [
            {"role": "user", "content": "I would like to book a deluxe room on September 29th"},
            {"role": "assistant", "content": "We look forward to welcoming you to Hotel Grand on September 29th!"}
        ]
        date_change_query = "sorry but can you edit the date 29 sept to 28 one day before"
        date_res = chat_with_concierge(date_change_query, history=history, role="guest")
        preview_d = date_res["reply"][:75].replace("\n", " ") + "..."
        print(f"  ✓ NOVA [Date Edit Test]: \"{preview_d}\"")
        if date_res.get("action_data") and date_res["action_data"].get("entities"):
            e = date_res["action_data"]["entities"]
            print(f"    • Detected Check-In: {e.get('check_in')}, Room: {e.get('room_type')}")

        print("  ✅ Role-Adaptive AI Engine Services are ONLINE!")
        return True
    except Exception as e:
        print(f"  ❌ Error testing AI services: {e}")
        return False


def check_server_readiness():
    """Verify that backend/main.py and run.py can be invoked without import errors."""
    print("\n[6/6] Checking Server Readiness...")
    try:
        from backend.main import app
        route_count = len(app.routes)
        print(f"  ✓ FastAPI application initialized successfully with {route_count} routes!")
        print("  ✓ Web endpoints ready: /api/auth, /api/rooms, /api/bookings, /api/payments, /api/reports, /api/ai")
        print("  ✅ Server readiness verified!")
        return True
    except Exception as e:
        print(f"  ❌ Error loading FastAPI app: {e}")
        return False


def run_full_diagnostics():
    """Run all automated checks and output a summary report."""
    print_banner()
    print(">> Running Comprehensive Automated Diagnostics...")
    
    results = [
        ("Database & Schema Integrity", check_database_schema()),
        ("Room Inventory & Pricing", check_room_availability()),
        ("Booking & Payment Pipeline", test_booking_and_payment_flow()),
        ("Authentication & RBAC Roles", check_authentication_and_roles()),
        ("AI Concierge & NLP Services", check_ai_services()),
        ("FastAPI Server Readiness", check_server_readiness()),
    ]

    print("\n" + "=" * 65)
    print("                    DIAGNOSTIC SUMMARY REPORT")
    print("=" * 65)
    all_passed = True
    for name, status in results:
        symbol = "✅ PASS" if status else "❌ FAIL"
        if not status:
            all_passed = False
        print(f"  {symbol:<10} | {name}")
    print("=" * 65)

    if all_passed:
        print("🎉 ALL SYSTEMS ARE OPERATIONAL & ERROR-FREE!")
        print(">> To start the Web Platform, run:")
        print("     python run.py")
        print(">> Or directly:")
        print("     python backend/main.py")
        print("=" * 65 + "\n")
    else:
        print("⚠️ Some checks failed. Please check the logs above.\n")
    return all_passed


def interactive_menu():
    """Interactive CLI menu for manual testing."""
    while True:
        print_banner()
        print(" Select an action:")
        print("  [1] Run Complete Automated System Diagnostics")
        print("  [2] Check Room Inventory & Live Occupancy")
        print("  [3] View All Active Bookings")
        print("  [4] Test Create a Manual Booking")
        print("  [5] Test Record Payment (with transaction_id)")
        print("  [6] Test AI Concierge (Chat with NOVA)")
        print("  [7] Run Database Table & Column Migrations")
        print("  [8] Start FastAPI Web Server (run.py)")
        print("  [0] Exit")
        print("-" * 65)

        choice = input("Enter choice [0-8]: ").strip()

        if choice == '1':
            run_full_diagnostics()
            input("\nPress Enter to continue...")
        elif choice == '2':
            check_room_availability()
            input("\nPress Enter to continue...")
        elif choice == '3':
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("""
                    SELECT id, customer_name, room_type, room_number, check_in, check_out, 
                           total_amount, paid, is_paid, status 
                    FROM bookings ORDER BY id DESC LIMIT 10
                """)
                bookings = cursor.fetchall()
                print(f"\nLast {len(bookings)} Bookings:")
                print(f"{'ID':<5} | {'Customer':<20} | {'Room':<6} | {'Type':<8} | {'Total':<8} | {'Paid':<8} | {'Status':<10}")
                print("-" * 75)
                for b in bookings:
                    paid_str = "PAID" if b['is_paid'] else f"₹{b['paid']}"
                    room = b['room_number'] or "N/A"
                    print(f"{b['id']:<5} | {b['customer_name'][:20]:<20} | {room:<6} | {b['room_type']:<8} | ₹{b['total_amount']:<7} | {paid_str:<8} | {b['status']:<10}")
                cursor.close()
                conn.close()
            input("\nPress Enter to continue...")
        elif choice == '4':
            print("\n--- Create Manual Booking ---")
            name = input("Customer Name: ").strip() or "Manual Test Guest"
            phone = input("Phone Number (10 digits): ").strip() or "9876543210"
            email = input("Email: ").strip() or "guest@hotelgrand.test"
            aadhaar = input("Aadhaar (12 digits): ").strip() or "111122223333"
            print("Room types: Single, Double, Deluxe, Suite")
            room_type = input("Room Type [Deluxe]: ").strip().title() or "Deluxe"
            
            conn = get_db_connection()
            if conn:
                cur = conn.cursor(dictionary=True)
                cur.execute("SELECT room_number FROM rooms WHERE room_type = %s LIMIT 1", (room_type,))
                r = cur.fetchone()
                room_num = r["room_number"] if r else "101"
                check_in = date.today()
                check_out = today_next = check_in + timedelta(days=1)
                cur.execute("""
                    INSERT INTO bookings 
                    (customer_name, contact_number, email, aadhaar, room_type, check_in, check_out, 
                     guests, total_amount, payment_method, room_number, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (name, phone, email, aadhaar, room_type, check_in, check_out, 1, Decimal("3000.00"), "online", room_num, "confirmed"))
                conn.commit()
                print(f"✅ Booking created! Booking ID: #{cur.lastrowid} for Room #{room_num}")
                cur.close()
                conn.close()
            input("\nPress Enter to continue...")
        elif choice == '5':
            print("\n--- Record Payment ---")
            b_id = input("Enter Booking ID: ").strip()
            if b_id.isdigit():
                conn = get_db_connection()
                if conn:
                    cur = conn.cursor(dictionary=True)
                    cur.execute("SELECT id, customer_name, total_amount, paid, is_paid FROM bookings WHERE id = %s", (int(b_id),))
                    b = cur.fetchone()
                    if not b:
                        print("❌ Booking not found!")
                    else:
                        print(f"Booking #{b['id']} ({b['customer_name']}): Total ₹{b['total_amount']}, Paid so far ₹{b['paid']}")
                        amount_in = input(f"Payment amount (default ₹{b['total_amount']}): ").strip()
                        amount = Decimal(amount_in) if amount_in else b['total_amount']
                        tx_id = f"MANUAL-TX-{uuid.uuid4().hex[:8].upper()}"
                        cur.execute("""
                            INSERT INTO payments (booking_id, payment_amount, payment_method, transaction_id)
                            VALUES (%s, %s, %s, %s)
                        """, (b['id'], amount, "online", tx_id))
                        cur.execute("UPDATE bookings SET paid = %s, is_paid = TRUE WHERE id = %s", (amount, b['id']))
                        conn.commit()
                        print(f"✅ Payment recorded! Transaction ID: {tx_id}")
                    cur.close()
                    conn.close()
            else:
                print("❌ Invalid Booking ID")
            input("\nPress Enter to continue...")
        elif choice == '6':
            print("\n--- Chat with NOVA (AI Virtual Concierge) ---")
            print("Type 'exit' to return to menu.\n")
            while True:
                msg = input("You: ").strip()
                if msg.lower() in ['exit', 'quit', 'q']:
                    break
                if not msg:
                    continue
                res = chat_with_concierge(msg)
                print(f"NOVA: {res['reply']}\n")
        elif choice == '7':
            init_db()
            print("✅ Database tables and columns verified and migrated.")
            input("\nPress Enter to continue...")
        elif choice == '8':
            import uvicorn
            print("\n>> Launching FastAPI Server at http://127.0.0.1:8000 ... (Press Ctrl+C to stop)")
            uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
        elif choice == '0':
            print("\nGoodbye!\n")
            break
        else:
            print("❌ Invalid option. Please choose between 0 and 8.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hotel Grand Manual & Automated System Check Tool")
    parser.add_argument("--auto", "-a", action="store_true", help="Run automated diagnostics without menu")
    args = parser.parse_args()

    if args.auto or not sys.stdin.isatty():
        success = run_full_diagnostics()
        sys.exit(0 if success else 1)
    else:
        interactive_menu()
