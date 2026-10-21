# Hotel Grand AI — Redesign Product Requirements Document (PRD)

## 1. Executive Summary
This document establishes the comprehensive engineering and visual redesign plan for the existing Hotel Grand AI / Hotel Management System. The objective is to elevate the existing functional web application into a luxury hospitality experience inspired by high-end editorial hospitality design, while strictly maintaining 100% of existing backend functionality, database integrity, and operational workflows.

---

## 2. Core Non-Negotiable Rules
1. **Tooling & Setup First**: Redesign implementation begins only after tooling and development workflows are fully configured and verified.
2. **Zero Backend Regression**: Do not replace or break the FastAPI backend, MySQL database schema, dynamic pricing math, OCR extraction, or sentiment scoring.
3. **Verified Information Only**: All components, file references, and API dependencies in this PRD are verified against the active codebase. Unverified details are marked as *"Not verified from the repository."*
4. **Single Source of Truth**: The active repository and database are the authoritative ground truth for all implementation behavior.
5. **No Blind Code Generation**: Quality > Speed. Every major step follows:
   `AUDIT → GSD PLAN → IMPLEMENT → RALPH ITERATE → RUN TESTS → CODERABBIT REVIEW → FIX VERIFIED ISSUES → GSD VERIFY → NEXT PHASE`

---

## 3. Redesign Implementation Phases

### PHASE 1: Project Audit
- **Objective**: Conduct a deep static and runtime audit of the existing repository to establish a baseline of existing DOM element IDs, API endpoints, database connections, and test coverage before making UI changes.
- **Files/Components Likely Affected**:
  - `backend/main.py`
  - `backend/database.py`
  - `backend/routers/` (`auth.py`, `rooms.py`, `bookings.py`, `payments.py`, `reports.py`, `ai.py`)
  - `frontend/index.html`
  - `frontend/js/` (`api.js`, `app.js`, `dashboard.js`, `room_visualizer.js`, `ai_concierge.js`)
  - `hotel_management_test.py`
  - `manual_check.py`
- **Backend/API Dependencies**:
  - `GET /api/health`
  - Direct MySQL connectivity on `localhost:3306`
- **Acceptance Criteria**:
  - Full inventory of all 96+ `getElementById` references across JS controllers mapped to corresponding HTML elements.
  - Baseline execution of test suite completes without errors.
  - Detailed audit findings documented in `.planning/audit_baseline.md`.
- **Tests Required**:
  - Run `python manual_check.py` and `python hotel_management_test.py`.
- **Rollback Considerations**:
  - Read-only phase; no application code is modified. Revert any temporary audit scripts if created.

---

### PHASE 2: Design System
- **Objective**: Consolidate and refine the luxury design tokens, CSS variables, typography scales, elevation shadows, and micro-animations in dedicated stylesheets without altering HTML structures.
- **Files/Components Likely Affected**:
  - `frontend/css/luxury.css`
  - `frontend/css/animations.css`
- **Backend/API Dependencies**:
  - None (pure CSS design system tokens).
- **Acceptance Criteria**:
  - All color tokens (`--background: #F7F5F0`, `--primary: #26382F`, `--accent: #B69A68`, etc.) clearly defined in `:root`.
  - Google Fonts properly linked (`Playfair Display`, `Plus Jakarta Sans`, `JetBrains Mono`).
  - Fluid typography clamps and standard spacing/radius tokens established.
  - Zero reliance on external CSS utility frameworks (Tailwind/Bootstrap).
- **Tests Required**:
  - CSS syntax validation.
  - Visual inspection of token cascades in browser developer tools.
- **Rollback Considerations**:
  - Git rollback of `frontend/css/` to the pre-phase commit if visual regression occurs.

---

### PHASE 3: Global Layout & Navigation
- **Objective**: Implement the luxury hotel header with brand monogram (`HG`), Bangalore time clock badge, dynamic RBAC badge, role switcher modal triggers, and mobile drawer, plus the editorial footer.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`header.site-header`, `footer.site-footer`, `#mobileNavDrawer`)
  - `frontend/css/luxury.css`
  - `frontend/js/app.js` (navigation handlers, clock ticker, drawer toggles)
- **Backend/API Dependencies**:
  - `GET /api/auth/me` (session validation for auth HUD)
