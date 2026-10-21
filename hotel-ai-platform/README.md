# 🏨 Hotel Grand // Next-Gen AI Hospitality Platform

A futuristic, AI-powered hotel management system and guest portal built with **FastAPI**, **MySQL**, **Modern Cyber-Luxury Web UI**, and an **AI Intelligence Engine** (Gemini Vision OCR, Neural Concierge, and Dynamic Pricing Algorithms).

---

## ⚡ Key Features

1. **🤖 NOVA: AI Voice & Chat Concierge:**
   - Real-time conversational booking, amenity inquiry, and pricing assistant.
   - Built-in Speech-to-Text voice recognition and futuristic speech synthesis.
   - Auto-checks live MySQL database availability and assists bookings.

2. **📈 AI Dynamic Pricing Engine:**
   - Rates adapt dynamically according to live hotel occupancy, weekend demand peaks, and advance booking rewards.
   - Complete itemized breakdown provided to guests and managers.

3. **🪪 Smart AI Vision Check-In:**
   - OCR document scanner that extracts Name, 12-digit Aadhaar/ID, Phone, and Email to auto-fill reservations in seconds.

4. **🎛️ Command Center (Admin Telemetry HUD):**
   - Live revenue metrics, real-time occupancy gauge, room category telemetry, and an interactive ledger to record payments or cancel bookings.

5. **💬 AI Review & Sentiment Intelligence:**
   - Analyzes customer feedback to detect polarity and automatically flags urgent issues directly to the duty manager.

6. **🎨 Cyber-Luxury Futuristic Interface:**
   - Pure HTML5/Vanilla CSS/JS with Glassmorphism, Neon glow accents, and responsive 3D card tilts.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the Application
```bash
python run.py
```

### 3. Open in Browser
- **Futuristic Web Application:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📁 Project Architecture

```
hotel-ai-platform/
├── hotel_management_test.py      # Untouched original CLI script
├── run.py                        # One-click FastAPI server launcher
├── requirements.txt              # Dependencies
├── .env.example                  # Environment configuration
│
├── backend/
│   ├── main.py                   # FastAPI server entry point
│   ├── config.py                 # Configuration settings
│   ├── database.py               # MySQL connection & table management
│   ├── routers/
│   │   ├── auth.py               # User authentication routes
│   │   ├── rooms.py              # Live room statuses & availability
│   │   ├── bookings.py           # Reservation lifecycle
│   │   ├── payments.py           # Payment recording & transactions
│   │   ├── reports.py            # Telemetry & real-time analytics
│   │   └── ai.py                 # AI Concierge, OCR, & Sentiment endpoints
│   └── ai_engine/
│       ├── concierge.py          # Conversational agent & booking tool-calling
│       ├── dynamic_pricing.py    # Demand/occupancy rate calculation
│       ├── id_scanner.py         # Aadhaar/ID vision card parser
│       └── sentiment.py          # Feedback sentiment analysis
│
└── frontend/
    ├── index.html                # Main futuristic portal & command center
    ├── css/
    │   ├── futuristic.css        # Cyber-luxury design system & glassmorphism
    │   └── animations.css        # Holographic scanlines & audio waves
    └── js/
        ├── api.js                # Backend API connector
        ├── ai_concierge.js       # Voice recognition & chat UI with audio synth
        ├── room_visualizer.js    # Interactive room grid & live occupancy
        ├── dashboard.js          # Admin live telemetry charts & ledger
        └── app.js                # State management & routing coordinator
```
