import sys
import mysql.connector
from mysql.connector import pooling
import hashlib
from datetime import datetime
from backend.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Helper for password hashing
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection():
    """Create and return a MySQL database connection."""
    try:
        return mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            autocommit=True
        )
    except mysql.connector.Error as err:
        print(f"❌ Database connection error: {err}")
        return None

def init_db():
    """Initialize required database tables if they do not already exist."""
    # First connect without database to ensure database exists
    try:
        root_conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        root_cur = root_conn.cursor()
        root_cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        root_cur.close()
        root_conn.close()
    except Exception as e:
        print(f"Warning checking database existence: {e}")

    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()
    try:
        # Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(64) NOT NULL,
                role VARCHAR(20) DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Room Types Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS room_types (
                room_type VARCHAR(50) PRIMARY KEY,
                price_per_night DECIMAL(10,2) NOT NULL,
                amenities TEXT
            )
        """)

        # Default Room Types if empty
        cursor.execute("SELECT COUNT(*) FROM room_types")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT INTO room_types (room_type, price_per_night, amenities)
                VALUES (%s, %s, %s)
            """, [
                ("Single", 1500, "1 Bed, High-speed Wi-Fi, Attached Bath, Smart Room Controls"),
                ("Double", 2500, "2 Beds, High-speed Wi-Fi, 4K Smart TV, Attached Bath"),
                ("Deluxe", 4000, "King Bed, Smart AC, Holographic Balcony, Mini Bar, 24/7 Room Service"),
                ("Suite", 6000, "Master Penthouse, Living Area, Private Jacuzzi, Panoramic Balcony, AI Butler")
            ])

        # Rooms Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                room_number VARCHAR(10) PRIMARY KEY,
                room_type VARCHAR(50) NOT NULL,
                floor INT DEFAULT 1,
                FOREIGN KEY (room_type) REFERENCES room_types(room_type)
            )
        """)

        # Default Rooms if empty
        cursor.execute("SELECT COUNT(*) FROM rooms")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT IGNORE INTO rooms (room_number, room_type, floor) VALUES (%s, %s, %s)
            """, [
                ('101', 'Single', 1), ('102', 'Single', 1),
                ('201', 'Double', 2), ('202', 'Double', 2),
                ('301', 'Deluxe', 3), ('302', 'Deluxe', 3),
                ('401', 'Suite', 4),  ('402', 'Suite', 4)
            ])

        # Bookings Table
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
                paid DECIMAL(10,2) DEFAULT 0.00,
                room_number VARCHAR(10),
                status VARCHAR(20) DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_type) REFERENCES room_types(room_type)
            )
        """)

        # Schema migrations if columns are missing
        column_migrations = [
            ("bookings", "paid", "DECIMAL(10,2) DEFAULT 0.00"),
            ("bookings", "room_number", "VARCHAR(10)"),
            ("bookings", "status", "VARCHAR(20) DEFAULT 'confirmed'"),
            ("bookings", "username", "VARCHAR(50)"),
            ("payments", "transaction_id", "VARCHAR(50)"),
            ("users", "role", "VARCHAR(20) DEFAULT 'staff'"),
            ("rooms", "floor", "INT DEFAULT 1")
        ]
        for tbl_name, col_name, col_type in column_migrations:
            try:
                cursor.execute(f"ALTER TABLE {tbl_name} ADD COLUMN {col_name} {col_type}")
            except mysql.connector.Error:
                pass

        # Seed default role users if they do not exist
        default_users = [
            ("manager", hash_password("manager123"), "manager"),
            ("staff", hash_password("staff123"), "staff"),
            ("guest", hash_password("guest123"), "guest")
        ]
        for uname, pword, urole in default_users:
            cursor.execute("SELECT id, role FROM users WHERE username = %s", (uname,))
            existing = cursor.fetchone()
            if not existing:
                cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", (uname, pword, urole))
            elif existing[1] != urole:
                cursor.execute("UPDATE users SET role = %s WHERE username = %s", (urole, uname))

        conn.commit()

        # Payments Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                payment_amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(20) NOT NULL,
                transaction_id VARCHAR(50),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            )
        """)

        # Guest Reviews & AI Sentiment Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guest_name VARCHAR(100) NOT NULL,
                rating INT NOT NULL,
                comment TEXT NOT NULL,
                sentiment VARCHAR(20),
                sentiment_score DECIMAL(3,2),
                urgent_alert BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        print("✅ Database tables successfully initialized.")
    except mysql.connector.Error as err:
        print(f"❌ Error during database init: {err}")
    finally:
        cursor.close()
        conn.close()