- **Acceptance Criteria**:
  - Site header sticks or scrolls smoothly with high visual refinement.
  - Bangalore clock updates every second with format `HH:MM:SS IST`.
  - Auth HUD displays active user and role badge (`GUEST`, `STAFF`, `MANAGER`).
  - Mobile navigation drawer functions smoothly on viewports < 768px.
  - All existing DOM IDs for navigation buttons (`#nav-rooms`, `#nav-dashboard`, `#nav-mybookings`, etc.) preserved.
- **Tests Required**:
  - Tab navigation switching test in browser.
  - Clock tick verification in DOM.
  - Mobile viewport toggle test (375px, 390px).
- **Rollback Considerations**:
  - Revert `frontend/index.html` navigation section and `frontend/js/app.js` navigation state.

---

### PHASE 4: Homepage
- **Objective**: Elevate the editorial hero section, floating date/occupancy availability bar, and curated experiences section (Dining, Wellness, Pool).
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#heroSection`, `.floating-search-bar`, `#tab-experiences`)
  - `frontend/css/luxury.css`
  - `frontend/js/app.js`
- **Backend/API Dependencies**:
  - `GET /api/rooms/availability` (dynamic tariff preview)
  - `GET /api/rooms/types`
- **Acceptance Criteria**:
  - High-impact editorial photography and serif typography hierarchy (`Playfair Display`).
  - Floating availability bar accepts Check-In, Check-Out, Suite Type, and Guest count.
  - Search trigger initiates dynamic availability query and scrolls smoothly to room deck.
- **Tests Required**:
  - Availability search trigger test with valid dates.
  - Date validation test (Check-out must be after Check-in).
- **Rollback Considerations**:
  - Revert changes to hero section DOM and related CSS blocks.

---

### PHASE 5: Rooms and Room Details
- **Objective**: Redesign room cards deck and room detail modal to display high-resolution imagery, room dimensions, capacity pills, dynamic pricing, and gallery preview.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#roomsDeck`, `#roomDetailModal`)
  - `frontend/js/room_visualizer.js`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `GET /api/rooms`
  - `GET /api/rooms/types`
- **Acceptance Criteria**:
  - Room cards dynamically rendered from `GET /api/rooms` with floor and status indicators.
  - Category filter pills (`All`, `Single`, `Double`, `Deluxe`, `Suite`) filter deck instantly.
  - "View Details" opens `#roomDetailModal` with interactive thumbnail gallery switcher.
  - "Reserve Stay" triggers the booking modal with pre-selected room type.
- **Tests Required**:
  - Room card rendering verification (8 rooms total: 101, 102, 201, 202, 301, 302, 401, 402).
  - Filter category test.
  - Modal open/close and thumbnail switch tests.
- **Rollback Considerations**:
  - Revert `frontend/js/room_visualizer.js` and room modal DOM.

---

### PHASE 6: Booking Flow
- **Objective**: Refine the reservation modal with live dynamic pricing calculations, guest Aadhaar input, and instant room allocation feedback.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#bookingModal`, `#bookingForm`)
  - `frontend/js/app.js` (reservation submission and pricing calculations)
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `GET /api/rooms/availability`
  - `POST /api/bookings`
- **Acceptance Criteria**:
  - Changing dates or room type triggers live calculation displaying base tariff, multipliers, and total amount.
  - Form validates Aadhaar (12 digits), phone, email, and guest counts.
  - On submission, calls `POST /api/bookings`, allocates room, and displays confirmation modal with booking ID.
- **Tests Required**:
  - Automated reservation creation test via API.
  - Dynamic price change verification on date shift.
  - Form validation error handling test.
- **Rollback Considerations**:
  - Restore `app.js` booking submission logic and booking modal structure.

---

### PHASE 7: My Bookings (Guest Portal)
- **Objective**: Provide authenticated and guest users with an elegant itinerary view showing current and past reservations, balance dues, and payment settlement actions.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#tab-mybookings`, `#myBookingsTable`, `#myBookingsList`)
  - `frontend/js/app.js`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `GET /api/bookings/my?username={username}`
  - `POST /api/payments`
