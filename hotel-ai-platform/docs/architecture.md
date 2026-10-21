# Hotel Grand AI — System Architecture

## 1. Overview
Hotel Grand AI is a production-grade luxury hospitality management platform that seamlessly unifies a refined guest digital experience with back-office hotel operations and an integrated neural AI concierge.

## 2. Core Architectural Principles
- **Luxury Hotel First, AI Technology Second**: Digital AI features are woven naturally into the guest journey rather than appearing as futuristic or neon widgets.
- **Strict Role-Based Access Control (RBAC)**: Distinct, isolated experiences for **Guest**, **Staff**, and **General Manager**.
- **Real-Time Data Integrity**: All operations (reservations, availability, dynamic pricing, occupancy telemetry, settlements) communicate directly with live backend endpoints and MySQL ledger tables. Zero mock production data.
- **Single Source of Truth**: The active repository and database are the authoritative ground truth for all implementation behavior.

## 3. Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ASGI Server**: Uvicorn (`127.0.0.1:8000`) with auto-reload
- **Database**: MySQL (`hotel_management` on port 3306) with direct connection pooling and parameterized query execution
- **Database Schema**:
  - `users`: Credentials, password hash (`SHA-256`), roles (`guest`, `staff`, `manager`), and creation timestamps.
  - `room_types`: Master inventory types (`Single`, `Double`, `Deluxe`, `Suite`), base prices per night, and amenities catalog.
  - `rooms`: Individual room units (`101`, `102`, `201`, `202`, `301`, `302`, `401`, `402`), room type foreign key, and floor assignment.
  - `bookings`: Reservations ledger, customer names, contact info, Aadhaar ID, dates, guest count, dynamically calculated tariffs, payment status flags, room allocations, and guest username link.
  - `payments`: Transaction records, payment methods (`online`, `card`, `cash`), unique transaction IDs, amounts, and settlement timestamps.
  - `feedback`: Guest reviews, ratings (1-5 stars), sentiment classifications (`Positive`, `Neutral`, `Urgent`), sentiment scores, and management alert flags.

### AI Engine Subsystems (`backend/ai_engine/`)
1. **NOVA AI Concierge (`concierge.py`)**:
   - Multi-turn conversational companion with contextual role adaptations:
     - **Guest**: Room recommendations, amenities, dining, booking assistance, and Bangalore city guidance.
     - **Staff**: Daily arrivals, departures, unallocated rooms, and payment collections.
     - **Manager**: Occupancy telemetry, ADR, RevPAR, and gross revenue briefings.
   - Speech synthesis controls: real-time voice reading, interruptible stop buttons, mute preference.
2. **Dynamic Pricing Engine (`dynamic_pricing.py`)**:
   - Calculates real-time room tariffs based on base rates, occupancy demand multipliers, and seasonal/weekend demand curves.
3. **Smart Vision ID Scanner (`id_scanner.py`)**:
   - Computer vision OCR pipeline for extracting name, national ID (Aadhaar, Passport), and date of birth with confidence scoring.
4. **Sentiment Intelligence Engine (`sentiment.py`)**:
   - Real-time NLP analysis of guest reviews, outputting sentiment polarity, subjectivity, and management alert triggers.

### Frontend
- **Structure**: Vanilla HTML5 semantic architecture with accessible modal dialogs (`frontend/index.html`). Zero bloated framework runtimes.
- **Styles**: Custom Vanilla CSS design system (`frontend/css/luxury.css`, `frontend/css/animations.css`). Curated editorial luxury palette, refined typography, and responsive grid layouts.
- **Typography**: Google Fonts (`Playfair Display`, `Plus Jakarta Sans`, `JetBrains Mono`).
- **JavaScript Controllers**:
  - `API` (`frontend/js/api.js`): Unified HTTP client communicating with all 27 FastAPI endpoints.
  - `RoomVisualizer` (`frontend/js/room_visualizer.js`): Luxury suite gallery cards, filters, and detail modals.
  - `Dashboard` (`frontend/js/dashboard.js`): Operations ledger, revenue telemetry, category occupancy tracks, search.
  - `AIConcierge` (`frontend/js/ai_concierge.js`): Floating launcher, message stream, speech synthesis controls, voice recognition.
  - `AppController` (`frontend/js/app.js`): Central coordinator handling RBAC, navigation tabs, booking checkout, payments, and live clock.

## 4. Engineering Development Workflow
The project is configured around an autonomous, verified engineering loop:
```
AUDIT → GSD PLAN → IMPLEMENT → RALPH ITERATE → RUN TESTS → CODERABBIT REVIEW → FIX VERIFIED ISSUES → GSD VERIFY → NEXT PHASE
```
- **GSD**: Project mapping, requirements, specifications, phase planning, and verification.
- **Ralph**: Iterative task execution, persistent state in `progress.txt`, automated loops.
- **CodeRabbit**: Independent automated code review, bug detection, security, accessibility, and performance auditing.
- **Repository**: Ground truth for implementation.
