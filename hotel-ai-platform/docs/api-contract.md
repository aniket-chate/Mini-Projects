# Hotel Grand AI — API Contract

## 1. Overview
All frontend interactions communicate with the FastAPI backend through `frontend/js/api.js`. The backend endpoints are strictly validated and backed by the local MySQL database (`hotel_management` on port 3306). All endpoints below are verified directly against the backend router implementations.

---

## 2. Health Check (`backend/main.py`)
- **`GET /api/health`**
  - **Purpose**: System health and neural engine status.
  - **Request**: None
  - **Response**:
    ```json
    {
      "status": "online",
      "system": "Hotel Grand Quantum AI",
      "version": "2.0.0"
    }
    ```

---

## 3. Authentication Router (`backend/routers/auth.py` — prefix `/api/auth`)
- **`POST /api/auth/login`**
  - **Purpose**: Authenticate user credentials and return a session token.
  - **Request Body** (`application/json`):
    ```json
    {
      "username": "guest",
      "password": "guest123"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Welcome back, guest (GUEST)",
      "user": {
        "id": 3,
        "username": "guest",
        "role": "guest",
        "created_at": "2026-09-23 14:05:00"
      },
      "token": "token-3-guest-guest"
    }
    ```

- **`POST /api/auth/signup`**
  - **Purpose**: Register a new user account.
  - **Request Body** (`application/json`):
    ```json
    {
      "username": "newuser",
      "password": "password123",
      "role": "guest",
      "passcode": null
    }
    ```
  - **Note**: Registering with role `staff` or `manager` strictly requires an administrative security passcode (`passcode`).
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Guest account created successfully!",
      "user": { "id": 4, "username": "newuser", "role": "guest" },
      "token": "token-4-newuser-guest"
    }
    ```

- **`GET /api/auth/me`**
  - **Purpose**: Validate current session token from the `Authorization: Bearer <token>` header.
  - **Request**: Header `Authorization: Bearer <token>`
  - **Response**:
    ```json
    {
      "authenticated": true,
      "user": {
        "id": 3,
        "username": "guest",
        "role": "guest",
        "created_at": "2026-09-23 14:05:00"
      }
    }
    ```

- **`GET /api/auth/users`**
  - **Purpose**: List registered users across roles for administration.
  - **Request**: None
  - **Response**:
    ```json
    {
      "success": true,
      "users": [
        { "id": 1, "username": "manager", "role": "manager", "created_at": "..." },
        { "id": 2, "username": "staff", "role": "staff", "created_at": "..." },
        { "id": 3, "username": "guest", "role": "guest", "created_at": "..." }
      ]
    }
    ```

---

## 4. Rooms & Inventory Router (`backend/routers/rooms.py` — prefix `/api/rooms`)
- **`GET /api/rooms`**
  - **Purpose**: Fetch all room units with real-time occupancy status for today, active booking details, floor, and amenities.
  - **Request**: None
  - **Response**:
    ```json
    {
      "success": true,
      "rooms": [
        {
          "room_number": "101",
          "room_type": "Single",
          "price_per_night": 1500.0,
          "amenities": "1 Bed, High-speed Wi-Fi, Attached Bath, Smart Room Controls",
          "floor": 1,
          "is_occupied": false,
          "current_booking": null,
          "amenities_list": ["1 Bed", "High-speed Wi-Fi", "Attached Bath", "Smart Room Controls"]
        }
      ]
    }
    ```

- **`GET /api/rooms/types`**
  - **Purpose**: Retrieve distinct room categories, tariffs, and amenities list.
  - **Request**: None
  - **Response**:
    ```json
    {
      "success": true,
      "room_types": [
        {
          "room_type": "Single",
          "price_per_night": 1500.0,
          "amenities": "1 Bed, High-speed Wi-Fi, Attached Bath, Smart Room Controls",
          "amenities_list": ["1 Bed", "High-speed Wi-Fi", "Attached Bath", "Smart Room Controls"]
        }
      ]
    }
    ```

- **`GET /api/rooms/availability`**
  - **Purpose**: Real-time availability check and dynamic pricing calculation.
  - **Query Parameters**:
    - `room_type` (string, required)
    - `check_in` (date YYYY-MM-DD, default today)
    - `check_out` (date YYYY-MM-DD, required)
  - **Response**:
    ```json
    {
      "success": true,
      "available": true,
      "available_rooms": 2,
      "pricing": {
        "room_type": "Deluxe",
        "nights": 1,
        "base_price": 4000.0,
        "final_price_per_night": 3600.0,
        "total_amount": 3600.0,
        "multipliers": [
          { "factor": "Occupancy Demand (<50%)", "multiplier": 0.9 }
        ]
      }
    }
    ```

---

## 5. Bookings & Reservations Router (`backend/routers/bookings.py` — prefix `/api/bookings`)
- **`GET /api/bookings`**
  - **Purpose**: Operational reservations ledger listing all bookings.
  - **Query Parameters**: `limit` (int, default 50)
  - **Response**:
    ```json
    {
      "success": true,
      "count": 16,
      "bookings": [
        {
          "id": 1,
          "customer_name": "Aniket Chate",
          "contact_number": "9876543210",
          "email": "aniket@example.com",
          "aadhaar": "********9012",
          "room_type": "Deluxe",
          "check_in": "2026-09-29",
          "check_out": "2026-09-30",
          "guests": 2,
          "total_amount": 3600.0,
          "payment_method": "online",
          "check_in_time": "14:00:00",
          "is_paid": true,
          "paid": 3600.0,
          "room_number": "301",
          "status": "confirmed",
          "created_at": "2026-09-29 10:00:00"
        }
      ]
    }
    ```

- **`GET /api/bookings/my`**
  - **Purpose**: Fetch reservations for a specific guest.
  - **Query Parameters**: `username` (string, required)
  - **Response**:
    ```json
    {
      "success": true,
      "count": 1,
      "bookings": [ ... ]
    }
    ```

- **`POST /api/bookings`**
  - **Purpose**: Create a new room reservation. Automatically allocates an available room unit and calculates dynamic pricing.
  - **Request Body** (`application/json`):
    ```json
    {
      "customer_name": "Jane Doe",
      "contact_number": "9876543210",
      "email": "jane@example.com",
      "aadhaar": "123456789012",
      "room_type": "Deluxe",
      "check_in": "2026-09-29",
      "check_out": "2026-09-30",
      "guests": 2,
      "payment_method": "online",
      "room_number": null,
      "username": "jane"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Reservation confirmed! Room #301 allocated.",
      "booking_id": 17,
      "allocated_room": "301",
      "pricing": {
        "room_type": "Deluxe",
        "nights": 1,
        "base_price": 4000.0,
        "final_price_per_night": 3600.0,
        "total_amount": 3600.0,
        "multipliers": [...]
      }
    }
    ```

- **`GET /api/bookings/search`**
  - **Purpose**: Search reservations by guest name, Aadhaar, or contact number.
  - **Query Parameters**: `q` (string, required)
  - **Response**:
    ```json
    {
      "success": true,
      "results": [ ... ]
    }
    ```

- **`DELETE /api/bookings/{booking_id}`**
  - **Purpose**: Cancel reservation and release allocated room. Deletes associated payment records.
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Booking #17 cancelled and removed"
    }
    ```