- **Acceptance Criteria**:
  - Displays reservations associated with active user or searched guest name.
  - Clearly shows payment status tags: `PAID IN FULL` (Sage Green) or `BALANCE DUE` (Amber Bronze).
  - "Pay Balance" button opens payment modal with pre-filled booking ID and due amount.
- **Tests Required**:
  - My Bookings fetch test for guest account.
  - Settlement payment flow verification.
- **Rollback Considerations**:
  - Revert `tab-mybookings` HTML and rendering function in `app.js`.

---

### PHASE 8: AI Check-In (Vision OCR)
- **Objective**: Modernize the pre-arrival smart ID check-in dropzone with high-precision drag-and-drop, simulated scan sample triggers, and structured identity extraction presentation.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#tab-checkin`, `#idDropzone`, `#scanResultsCard`)
  - `frontend/js/app.js` (OCR upload handler)
  - `backend/ai_engine/id_scanner.py`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `POST /api/ai/scan-id`
- **Acceptance Criteria**:
  - Supports file upload (`image/png`, `image/jpeg`, `application/pdf`) and text paste/simulation.
  - Displays extracted details: Name, Document Type (Aadhaar/Passport), ID Number, DOB, and Confidence Score.
  - "Prefill Reservation" button transfers extracted details directly to booking form.
- **Tests Required**:
  - Test `POST /api/ai/scan-id` with text simulation.
  - Test file upload parsing with test image/bytes.
- **Rollback Considerations**:
  - Revert `#tab-checkin` container and OCR handler functions.

---

### PHASE 9: Staff Command Center
- **Objective**: Overhaul the operations console for staff with category occupancy progress bars, searchable guest ledger, check-in/out timestamps, and quick cancellation actions.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#tab-dashboard`, `#bookingsLedgerTable`, `#staffSearchInput`)
  - `frontend/js/dashboard.js`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `GET /api/reports/telemetry`
  - `GET /api/bookings`
  - `GET /api/bookings/search`
  - `DELETE /api/bookings/{id}`
- **Acceptance Criteria**:
  - Restricted to `staff` and `manager` roles via RBAC guard.
  - Displays category occupancy progress tracks (`Single`, `Double`, `Deluxe`, `Suite`).
  - Real-time search filters ledger by guest name, phone, or Aadhaar.
  - Cancel action prompts for confirmation and executes `DELETE /api/bookings/{id}`.
- **Tests Required**:
  - RBAC access check (restricted for guest, allowed for staff/manager).
  - Search query test.
  - Booking deletion and inventory release test.
- **Rollback Considerations**:
  - Revert `frontend/js/dashboard.js` and dashboard HTML.

---

### PHASE 10: Manager Analytics
- **Objective**: Provide general managers with an executive telemetry dashboard featuring Gross Revenue metrics, occupancy rate dials, ADR (Average Daily Rate), RevPAR estimates, and payment channel distribution.
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#managerExecutiveSection`, `#telemetryKpiCards`)
  - `frontend/js/dashboard.js`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `GET /api/reports/telemetry`
  - `GET /api/payments/recent`
- **Acceptance Criteria**:
  - Visible exclusively when active role is `manager`.
  - Shows total revenue formatted in Indian Rupee currency (`₹`), live occupancy percentage, paid vs. pending counts.
  - Displays breakdown of revenue by payment method (`online`, `card`, `cash`).
- **Tests Required**:
  - Telemetry endpoint test `GET /api/reports/telemetry`.
  - Verify manager-only visibility logic.
- **Rollback Considerations**:
  - Revert manager telemetry elements and rendering in `dashboard.js`.

---

### PHASE 11: Reviews & Sentiment Intelligence
- **Objective**: Redesign the guest feedback submission experience with 5-star rating controls and a curated live testimonials stream showing AI sentiment tags (`Positive`, `Neutral`, `Urgent`).
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#tab-feedback`, `#feedbackForm`, `#reviewsStream`)
  - `frontend/js/app.js`
  - `backend/ai_engine/sentiment.py`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `POST /api/ai/feedback`
  - `GET /api/ai/feedback`
- **Acceptance Criteria**:
  - Clean star-rating selector and comment input with client-side validation.
  - Real-time sentiment classification returned and rendered with badge styling.
  - Urgent alerts flagged for management attention if sentiment score < 0.3.
