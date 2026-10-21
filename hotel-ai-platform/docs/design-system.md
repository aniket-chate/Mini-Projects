# Hotel Grand AI — Design System

## 1. Visual Philosophy
The design language is inspired by high-end hospitality editorial platforms (such as the Dribbble reference [https://dribbble.com/shots/24572509-Hotel-Website](https://dribbble.com/shots/24572509-Hotel-Website)). It moves away from dark neon/cyberpunk aesthetics to a warm, organic, architectural luxury environment.

## 2. Color Palette & Design Tokens

```css
:root {
    /* Backgrounds & Canvas */
    --background: #F7F5F0;        /* Warm Linen Canvas */
    --surface: #FFFFFF;           /* Crisp Architectural White */
    --surface-soft: #EFEBE3;      /* Soft Alabaster */
    --surface-muted: #E2DDD5;     /* Muted Sand */

    /* Typography & Contrast */
    --text-primary: #171717;      /* Deep Charcoal */
    --text-secondary: #6F6A61;    /* Warm Slate */
    --text-muted: #9E978C;        /* Stone Grey */

    /* Brand Accent & Identity */
    --primary: #26382F;           /* Deep Regal Forest Green */
    --primary-hover: #1E2D25;     /* Darkened Pine */
    --primary-dark: #17251F;      /* Midnight Forest */
    --accent: #B69A68;            /* Champagne Bronze / Brushed Gold */
    --accent-hover: #9E8353;      /* Deep Gold */
    --accent-soft: #D8C6A2;       /* Warm Champagne */
    --accent-light: #F4EEDF;      /* Pale Gold Tint */
    --accent-glow: rgba(182, 154, 104, 0.25);

    /* Status Indicators */
    --success: #4D7659;           /* Sage Green */
    --warning: #B6863C;           /* Amber Bronze */
    --danger: #A64B4B;            /* Muted Terracotta Crimson */
    --danger-bg: #FDF1F1;         /* Pale Blush */

    /* Borders & Outlines */
    --border: rgba(23, 23, 23, 0.08);
    --border-soft: rgba(23, 23, 23, 0.05);
    --border-strong: rgba(23, 23, 23, 0.16);

    /* Elevation & Shadows */
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.06);
    --shadow-soft: 0 12px 40px rgba(0, 0, 0, 0.08);
    --shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.12);
    --shadow-modal: 0 24px 64px rgba(23, 37, 31, 0.28);

    /* Border Radii */
    --radius-xs: 4px;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 28px;
    --radius-full: 9999px;

    /* Transitions */
    --transition-fast: 0.18s ease;
    --transition-normal: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    --transition-slow: 0.5s ease;
}
```

## 3. Typography Hierarchy
- **Editorial Display & Major Headings**:
  - `font-family: 'Playfair Display', Georgia, serif;`
  - Used for Hero Headline (`clamp(2.8rem, 6vw, 5rem)`), Section Titles (`2.4rem`), Modal Titles (`1.55rem`), Suite Titles (`1.45rem`), and Tariff Numbers.
- **UI & Content Sans-Serif**:
  - `font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;`
  - Used for body text, navigation links, buttons, inputs, tables, and concierge chat messages.
- **Technical Monospace**:
  - `font-family: 'JetBrains Mono', monospace;`
  - Strictly limited to booking identifiers (`#18`), transaction codes, Bangalore time clock, room numbers, and confidence metrics.

## 4. Reusable Component Catalog
- **Header (`.site-header`)**: Monogram badge (`HG`), horizontal navigation items (`.nav-item-btn`), Bangalore clock badge, auth HUD, and "Reserve Stay" primary CTA.
- **Hero Banner (`.hero-editorial`)**: Full-width architectural photography with subtle gradient overlay, editorial title with italic accents (`em`), sub-pill, and dual action buttons.
- **Floating Availability Bar (`.floating-search-bar`)**: Overlaps the hero fold with 4 discrete input units (Check-In, Check-Out, Suite Type, Guests) and instant search action.
- **Room Cards (`.luxury-room-card`)**: High-res imagery with zoom on hover, suite specifications (`2 Guests · 1 King Bed · 42 m²`), amenities pills, dynamic rate display, "View Details", and "Reserve" triggers.
- **Room Detail Modal (`#roomDetailModal`)**: Gallery preview with clickable thumbnail switcher, full room narrative, dimensional specs bar, and reservation button.
- **Operations Console (`#tab-dashboard`)**: KPI metric cards (Gross Revenue, Live Occupancy, Total Bookings, AI Latency), occupancy category progress tracks, guest search bar, and searchable table ledger.
- **Guest Portal (`#tab-mybookings`)**: Stay itinerary cards/tables with payment status tags (`PAID IN FULL` / `BALANCE DUE`) and inline payment triggers.
- **NOVA Floating Concierge (`.concierge-float-launcher` & `#conciergeWindow`)**: Subtle bottom-right champagne gold trigger opening an editorial chat window with role mode badge, animated audio wave bar, and interrupt voice reading buttons.