---

## 6. Payments Router (`backend/routers/payments.py` — prefix `/api/payments`)
- **`POST /api/payments`**
  - **Purpose**: Process settlement for a reservation balance.
  - **Request Body** (`application/json`):
    ```json
    {
      "booking_id": 17,
      "amount": 3600.0,
      "payment_method": "online",
      "transaction_id": null
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Payment of ₹3600.00 processed successfully!",
      "transaction_id": "TX-ABCD1234",
      "total_amount": 3600.0,
      "paid_so_far": 3600.0,
      "remaining_due": 0.0,
      "is_fully_paid": true
    }
    ```

- **`GET /api/payments/recent`**
  - **Purpose**: Ledger audit trail of recent transactions.
  - **Query Parameters**: `limit` (int, default 15)
  - **Response**:
    ```json
    {
      "success": true,
      "payments": [
        {
          "id": 1,
          "booking_id": 17,
          "payment_amount": 3600.0,
          "payment_method": "online",
          "transaction_id": "TX-ABCD1234",
          "payment_date": "2026-09-29 10:15:00",
          "customer_name": "Jane Doe",
          "room_type": "Deluxe"
        }
      ]
    }
    ```

---

## 7. Reports & Telemetry Router (`backend/routers/reports.py` — prefix `/api/reports`)
- **`GET /api/reports/telemetry`**
  - **Purpose**: Live hotel operations telemetry for Staff & Executive Manager consoles.
  - **Request**: None
  - **Response**:
    ```json
    {
      "success": true,
      "telemetry": {
        "total_bookings": 16,
        "total_revenue": 69199.0,
        "paid_bookings": 10,
        "pending_bookings": 6,
        "total_rooms": 8,
        "active_occupied_rooms": 3,
        "overall_occupancy_percent": 37.5,
        "occupancy_breakdown": [
          { "room_type": "Single", "occupied_count": 1, "total_count": 2, "occupancy_rate": 50.0 },
          { "room_type": "Double", "occupied_count": 1, "total_count": 2, "occupancy_rate": 50.0 },
          { "room_type": "Deluxe", "occupied_count": 1, "total_count": 2, "occupancy_rate": 50.0 },
          { "room_type": "Suite", "occupied_count": 0, "total_count": 2, "occupancy_rate": 0.0 }
        ],
        "revenue_by_method": [
          { "payment_method": "online", "total": 45000.0 }
        ],
        "recent_activity": [ ... ]
      }
    }
    ```