- **Tests Required**:
  - Submit positive feedback test (rating 5 -> "Positive").
  - Submit critical feedback test (rating 1 -> "Urgent").
  - Test feedback listing endpoint.
- **Rollback Considerations**:
  - Revert `#tab-feedback` section and feedback submission handler.

---

### PHASE 12: NOVA AI Virtual Concierge
- **Objective**: Elevate the floating NOVA AI Concierge with a luxury champagne gold launcher, natural conversational persona, role mode chips (`Guest`, `Staff`, `Manager`), voice reading controls (mute toggle, interrupt stop button, speaking wave animation).
- **Files/Components Likely Affected**:
  - `frontend/index.html` (`#conciergeLauncher`, `#conciergeWindow`, `#conciergeMessages`)
  - `frontend/js/ai_concierge.js`
  - `backend/ai_engine/concierge.py`
  - `frontend/css/luxury.css`
- **Backend/API Dependencies**:
  - `POST /api/ai/chat`
- **Acceptance Criteria**:
  - Floating launcher toggles editorial chat window smoothly.
  - Displays role-specific quick inquiry chips on mount.
  - Speaks responses using Web Speech API (with interrupt button and persistent mute preference).
  - Preserves multi-turn conversation history across session turns.
- **Tests Required**:
  - Chat interaction test across Guest, Staff, and Manager modes.
  - Speech synthesis mute toggle test.
  - Quick action chip click test.
- **Rollback Considerations**:
  - Revert `frontend/js/ai_concierge.js` and floating concierge DOM elements.

---

### PHASE 13: Responsive Optimization
- **Objective**: Thoroughly tune CSS media queries for cross-device fidelity across mobile (360px - 768px), tablet (768px - 1024px), and desktop (1024px - 1920px+).
- **Files/Components Likely Affected**:
  - `frontend/css/luxury.css`
  - `frontend/css/animations.css`
  - `frontend/index.html`
- **Backend/API Dependencies**:
  - None.
- **Acceptance Criteria**:
  - Zero horizontal overflow (`overflow-x: hidden`) on viewport widths 360px to 1920px.
  - Tables scroll horizontally or stack cleanly on mobile viewports.
  - Modal dialogs adapt to mobile screens with touch-friendly dismiss buttons.
- **Tests Required**:
  - Responsive audit across breakpoints (375x812, 768x1024, 1440x900).
- **Rollback Considerations**:
  - Revert media query adjustments in `luxury.css`.

---

### PHASE 14: Integration Testing
- **Objective**: Execute end-to-end integration tests validating authentication, room browsing, availability pricing, reservation creation, payment recording, telemetry reporting, and AI endpoints.
- **Files/Components Likely Affected**:
  - `hotel_management_test.py`
  - `manual_check.py`
  - `backend/main.py`
- **Backend/API Dependencies**:
  - All 27 FastAPI endpoints.
  - Live MySQL database.
- **Acceptance Criteria**:
  - 100% test pass rate across all backend routers and workflows.
  - All responses conform to `api-contract.md`.
  - Zero unhandled 500 internal server errors.
- **Tests Required**:
  - Full run of `python manual_check.py`.
  - Full run of `python hotel_management_test.py`.
- **Rollback Considerations**:
  - Investigate and fix any regressions revealed by integration tests.

---

### PHASE 15: Final QA & Browser Verification
- **Objective**: Conduct comprehensive visual and interactive Quality Assurance in the browser, verifying zero console errors, DOM ID integrity, performance, and accessibility.
- **Files/Components Likely Affected**:
  - `frontend/index.html`
  - All JS and CSS assets.
  - `docs/progress.txt`
- **Backend/API Dependencies**:
  - Full running system at `http://127.0.0.1:8000`.
- **Acceptance Criteria**:
  - Zero JavaScript uncaught exceptions or console errors.
  - 100% parity between DOM element IDs and JavaScript event bindings.
  - All core guest, staff, and manager user journeys verified end-to-end.
  - Final development documentation and progress tracker updated to complete.
- **Tests Required**:
  - Browser interactive validation across all tabs and modals.
  - Lighthouse / accessibility inspection.
- **Rollback Considerations**:
  - Fix any identified visual glitches or interactive defects before final sign-off.
