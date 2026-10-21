/**
 * Command Center (Admin Telemetry & Operations Dashboard) Controller
 * Editorial Luxury Management Interface
 */
class Dashboard {
    constructor() {
        this.bookingsTable = document.getElementById('dashboardBookingsTable');
        this.searchInput = document.getElementById('bookingSearchInput');
        this.searchBtn = document.getElementById('bookingSearchBtn');
        this.bindEvents();
    }

    bindEvents() {
        if (this.searchBtn && this.searchInput) {
            this.searchBtn.addEventListener('click', () => this.handleSearch());
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }
    }

    async init() {
        await this.loadTelemetry();
        await this.loadBookings();
    }

    async loadTelemetry() {
        try {
            const data = await API.getTelemetry();
            if (data.success && data.telemetry) {
                const t = data.telemetry;

                // Update Overview KPI Numbers
                const elRev = document.getElementById('statTotalRevenue');
                const elOcc = document.getElementById('statOccupancy');
                const elOccSub = document.getElementById('statOccupancySub');
                const elTotal = document.getElementById('statTotalBookings');
                const elPaid = document.getElementById('statPaidBookings');

                if (elRev) elRev.innerText = `₹${t.total_revenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                if (elOcc) elOcc.innerText = `${t.overall_occupancy_percent}%`;
                if (elOccSub) elOccSub.innerText = `${t.active_occupied_rooms}/${t.total_rooms} Rooms in house`;
                if (elTotal) elTotal.innerText = t.total_bookings;
                if (elPaid) elPaid.innerText = `${t.paid_bookings} Settled · ${t.pending_bookings} Due`;

                // Render Occupancy Bars with luxury styling
                const occContainer = document.getElementById('occupancyBreakdownBars');
                if (occContainer && t.occupancy_breakdown) {
                    occContainer.innerHTML = t.occupancy_breakdown.map(b => `
                        <div style="margin-bottom: 14px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.84rem; margin-bottom: 6px;">
                                <span style="font-weight: 600; color: var(--text-primary);">${b.room_type} Suites</span>
                                <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">
                                    ${b.occupied_count}/${b.total_count} Occupied (${b.occupancy_rate || 0}%)
                                </span>
                            </div>
                            <div class="progress-track-luxury">
                                <div class="progress-fill-luxury" style="width: ${Math.min(100, b.occupancy_rate || 0)}%;"></div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (err) {
            console.error("Telemetry load error:", err);
        }
    }

    async loadBookings() {
        if (!this.bookingsTable) return;
        this.bookingsTable.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted); font-style: italic;">Loading reservations ledger...</td></tr>';

        try {
            const data = await API.getBookings();
            if (data.success) {
                this.renderBookings(data.bookings);
            }
        } catch (err) {
            this.bookingsTable.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--danger);">Failed to retrieve reservations.</td></tr>';
        }
    }

    async handleSearch() {
        const q = this.searchInput.value.trim();
        if (!q) {
            this.loadBookings();
            return;
        }

        this.bookingsTable.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">Searching guest registry...</td></tr>';
        try {
            const data = await API.searchBookings(q);
            if (data.success) {
                this.renderBookings(data.results);
            }
        } catch (err) {
            this.bookingsTable.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--danger);">Search query error.</td></tr>';
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    renderBookings(bookings) {
        if (!this.bookingsTable) return;
        if (!bookings || bookings.length === 0) {
            this.bookingsTable.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">No reservations found in registry.</td></tr>';
            return;
        }

        this.bookingsTable.innerHTML = bookings.map(b => {
            if (window.App && window.App.bookingsMap) {
                window.App.bookingsMap.set(b.id, b);
            }
            const isPaid = b.is_paid;
            const statusBadge = isPaid 
                ? '<span class="status-badge-luxury paid">PAID IN FULL</span>'
                : '<span class="status-badge-luxury due">BALANCE DUE</span>';

            const safeName = this.escapeHtml(b.customer_name);
            const safeRoomType = this.escapeHtml(b.room_type);
            const safeRoomNumber = b.room_number ? 'Suite #' + this.escapeHtml(b.room_number) : 'Unassigned';

            return `
                <tr>
                    <td style="font-family: var(--font-mono); color: var(--primary); font-weight: 600;">#${b.id}</td>
                    <td style="font-weight: 600; color: var(--text-primary);">${safeName}</td>
                    <td>
                        <span style="font-family: var(--font-mono); font-size: 0.8rem; background: var(--surface-soft); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border);">
                            ${safeRoomNumber}
                        </span>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${safeRoomType}</div>
                    </td>
                    <td style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-secondary);">${b.check_in} → ${b.check_out}</td>
                    <td style="font-family: var(--font-heading); font-weight: 700; color: var(--primary);">₹${parseFloat(b.total_amount).toLocaleString('en-IN')}</td>
                    <td style="font-family: var(--font-mono); color: var(--success); font-weight: 600;">₹${parseFloat(b.paid).toLocaleString('en-IN')}</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                        <button type="button" class="btn-luxury-secondary" style="padding: 4px 10px; font-size: 0.72rem; margin-right: 4px;"
                            onclick="App.openVoucherModalById(${b.id})">
                            🧾 Voucher
                        </button>
                        ${!isPaid ? `
                            <button type="button" class="btn-luxury-primary" style="padding: 4px 10px; font-size: 0.72rem; margin-right: 4px;" 
                                onclick="App.openPaymentModalById(${b.id})">
                                Collect
                            </button>
                        ` : ''}
                        <button type="button" class="btn-logout" style="padding: 4px 8px; font-size: 0.72rem;" 
                            title="Cancel Booking" onclick="App.confirmDeleteBooking(${b.id})">
                            Cancel
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

window.Dashboard = Dashboard;