---

## 8. AI Engine Router (`backend/routers/ai.py` — prefix `/api/ai`)
- **`POST /api/ai/chat`**
  - **Purpose**: Multi-turn role-based AI Concierge conversation (NOVA).
  - **Request Body** (`application/json`):
    ```json
    {
      "message": "What luxury dining options are available tonight?",
      "history": [],
      "role": "guest",
      "username": "guest"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "reply": "At Hotel Grand, we offer...",
        "intent": "dining_inquiry",
        "role": "guest",
        "suggested_actions": ["View Dining Menu", "Reserve Table"]
      }
    }
    ```

- **`POST /api/ai/scan-id`**
  - **Purpose**: Smart pre-arrival AI Check-In OCR extraction.
  - **Request** (`multipart/form-data`):
    - `document_text`: Optional string simulation.
    - `file`: Optional image/PDF file upload.
  - **Response**:
    ```json
    {
      "success": true,
      "extracted": {
        "full_name": "Aniket Chate",
        "id_type": "Aadhaar",
        "id_number": "1234 5678 9012",
        "dob": "1995-05-15",
        "phone": "9876543210",
        "email": "aniket@example.com",
        "confidence": 0.96
      }
    }
    ```

- **`POST /api/ai/feedback`**
  - **Purpose**: Submit guest feedback with automated sentiment intelligence scoring.
  - **Request Body** (`application/json`):
    ```json
    {
      "guest_name": "Jane Doe",
      "rating": 5,
      "comment": "Exceptional stay. The AI Concierge and room amenities were world-class."
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Thank you for your feedback!",
      "analysis": {
        "sentiment": "Positive",
        "sentiment_score": 0.95,
        "urgent_alert": false
      }
    }
    ```

- **`GET /api/ai/feedback`**
  - **Purpose**: Retrieve guest feedback testimonials and sentiment audit trail.
  - **Query Parameters**: `limit` (int, default 15)
  - **Response**:
    ```json
    {
      "success": true,
      "feedback": [ ... ]
    }
    ```
