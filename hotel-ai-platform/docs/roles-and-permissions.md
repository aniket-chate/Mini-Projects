# Hotel Grand AI — Roles and Permissions (RBAC)

## 1. Overview
Hotel Grand AI strictly enforces Role-Based Access Control across the public guest portal and the operational management backend.

---

## 2. Role Matrix

| Feature / Capability | Guest | Staff | Manager |
|---|:---:|:---:|:---:|
| **Public Hotel Website & Hero** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Browse Suites & Room Details** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Check Room Availability & Dynamic Rates** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Book A Stay** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **My Reservations Portal** | ✅ Personal Bookings | ❌ (Directed to Ledger) | ❌ (Directed to Ledger) |
| **Pre-Arrival Smart AI Check-In** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Submit Guest Feedback** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Operations Hub (Command Center)** | ❌ Restricted | ✅ Full Access | ✅ Full Access |
| **All Bookings Search & Management** | ❌ Restricted | ✅ Full Access | ✅ Full Access |
| **Room Allocation & Check-In/Check-Out**| ❌ Restricted | ✅ Full Access | ✅ Full Access |
| **Balance Payment Collection** | ✅ Online Self-Pay | ✅ Authorize Payments | ✅ Authorize Payments |
| **Executive Telemetry (Gross Revenue)** | ❌ Hidden | ✅ Visible | ✅ Visible |
| **Executive Analytics (ADR, RevPAR)** | ❌ Hidden | ❌ Staff Console | ✅ Full Executive Suite |
| **NOVA AI Concierge** | ✅ Guest Mode | ✅ Staff Mode | ✅ Manager Mode |

---

## 3. Role Details

### Guest
- **Target Audience**: Prospective and staying luxury hotel travelers.
- **Permitted Views**:
  - `tab-rooms`: Room listing, category filters, detail modal, availability calculation.
  - `tab-experiences`: Dining, wellness, and local Bangalore excursions.
  - `tab-mybookings`: Personal booking history, balance payment modal.
  - `tab-checkin`: AI document upload and verification.
  - `tab-feedback`: Review submission and testimonials stream.
- **NOVA Mode**: Warm, friendly concierge offering suite recommendations, amenities details, Bangalore guides, and booking assistance.

### Staff
- **Target Audience**: Front desk agents, receptionists, operations coordinators.
- **Permitted Views**:
  - All public views plus `tab-dashboard` (Operations Hub).
  - Searchable reservation ledger with customer contact info and balance tracking.
  - Room allocation to vacant rooms.
  - Check-In and Check-Out processing.
  - Reservation cancellation and room release.
- **NOVA Mode**: Operational assistant delivering daily arrivals, occupied rooms, pending balances, and housekeeping status.

### Manager
- **Target Audience**: Hotel General Manager, Financial Controller, Executive Management.
- **Permitted Views**:
  - Full, unrestricted access to the entire platform.
  - Executive Revenue Telemetry (Gross Revenue, Live Occupancy, Category Breakdown).
  - Performance KPIs (ADR, RevPAR, Demand factors).
  - VIP arrival tracking and dynamic pricing diagnostics.
- **NOVA Mode**: Executive business intelligence briefing delivering occupancy summaries, revenue trends, ADR, and RevPAR metrics.
