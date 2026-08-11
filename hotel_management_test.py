import hashlib
import random
import mysql.connector
import re
from datetime import datetime, timedelta
from getpass import getpass  # For secure password input

# Security and Validation Functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def validate_aadhaar(aadhaar):
    return re.match(r'^\d{12}$', aadhaar) is not None

def validate_phone(phone):
    return re.match(r'^\d{10}$', phone) is not None

def validate_email(email):
    return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email) is not None

# Authentication Functions
def generate_otp():
    return str(random.randint(100000, 999999))

def verify_otp():
    otp = generate_otp()
    print(f"\nYour OTP is: {otp} (Valid for 5 minutes)")
    start_time = datetime.now()
    
    while True:
        entered_otp = input("Enter the OTP: ").strip()
        if datetime.now() > start_time + timedelta(minutes=5):
            print("❌ OTP expired!")
            return False
        if entered_otp == otp:
            print("✅ OTP verified successfully!")
            return True
        print("❌ Invalid OTP! Try again")

def signup():
    print("\n===== SIGN UP =====")
    while True:
        username = input("Create username (3-20 chars, letters/numbers/_): ").strip()
        if not re.match("^[a-zA-Z0-9_]{3,20}$", username):
            print("❌ Invalid username format!")
            continue
            
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            print("❌ Username already exists!")
            conn.close()
            continue
        break
    
    while True:
        password = getpass("Enter password (min 8 chars): ").strip()
        if len(password) < 8:
            print("❌ Password too short!")
            continue
        confirm = getpass("Confirm password: ").strip()
        if password != confirm:
            print("❌ Passwords don't match!")
            continue
        break

    if verify_otp():
        hashed_password = hash_password(password)
        try:
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", 
                         (username, hashed_password))
            conn.commit()
            print("✅ User signed up successfully!")
        except mysql.connector.Error as err:
            print(f"❌ Database error: {err}")
        finally:
            conn.close()
    else:
        print("❌ Signup failed due to OTP mismatch.")

def login():
    print("\n===== LOGIN =====")
    username = input("Username: ").strip()
    password = getpass("Password: ").strip()
    hashed_password = hash_password(password)

    conn = connect_db()
    if not conn:
        return False

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        
        if not result:
            print("❌ User not found!")
            return False
            
        if result[0] == hashed_password:
            if verify_otp():
                print(f"✅ Login successful! Welcome, {username}")
                return True
            else:
                print("❌ Login failed due to OTP mismatch.")
                return False
        else:
            print("❌ Invalid password!")
            return False
    finally:
        conn.close()

# Database Functions
def connect_db():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="venu369",
            database="hotel_management"
        )
    except mysql.connector.Error as e:
        print("❌ Database error:", e)
        return None

# Booking Management Functions
def add_booking(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    print("\n===== ADD NEW BOOKING =====")
    
    # Get room prices from database
    cursor = conn.cursor()
    cursor.execute("SELECT room_type, price_per_night FROM room_types")
    room_types = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Customer information
    customer_name = input("Customer full name: ").title().strip()
    
    while True:
        contact_number = input("Contact number (10 digits): ").strip()
        if validate_phone(contact_number):
            break
        print("❌ Invalid phone number!")
    
    while True:
        email = input("Email address: ").strip()
        if validate_email(email):
            break
        print("❌ Invalid email!")
    
    while True:
        aadhaar = input("Aadhaar number (12 digits): ").strip()
        if validate_aadhaar(aadhaar):
            break
        print("❌ Invalid Aadhaar number!")
    
    # Room selection
    print("\nAvailable Room Types:")
    for i, (room_type, price) in enumerate(room_types.items(), 1):
        print(f"{i}. {room_type} (₹{price}/night)")
    
    while True:
        try:
            choice = int(input("Select room type (1-4): ")) - 1
            room_type = list(room_types.keys())[choice]
            break
        except (ValueError, IndexError):
            print("❌ Invalid selection!")

    # Date handling
    check_in = datetime.now().date()
    print(f"\nCheck-in date: {check_in} (auto-set to today)")
    
    while True:
        try:
            check_out = input("Check-out date (YYYY-MM-DD): ").strip()
            check_out = datetime.strptime(check_out, "%Y-%m-%d").date()
            if check_out <= check_in:
                print("❌ Check-out must be after check-in!")
                continue
            break
        except ValueError:
            print("❌ Invalid date format!")

    # Calculate duration and price
    nights = (check_out - check_in).days
    total_amount = room_types[room_type] * nights
    
    # Guest information
    while True:
        try:
            guests = int(input("Number of guests: ").strip())
            if guests < 1:
                print("❌ Must have at least 1 guest!")
                continue
            break
        except ValueError:
            print("❌ Please enter a number!")

    # Payment method
    payment_method = ""
    while payment_method.lower() not in ['online', 'cash']:
        payment_method = input("Payment method (online/cash): ").strip().lower()
        if payment_method not in ['online', 'cash']:
            print("❌ Please choose 'online' or 'cash'")

    # Insert booking
    try:
        cursor.execute("""
            INSERT INTO bookings 
            (customer_name, contact_number, email, aadhaar, room_type, 
             check_in, check_out, guests, total_amount, payment_method, check_in_time) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_name, contact_number, email, aadhaar, room_type, 
            check_in, check_out, guests, total_amount, payment_method, 
            datetime.now().strftime('%H:%M:%S')
        ))
        conn.commit()
        print("✅ Booking added successfully!")
        print(f"Total amount: ₹{total_amount} for {nights} nights")
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        
def search_booking(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    print("\n===== SEARCH BOOKING =====")
    print("1. Search by last 4 digits of Aadhaar")
    print("2. Search by Customer Name")
    
    while True:
        choice = input("Enter your choice: ").strip()
        
        cursor = conn.cursor()
        if choice == '1':  
            aadhaar_part = input("Enter last 4 digits of Aadhaar: ").strip()
            if not re.match(r'^\d{4}$', aadhaar_part):
                print("❌ Please enter exactly 4 digits!")
                continue
            cursor.execute("SELECT * FROM bookings WHERE aadhaar LIKE %s", (f'%{aadhaar_part}',))
            break
            
        elif choice == '2':
            name = input("Enter customer name (or part): ").strip()
            cursor.execute("SELECT * FROM bookings WHERE customer_name LIKE %s", (f"%{name}%",))
            break
        else:
            print("❌ Invalid choice. Try again.")
    
    rows = cursor.fetchall() 
    if rows:
        print("\n=== FOUND BOOKINGS ===")
        for row in rows:
            print(f"""
Booking ID: {row[0]}
Customer: {row[1]}
Contact: {row[2]}
Email: {row[3]}
Aadhaar: {row[4][:4]}XXXX{row[4][-4:]}
Room Type: {row[5]}
Check-in: {row[6]} at {row[10]}
Check-out: {row[7]}
Guests: {row[8]}
Amount: ₹{row[9]}
Payment Method: {row[11]}
Status: {'Paid' if row[12] else 'Pending'}
            """)
    else:
        print("❌ No bookings found.")

# Payment Functions
from decimal import Decimal
from decimal import Decimal, InvalidOperation

def record_payment(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    print("\n===== RECORD PAYMENT =====")
    search_booking(conn)  # Show bookings to choose from
    
    try:
        booking_id = int(input("\nEnter Booking ID to pay: ").strip())
    except ValueError:
        print("❌ Invalid Booking ID!")
        return

    cursor = conn.cursor()
    try:
        # Get booking details
        cursor.execute("""
            SELECT id, customer_name, total_amount 
            FROM bookings WHERE id = %s
        """, (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            print("❌ Booking not found!")
            return
            
        booking_id, customer_name, total_amount = booking
        print(f"\nBooking ID: {booking_id}")
        print(f"Customer: {customer_name}")
        print(f"Amount Due: ₹{total_amount:.2f}")
        
        # Payment method validation
        payment_method = ""
        while payment_method.lower() not in ['online', 'cash']:
            payment_method = input("Payment method (online/cash): ").strip().lower()
            if payment_method not in ['online', 'cash']:
                print("❌ Please choose 'online' or 'cash'")

        # Amount validation
        while True:
            try:
                amount_str = input(f"Payment amount (₹{total_amount:.2f} due): ").strip()
                amount = Decimal(amount_str)
                if amount <= 0:
                    print("❌ Amount must be positive!")
                    continue
                if amount > total_amount:
                    print(f"❌ Amount cannot exceed ₹{total_amount:.2f}!")
                    continue
                break
            except (ValueError, InvalidOperation):
                print("❌ Invalid amount! Please enter a valid number.")
            except Exception as e:
                print(f"❌ Error: {e}")
                return

        # Record payment
        cursor.execute("""
            INSERT INTO payments (booking_id, payment_amount, payment_method)
            VALUES (%s, %s, %s)
        """, (booking_id, amount, payment_method))
        
        # Update booking status
        remaining = total_amount - amount
        is_fully_paid = remaining <= 0
        
        cursor.execute("""
            UPDATE bookings 
            SET total_amount = %s, is_paid = %s 
            WHERE id = %s
        """, (remaining, is_fully_paid, booking_id))
        
        conn.commit()
        print(f"✅ Payment of ₹{amount:.2f} recorded successfully!")
        
        if is_fully_paid:
            print("✅ Booking is now fully paid!")
        else:
            print(f"Remaining balance: ₹{remaining:.2f}")
            
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        conn.rollback()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        conn.rollback()
# Room Availability Functions
def check_room_availability(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    cursor = conn.cursor()
    
    # Get all room types
    cursor.execute("SELECT room_type FROM room_types")
    room_types = [row[0] for row in cursor.fetchall()]
    
    print("\n===== CHECK ROOM AVAILABILITY =====")
    print("Available room types:", ", ".join(room_types))
    
    while True:
        room_type = input("Enter room type: ").strip().title()
        if room_type in room_types:
            break
        print("❌ Invalid room type!")

    # Auto-set check-in to tomorrow by default
    check_in = datetime.now().date() + timedelta(days=1)
    print(f"\nSuggested check-in date: {check_in} (tomorrow)")
    
    while True:
        choice = input("Use suggested date? (y/n): ").strip().lower()
        if choice == 'n':
            check_in = input("Enter check-in date (YYYY-MM-DD): ").strip()
            try:
                check_in = datetime.strptime(check_in, "%Y-%m-%d").date()
                if check_in < datetime.now().date():
                    print("❌ Check-in cannot be in the past!")
                    continue
                break
            except ValueError:
                print("❌ Invalid date format!")
        elif choice == 'y':
            break
        else:
            print("❌ Please enter 'y' or 'n'")
    
    while True:
        check_out = input("Enter check-out date (YYYY-MM-DD): ").strip()
        try:
            check_out = datetime.strptime(check_out, "%Y-%m-%d").date()
            if check_out <= check_in:
                print("❌ Check-out must be after check-in!")
                continue
            break
        except ValueError:
            print("❌ Invalid date format! Use YYYY-MM-DD")

    # Get total rooms of this type
    cursor.execute("""
        SELECT COUNT(*) FROM rooms WHERE room_type = %s
    """, (room_type,))
    total_rooms = cursor.fetchone()[0]
    
    # Get booked rooms based on the selected dates
    cursor.execute("""
        SELECT COUNT(DISTINCT room_number) 
        FROM bookings 
        WHERE room_type = %s 
        AND ((check_in BETWEEN %s AND %s) OR (check_out BETWEEN %s AND %s) OR 
             (check_in <= %s AND check_out >= %s))
    """, (room_type, check_in, check_out, check_in, check_out, check_in, check_out))
    
    booked_rooms = cursor.fetchone()[0] or 0
    
    available = total_rooms - booked_rooms
    print(f"\nAvailable '{room_type}' rooms from {check_in} to {check_out}: {available}")
    
    if available > 0:
        print("✅ Rooms available!")
    else:
        print("❌ No rooms available for these dates.")

# Report Functions
def generate_report(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    cursor = conn.cursor()

    # Get report data
    cursor.execute("""
        SELECT 
            COUNT(*) as total_bookings,
            SUM(CASE WHEN is_paid = TRUE THEN total_amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN is_paid = TRUE THEN 1 ELSE 0 END) as paid_bookings,
            SUM(CASE WHEN is_paid = FALSE THEN 1 ELSE 0 END) as unpaid_bookings
        FROM bookings
    """)
    report_data = cursor.fetchone()
    
    cursor.execute("""
        SELECT room_type, COUNT(*) 
        FROM bookings 
        GROUP BY room_type
    """)
    room_type_counts = cursor.fetchall()

    cursor.execute("""
        SELECT payment_method, SUM(payment_amount) 
        FROM payments 
        GROUP BY payment_method
    """)
    payment_method_revenue = cursor.fetchall()

    # Display report
    print("\n================ HOTEL MANAGEMENT REPORT ================")
    print(f"\nTotal Bookings: {report_data[0]}")
    print(f"Total Revenue: ₹{report_data[1] or 0}")
    print(f"Paid Bookings: {report_data[2]}")
    print(f"Unpaid Bookings: {report_data[3]}")
    
    print("\nBookings by Room Type:")
    for room_type, count in room_type_counts:
        print(f"  {room_type}: {count} bookings")
    
    print("\nRevenue by Payment Method:")
    for method, amount in payment_method_revenue:
        print(f"  {method.capitalize()}: ₹{amount or 0}")
    
    print("\nCurrent Occupancy:")
    cursor.execute("""
        SELECT b.room_type, 
               COUNT(*) as booked,
               (SELECT COUNT(*) FROM rooms r WHERE r.room_type = b.room_type) as total,
               CASE 
                   WHEN (SELECT COUNT(*) FROM rooms r WHERE r.room_type = b.room_type) > 0 
                   THEN ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rooms r WHERE r.room_type = b.room_type), 1)
                   ELSE 0
               END as percentage
        FROM bookings b
        WHERE check_in <= CURDATE() AND check_out > CURDATE()
        GROUP BY b.room_type
    """)
    occupancy = cursor.fetchall()
    
    if not occupancy:
        print("  No current occupancy")
    else:
        for room_type, booked, total, percent in occupancy:
            print(f"  {room_type}: {booked}/{total} ({percent}%)")
    
    print("======================================================")

# Hotel Information |
def show_hotel_info():
    print("\n================ HOTEL INFORMATION ================")
    print("\nRoom Types and Amenities:")
    
    conn = connect_db()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM room_types")
        rooms = cursor.fetchall()
        
        for room in rooms:
            print(f"\n{room[0]} Room - ₹{room[1]}/night")
            print("Amenities:", ", ".join(room[2].split(',')))
        
        conn.close()
    
    print("\nHotel Facilities:")
    print("  - 24/7 Reception")
    print("  - Free WiFi")
    print("  - Restaurant")
    print("  - Swimming Pool")
    print("  - Conference Rooms")
    print("  - Laundry Service")
    print("\nContact Information:")
    print("  Phone: +91 1234567890")
    print("  Email: info@hotelgrand.com")
    print("  Address: 123 MG Road, Bangalore, India")
    print("=================================================")

# Main Menu and Session Management
current_user = None

def is_logged_in():
    return current_user is not None

def view_all_bookings(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    cursor = conn.cursor()
    try:
        # Get all bookings with additional useful information, including 'paid'
        cursor.execute("""
        SELECT id, customer_name, room_type, 
               DATE_FORMAT(check_in, '%Y-%m-%d') as check_in,
               DATE_FORMAT(check_out, '%Y-%m-%d') as check_out,

               total_amount,
               IFNULL(is_paid, FALSE) as is_paid,
               paid
        FROM bookings
        ORDER BY check_in DESC
    """)
        bookings = cursor.fetchall()
        
        if not bookings:
            print("❌ No bookings found!")
            return
            
        print("\n===== ALL BOOKINGS =====")
        print(f"{'ID':<5} {'Customer':<20} {'Room Type':<10} {'Check-in':<12} {'Check-out':<12} {'Amount':<12} {'Paid':<12} {'Status':<10}")
        print("-" * 95)
        
        for booking in bookings:
            status = "Paid" if booking[6] else "Pending"
            amount = f"₹{booking[5]:.2f}" if booking[5] is not None else "₹0.00"
            paid = f"₹{(booking[7] or 0):.2f}" if booking[7] is not None else "₹0.00"  # Changed this to account for 'paid' being at index 7
            
            print(f"{booking[0]:<5} {booking[1]:<20} {booking[2]:<10} "
                  f"{booking[3]:<12} {booking[4]:<12} {amount:<12} {paid:<12} {status:<10}")
    
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")


def update_booking(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    print("\n===== UPDATE BOOKING =====")
    search_booking(conn)  # Show bookings to choose from
    
    try:
        booking_id = int(input("\nEnter Booking ID to update: ").strip())
    except ValueError:
        print("❌ Invalid Booking ID!")
        return

    cursor = conn.cursor()
    try:
        # Get current booking details
        cursor.execute("""
            SELECT customer_name, contact_number, email, aadhaar, 
                   room_type, check_in, check_out, guests, total_amount, 
                   payment_method
            FROM bookings 
            WHERE id = %s
        """, (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            print("❌ Booking not found!")
            return
            
        print("\nCurrent Details:")
        print(f"1. Customer Name: {booking[0]}")
        print(f"2. Contact Number: {booking[1]}")
        print(f"3. Email: {booking[2]}")
        print(f"4. Aadhaar: {booking[3][:4]}XXXX{booking[3][-4:]}")
        print(f"5. Room Type: {booking[4]}")
        print(f"6. Check-in: {booking[5]}")
        print(f"7. Check-out: {booking[6]}")
        print(f"8. Guests: {booking[7]}")
        print(f"9. Payment Method: {booking[9]}")
        
        # Get updated fields
        fields = []
        values = []
        
        print("\nEnter new values (leave blank to keep current):")
        customer_name = input("Customer Name: ").strip() or booking[0]
        contact_number = input("Contact Number: ").strip() or booking[1]
        email = input("Email: ").strip() or booking[2]
        
        # For sensitive fields like Aadhaar, require full re-entry
        aadhaar = ""
        while True:
            aadhaar_input = input("Aadhaar (enter full 12 digits or blank to keep): ").strip()
            if not aadhaar_input:
                aadhaar = booking[3]
                break
            if validate_aadhaar(aadhaar_input):
                aadhaar = aadhaar_input
                break
            print("❌ Invalid Aadhaar number!")
        
        # Update booking
        cursor.execute("""
            UPDATE bookings 
            SET customer_name = %s, contact_number = %s, email = %s, aadhaar = %s
            WHERE id = %s
        """, (customer_name, contact_number, email, aadhaar, booking_id))
        
        conn.commit()
        print("✅ Booking updated successfully!")
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        conn.rollback()

def delete_booking(conn):
    if not is_logged_in():
        print("❌ Please login first!")
        return

    print("\n===== DELETE BOOKING =====")
    search_booking(conn)  # Show bookings to choose from
    
    try:
        booking_id = int(input("\nEnter Booking ID to delete: ").strip())
    except ValueError:
        print("❌ Invalid Booking ID!")
        return

    cursor = conn.cursor()
    try:
        # Verify booking exists
        cursor.execute("SELECT customer_name FROM bookings WHERE id = %s", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            print("❌ Booking not found!")
            return
            
        # Confirm deletion
        confirm = input(f"Are you sure you want to delete booking #{booking_id} for {booking[0]}? (yes/no): ").strip().lower()
        if confirm != 'yes':
            print("❌ Deletion cancelled.")
            return
            
        # Delete associated payments first (due to foreign key constraint)
        cursor.execute("DELETE FROM payments WHERE booking_id = %s", (booking_id,))
        
        # Then delete the booking
        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
        
        conn.commit()
        print("✅ Booking deleted successfully!")
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        conn.rollback()

def main():
    global current_user
    
    print("\n===== WELCOME TO HOTEL GRAND MANAGEMENT SYSTEM =====")
    
    while True:
        print("\n===== MAIN MENU =====")
        if not is_logged_in():
            print("1. Signup")
            print("2. Login")
            print("12. Exit")
            choice = input("Enter your choice: ").strip()
            
            if choice == '1':
                signup()
            elif choice == '2':
                if login():
                    current_user = True
            elif choice == '12':
                print("Thank you for using Hotel Grand Management System!")
                break
            else:
                print("❌ Invalid choice. Please login first!")
        else:
            print(f"\nLogged in as {current_user}")
            print("3. Add Booking")
            print("4. View All Bookings")
            print("5. Search Booking")
            print("6. Update Booking")
            print("7. Delete Booking")
            print("8. Generate Report")
            print("9. Record Payment")
            print("10. Show Hotel Info")
            print("11. Check Room Availability")
            print("12. Logout & Exit")
            
            choice = input("Enter your choice: ").strip()
            
            conn = connect_db()
            if not conn:
                continue
            
            try:
                if choice == '3':
                    add_booking(conn)
                elif choice == '4':
                    view_all_bookings(conn)
                elif choice == '5':
                    search_booking(conn)
                elif choice == '6':
                    update_booking(conn)
                elif choice == '7':
                    delete_booking(conn)
                elif choice == '8':
                    generate_report(conn)
                elif choice == '9':
                    record_payment(conn)
                elif choice == '10':
                    show_hotel_info()
                elif choice == '11':
                    check_room_availability(conn)
                elif choice == '12':
                    print("Thank you for using Hotel Grand Management System!")
                    current_user = None
                    break
                else:
                    print("❌ Invalid choice!")
            finally:
                conn.close()

if __name__ == "__main__":
    # Initialize database tables if they don't exist
    conn = connect_db()
    if conn:
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS room_types (
                room_type VARCHAR(50) PRIMARY KEY,
                price_per_night DECIMAL(10,2) NOT NULL,
                amenities TEXT
            )
        """)
        
        # Insert default room types if empty
        cursor.execute("SELECT COUNT(*) FROM room_types")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT INTO room_types (room_type, price_per_night, amenities)
                VALUES (%s, %s, %s)
            """, [
                ("Single", 1500, "1 Bed,Wi-Fi,Attached Bathroom"),
                ("Double", 2500, "2 Beds,Wi-Fi,Attached Bathroom,TV"),
                ("Deluxe", 4000, "AC,Mini Bar,Balcony,TV,Room Service"),
                ("Suite", 6000, "King Bed,Living Area,Jacuzzi,Balcony,All Deluxe Features")
            ])
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                room_number VARCHAR(10) PRIMARY KEY,
                room_type VARCHAR(50) NOT NULL,
                FOREIGN KEY (room_type) REFERENCES room_types(room_type)
            )
        """)
        cursor.execute("SELECT COUNT(*) FROM rooms")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT IGNORE INTO rooms (room_number, room_type) VALUES (%s,%s)    
            """, [
                ('101', 'Single'), ('102', 'Single'), ('201', 'Double'), 
                ('202', 'Double'), ('301', 'Deluxe'), ('302', 'Deluxe'),
                ('401', 'Suite'), ('402', 'Suite')
            ])
        
        
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(100) NOT NULL,
                contact_number VARCHAR(15) NOT NULL,
                email VARCHAR(100) NOT NULL,
                aadhaar VARCHAR(12) NOT NULL,
                room_type VARCHAR(50) NOT NULL,
                check_in DATE NOT NULL,
                check_out DATE NOT NULL,
                guests INT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(20) NOT NULL,
                check_in_time TIME,
                is_paid BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (room_type) REFERENCES room_types(room_type)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                payment_amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(20) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    main()