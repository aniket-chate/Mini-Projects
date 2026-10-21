/**
 * Hotel Grand AI Platform - Main Application Coordinator
 * Luxury Hospitality × Intelligent Digital Architecture
 */
class AppController {
    constructor() {
        this.currentTab = 'rooms';
        this.roomVisualizer = null;
        this.concierge = null;
        this.dashboard = null;
        this.activeBookingPrice = null;
        this.currentUser = null;
        this.bookingsMap = new Map();
    }

    async init() {
        // Initialize sub-controllers
        this.roomVisualizer = new RoomVisualizer('roomGridContainer');
        await this.roomVisualizer.init();

        this.concierge = new AIConcierge();
        this.dashboard = new Dashboard();

        this.initAuth();
        this.bindNavigation();
        this.bindHeroSearch();
        this.bindModals();
        this.bindAuthModals();
        this.bindRoomDetailModal();
        this.bindSmartCheckIn();
        this.bindFeedback();
        this.bindExperienceModal();
        this.bindVoucherModal();

        // Initial clock tick & reviews stream
        this.startHospitalityClock();
        this.loadReviewsStream();
    }

    // --- Authentication & RBAC ---
    initAuth() {
        const storedUser = localStorage.getItem('hotel_user');
        const storedToken = localStorage.getItem('hotel_token');

        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                if (storedToken) this.currentUser.token = storedToken;
            } catch (e) {
                this.currentUser = null;
            }
        }

        const role = this.currentUser ? this.currentUser.role : 'guest';
        this.applyRolePermissions(role);
        this.renderAuthHud();
    }

    renderAuthHud() {
        const hud = document.getElementById('authHud');
        if (!hud) return;

        if (this.currentUser) {
            const roleIcons = { manager: '👑', staff: '👔', guest: '👤' };
            const roleNames = { manager: 'Manager', staff: 'Staff', guest: 'Guest' };
            const icon = roleIcons[this.currentUser.role] || '👤';
            const label = roleNames[this.currentUser.role] || this.currentUser.role;

            hud.innerHTML = `
                <div class="user-profile-badge">
                    <span class="role-pill role-${this.currentUser.role}">
                        ${icon} ${label}
                    </span>
                    <span style="font-weight: 600; font-size: 0.82rem; color: var(--text-primary);">${this.currentUser.username}</span>
                    <button type="button" class="btn-logout" onclick="App.logout()" title="Sign Out">Sign Out</button>
                </div>
            `;
        } else {
            hud.innerHTML = `
                <button type="button" class="btn-luxury-secondary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="App.openAuthModal()">
                    Sign In
                </button>
            `;
        }
    }

    applyRolePermissions(role = 'guest') {
        const navDashboard = document.getElementById('navDashboard');
        const navMyBookings = document.getElementById('navMyBookings');
        const mobNavDashboard = document.getElementById('mobileNavDashboard');
        const mobNavMyBookings = document.getElementById('mobileNavMyBookings');
        const cardRevenue = document.getElementById('cardRevenueTelemetry');
        const heroSection = document.getElementById('section-hero');
        const searchBar = document.getElementById('floatingSearchBar');

        if (role === 'guest') {
            // Guest permissions:
            // - Rooms, Smart Check-In, Feedback, and My Bookings (if logged in)
            // - Hide internal staff Command Center and gross revenue telemetry
            if (navDashboard) navDashboard.style.display = 'none';
            if (mobNavDashboard) mobNavDashboard.style.display = 'none';
            if (navMyBookings) navMyBookings.style.display = this.currentUser ? 'inline-block' : 'none';
            if (mobNavMyBookings) mobNavMyBookings.style.display = this.currentUser ? 'block' : 'none';
            if (cardRevenue) cardRevenue.style.display = 'none';
            if (heroSection) heroSection.style.display = 'flex';
            if (searchBar) searchBar.style.display = 'block';

            // If guest was looking at command center, reroute to rooms
            if (this.currentTab === 'dashboard') {
                this.switchTab('rooms');
            }
            if (this.currentUser) {
                this.loadMyBookings();
            }
        } else if (role === 'staff') {
            // Staff permissions:
            // - Rooms, Smart Check-In, Command Center, Feedback
            // - Show revenue/occupancy telemetry
            if (navDashboard) {
                navDashboard.style.display = 'inline-block';
                navDashboard.innerText = 'Operations Hub';
            }
            if (mobNavDashboard) {
                mobNavDashboard.style.display = 'block';
                mobNavDashboard.innerText = 'Operations Hub';
            }
            if (navMyBookings) navMyBookings.style.display = 'none';
            if (mobNavMyBookings) mobNavMyBookings.style.display = 'none';
            if (cardRevenue) cardRevenue.style.display = 'flex';

            if (this.currentTab === 'mybookings') {
                this.switchTab('dashboard');
            }
        } else if (role === 'manager') {
            // Manager permissions:
            // - Unrestricted full access to all consoles, reports, telemetry
            if (navDashboard) {
                navDashboard.style.display = 'inline-block';
                navDashboard.innerText = 'Executive Analytics';
            }
            if (mobNavDashboard) {
                mobNavDashboard.style.display = 'block';
                mobNavDashboard.innerText = 'Executive Analytics';
            }
            if (navMyBookings) navMyBookings.style.display = 'none';
            if (mobNavMyBookings) mobNavMyBookings.style.display = 'none';
            if (cardRevenue) cardRevenue.style.display = 'flex';

            if (this.currentTab === 'mybookings') {
                this.switchTab('dashboard');
            }
        }

        // Dynamically adjust NOVA AI assistant mode
        if (this.concierge) {
            this.concierge.updateRoleUI(role);
        }
    }

    openAuthModal() {
        const modal = document.getElementById('authModal');
        if (!modal) return;
        const errLogin = document.getElementById('loginError');
        const errReg = document.getElementById('registerError');
        const succReg = document.getElementById('registerSuccess');
        if (errLogin) errLogin.style.display = 'none';
        if (errReg) errReg.style.display = 'none';
        if (succReg) succReg.style.display = 'none';

        modal.classList.add('active');
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.remove('active');
    }

    switchAuthTab(tab) {
        const tabLogin = document.getElementById('tabAuthLogin');
        const tabReg = document.getElementById('tabAuthRegister');
        const formLogin = document.getElementById('loginForm');
        const formReg = document.getElementById('registerForm');

        if (tab === 'login') {
            tabLogin?.classList.add('active');
            tabReg?.classList.remove('active');
            if (formLogin) formLogin.style.display = 'block';
            if (formReg) formReg.style.display = 'none';
        } else {
            tabReg?.classList.add('active');
            tabLogin?.classList.remove('active');
            if (formLogin) formLogin.style.display = 'none';
            if (formReg) formReg.style.display = 'block';
        }
    }

    handleRoleSelectChange() {
        const roleSel = document.getElementById('regRole');
        const passGroup = document.getElementById('passcodeGroup');
        if (roleSel && passGroup) {
            if (roleSel.value === 'staff' || roleSel.value === 'manager') {
                passGroup.style.display = 'block';
            } else {
                passGroup.style.display = 'none';
            }
        }
    }

    bindAuthModals() {
        const closeBtn = document.getElementById('closeAuthModal');
        const modal = document.getElementById('authModal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => this.closeAuthModal();
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAuthModal();
            });
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.onsubmit = async (e) => {
                e.preventDefault();
                const u = document.getElementById('loginUsername').value.trim();
                const p = document.getElementById('loginPassword').value.trim();
                await this.executeLogin(u, p);
            };
        }

        const regForm = document.getElementById('registerForm');
        if (regForm) {
            regForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.executeRegister();
            };
        }
    }

    async quickLogin(role) {
        const credentials = {
            manager: { u: 'manager', p: 'manager123' },
            staff: { u: 'staff', p: 'staff123' },
            guest: { u: 'guest', p: 'guest123' }
        };

        const cred = credentials[role];
        if (cred) {
            document.getElementById('loginUsername').value = cred.u;
            document.getElementById('loginPassword').value = cred.p;
            await this.executeLogin(cred.u, cred.p);
        }
    }

    async executeLogin(username, password) {
        const errEl = document.getElementById('loginError');
        if (errEl) errEl.style.display = 'none';

        try {
            const res = await API.login(username, password);
            if (res.success && res.user) {
                this.currentUser = res.user;
                const token = res.token || res.session_token || '';
                this.currentUser.token = token;

                localStorage.setItem('hotel_user', JSON.stringify(res.user));
                localStorage.setItem('hotel_token', token);

                this.closeAuthModal();
                this.applyRolePermissions(res.user.role);
                this.renderAuthHud();

                // If manager or staff, reload dashboard metrics
                if (res.user.role !== 'guest') {
                    this.dashboard.init();
                } else {
                    this.loadMyBookings();
                }
            } else {
                if (errEl) {
                    errEl.innerText = res.detail || "Authentication rejected.";
                    errEl.style.display = 'block';
                }
            }
        } catch (err) {
            if (errEl) {
                errEl.innerText = "Error reaching authentication service.";
                errEl.style.display = 'block';
            }
        }
    }

    async executeRegister() {
        const errEl = document.getElementById('registerError');
        const succEl = document.getElementById('registerSuccess');
        if (errEl) errEl.style.display = 'none';
        if (succEl) succEl.style.display = 'none';

        const u = document.getElementById('regUsername').value.trim();
        const p = document.getElementById('regPassword').value.trim();
        const role = document.getElementById('regRole').value;
        const passcode = document.getElementById('regPasscode')?.value.trim() || null;

        try {
            const res = await API.signup(u, p, role, passcode);
            if (res.success) {
                if (succEl) {
                    succEl.innerText = `Account created! Logging you in as ${role}...`;
                    succEl.style.display = 'block';
                }
                setTimeout(async () => {
                    await this.executeLogin(u, p);
                }, 700);
            } else {
                if (errEl) {
                    errEl.innerText = res.detail || "Registration failed.";
                    errEl.style.display = 'block';
                }
            }
        } catch (err) {
            if (errEl) {
                errEl.innerText = "Server error during registration.";
                errEl.style.display = 'block';
            }
        }
    }

    logout() {
        localStorage.removeItem('hotel_user');
        localStorage.removeItem('hotel_token');
        this.currentUser = null;

        this.applyRolePermissions('guest');
        this.renderAuthHud();

        if (this.currentTab === 'mybookings' || this.currentTab === 'dashboard') {
            this.switchTab('rooms');
        }
    }

    // --- Hero Availability Search Bar ---
    bindHeroSearch() {
        const checkInInput = document.getElementById('heroSearchCheckIn');
        const checkOutInput = document.getElementById('heroSearchCheckOut');
        const roomTypeSelect = document.getElementById('heroSearchRoomType');
        const guestsInput = document.getElementById('heroSearchGuests');
        const searchBtn = document.getElementById('btnHeroSearchAvailability');
        const feedbackEl = document.getElementById('heroSearchFeedback');

        // Set default dates: checkin = today, checkout = tomorrow
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        if (checkInInput && !checkInInput.value) checkInInput.value = today;
        if (checkOutInput && !checkOutInput.value) checkOutInput.value = tomorrow;

        if (searchBtn) {
            searchBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const roomType = roomTypeSelect ? roomTypeSelect.value : 'Deluxe';
                const cin = checkInInput ? checkInInput.value : today;
                const cout = checkOutInput ? checkOutInput.value : tomorrow;
                const guests = guestsInput ? parseInt(guestsInput.value) || 1 : 2;

                if (!cin || !cout || cout <= cin) {
                    if (feedbackEl) {
                        feedbackEl.className = 'search-availability-feedback error';
                        feedbackEl.innerText = 'Please select a check-out date after check-in.';
                        feedbackEl.style.display = 'flex';
                    }
                    return;
                }

                searchBtn.innerText = 'Checking...';
                try {
                    const res = await API.checkAvailability(roomType, cin, cout);
                    searchBtn.innerHTML = `<span>Search Availability</span> <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

                    if (res.success && res.pricing) {
                        const p = res.pricing;
                        if (feedbackEl) {
                            feedbackEl.className = 'search-availability-feedback success';
                            feedbackEl.innerHTML = `
                                <div>
                                    <strong>✓ ${roomType} Suite is available!</strong>
                                    <span>${p.nights} nights at ₹${p.final_price_per_night}/night · Total: ₹${p.total_amount}</span>
                                </div>
                                <button type="button" class="btn-luxury-primary" style="padding: 4px 12px; font-size: 0.75rem;"
                                    onclick="App.openBookingModal({room_type: '${roomType}', check_in: '${cin}', check_out: '${cout}', guests: ${guests}})">
                                    Reserve Now →
                                </button>
                            `;
                            feedbackEl.style.display = 'flex';
                        }
                    } else {
                        if (feedbackEl) {
                            feedbackEl.className = 'search-availability-feedback error';
                            feedbackEl.innerText = res.detail || `${roomType} is fully occupied for the selected dates.`;
                            feedbackEl.style.display = 'flex';
                        }
                    }
                } catch (err) {
                    searchBtn.innerHTML = `<span>Search Availability</span>`;
                    if (feedbackEl) {
                        feedbackEl.className = 'search-availability-feedback error';
                        feedbackEl.innerText = 'Could not connect to availability engine.';
                        feedbackEl.style.display = 'flex';
                    }
                }
            });
        }
    }

    // --- Room Details Modal Controller ---
    bindRoomDetailModal() {
        const modal = document.getElementById('roomDetailModal');
        const closeBtn = document.getElementById('closeRoomDetailModal');
        if (modal && closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }
    }

    openRoomDetails(roomType, roomNumber = '') {
        const modal = document.getElementById('roomDetailModal');
        if (!modal || !this.roomVisualizer) return;

        const info = this.roomVisualizer.roomImagery[roomType] || this.roomVisualizer.roomImagery['Deluxe'];
        const roomObj = this.roomVisualizer.roomsData.find(r => r.room_type === roomType) || {};

        document.getElementById('roomDetailTitle').innerText = `${roomType} Room`;
        document.getElementById('roomDetailSpecs').innerText = info.specs;
        document.getElementById('roomDetailDesc').innerText = info.description;
        document.getElementById('roomDetailMainImg').src = info.main;
        document.getElementById('roomDetailPrice').innerText = `₹${parseFloat(roomObj.price_per_night || 4000).toLocaleString('en-IN')}`;

        // Render thumbnails
        const thumbContainer = document.getElementById('roomDetailThumbs');
        if (thumbContainer && info.gallery) {
            thumbContainer.innerHTML = info.gallery.map((imgUrl, i) => `
                <div class="gallery-thumb-btn ${i === 0 ? 'active' : ''}" onclick="document.getElementById('roomDetailMainImg').src='${imgUrl}'; document.querySelectorAll('.gallery-thumb-btn').forEach(b => b.classList.remove('active')); this.classList.add('active');">
                    <img src="${imgUrl}" alt="Gallery Thumbnail">
                </div>
            `).join('');
        }

        // Action CTA
        const reserveBtn = document.getElementById('btnRoomDetailReserve');
        if (reserveBtn) {
            reserveBtn.onclick = () => {
                modal.classList.remove('active');
                this.openBookingModal({ room_type: roomType, room_number: roomNumber });
            };
        }

        modal.classList.add('active');
    }

    async loadMyBookings() {
        const container = document.getElementById('myBookingsContainer');
        if (!container) return;

        if (!this.currentUser) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem;">
                    <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">Please sign in to view your personal reservations.</p>
                    <button type="button" class="btn-luxury-primary" onclick="App.openAuthModal()">Sign In to My Bookings</button>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2.5rem; font-style: italic;">Retrieving reservations for ' + this.currentUser.username + '...</div>';

        try {
            const res = await API.getMyBookings(this.currentUser.username);
            if (res.success && res.bookings) {
                const list = res.bookings;
                if (list.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
                            <div style="font-size: 2.5rem; margin-bottom: 12px; color: var(--accent);">✦</div>
                            <h4 style="color: var(--primary); margin-bottom: 6px;">No Active Reservations</h4>
                            <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">You do not have any room bookings under your account yet.</p>
                            <button type="button" class="btn-luxury-primary" onclick="App.openBookingModal()">Reserve a Suite Now</button>
                        </div>
                    `;
                    return;
                }

                let html = `
                    <table class="luxury-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Suite Details</th>
                                <th>Stay Dates</th>
                                <th>Total Tariff</th>
                                <th>Payment Settlement</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                list.forEach(b => {
                    this.bookingsMap.set(b.id, b);
                    const isPaid = !!b.paid;
                    const paidBadge = isPaid
                        ? '<span class="status-badge-luxury paid">PAID IN FULL</span>'
                        : '<span class="status-badge-luxury due">BALANCE DUE</span>';

                    const voucherBtn = `<button type="button" class="btn-luxury-secondary" style="font-size: 0.75rem; padding: 5px 10px; margin-right: 6px;" onclick="App.openVoucherModalById(${b.id})">🧾 Voucher</button>`;

                    const actionBtn = isPaid
                        ? `${voucherBtn} <span style="color: var(--success); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">✓ Confirmed</span>`
                        : `${voucherBtn} <button type="button" class="btn-luxury-primary" style="font-size: 0.75rem; padding: 5px 14px;" onclick="App.openPaymentModalById(${b.id})">Settle Balance</button>`;

                    html += `
                        <tr>
                            <td style="font-family: var(--font-mono); color: var(--primary); font-weight: 600;">#${b.id}</td>
                            <td>
                                <strong>Suite ${b.room_number || 'Unassigned'}</strong>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${b.room_type} Room</span>
                            </td>
                            <td style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-secondary);">
                                ${b.check_in} → ${b.check_out}
                            </td>
                            <td style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--primary); font-weight: 700;">
                                ₹${parseFloat(b.total_amount).toFixed(2)}
                            </td>
                            <td>${paidBadge}</td>
                            <td style="text-align: right;">${actionBtn}</td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
                container.innerHTML = html;
            }
        } catch (e) {
            container.innerHTML = '<div style="color: var(--danger); padding: 1.5rem; text-align: center;">Unable to load your bookings.</div>';
        }
    }

    startHospitalityClock() {
        const clockEl = document.getElementById('quantumClock');
        if (clockEl) {
            const updateClock = () => {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                clockEl.innerText = `Bangalore (UTC+5:30) · ${timeStr}`;
            };
            updateClock();
            setInterval(updateClock, 1000);
        }
    }

    bindNavigation() {
        const navLinks = document.querySelectorAll('.nav-item-btn');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const target = link.dataset.tab;
                this.switchTab(target);
            });
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        document.querySelectorAll('.nav-item-btn').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-item-btn[data-tab="${tabId}"]`);
        if (activeLink) activeLink.classList.add('active');

        document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
        const activeMobLink = document.querySelector(`.mobile-nav-link[data-tab="${tabId}"]`);
        if (activeMobLink) activeMobLink.classList.add('active');

        // Hide all views
        document.querySelectorAll('.tab-view').forEach(view => {
            view.style.display = 'none';
        });

        // Show targeted view
        const targetEl = document.getElementById(`tab-${tabId}`);
        if (targetEl) {
            targetEl.style.display = 'block';
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (tabId === 'dashboard') {
            this.dashboard.init();
        } else if (tabId === 'rooms') {
            this.roomVisualizer.loadRooms();
        } else if (tabId === 'mybookings') {
            this.loadMyBookings();
        } else if (tabId === 'feedback') {
            this.loadReviewsStream();
        }
    }

    bindModals() {
        // Booking Modal triggers
        const bookModal = document.getElementById('bookingModal');
        const closeBookingBtn = document.getElementById('closeBookingModal');
        if (closeBookingBtn) closeBookingBtn.onclick = () => bookModal.classList.remove('active');

        // Payment Modal triggers
        const paymentModal = document.getElementById('paymentModal');
        const closePaymentBtn = document.getElementById('closePaymentModal');
        if (closePaymentBtn) closePaymentBtn.onclick = () => paymentModal.classList.remove('active');

        // Close on clicking overlay background
        [bookModal, paymentModal].forEach(m => {
            if (m) {
                m.addEventListener('click', (e) => {
                    if (e.target === m) m.classList.remove('active');
                });
            }
        });

        // Booking form date and type changes -> calculate live dynamic rate
        const bType = document.getElementById('bookRoomType');
        const bIn = document.getElementById('bookCheckIn');
        const bOut = document.getElementById('bookCheckOut');

        const updateRate = async () => {
            if (bType && bIn && bOut && bIn.value && bOut.value && bOut.value > bIn.value) {
                try {
                    const res = await API.checkAvailability(bType.value, bIn.value, bOut.value);
                    if (res.success && res.pricing) {
                        this.activeBookingPrice = res.pricing;
                        const p = res.pricing;
                        document.getElementById('bookingPriceEstimate').innerHTML = `
                            <div style="background: var(--surface-soft); border: 1px solid var(--border); padding: 14px; border-radius: var(--radius-sm);">
                                <div style="display:flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem;">
                                    <span style="color: var(--text-secondary);">Rate Per Night:</span>
                                    <span style="font-family: var(--font-heading); font-weight: 700; color: var(--primary);">₹${p.final_price_per_night}</span>
                                </div>
                                <div style="display:flex; justify-content: space-between; font-weight: 700; font-size: 1rem; border-top: 1px solid var(--border-soft); padding-top: 6px; margin-top: 6px;">
                                    <span>Total Amount (${p.nights} nights):</span>
                                    <span style="font-family: var(--font-heading); color: var(--primary); font-size: 1.25rem;">₹${p.total_amount}</span>
                                </div>
                                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">
                                    Dynamic factors applied: ${p.multipliers.map(m => m.factor).join(', ')}
                                </div>
                            </div>
                        `;
                    }
                } catch (e) {
                    console.error("Price check error:", e);
                }
            }
        };

        if (bType) bType.addEventListener('change', updateRate);
        if (bIn) bIn.addEventListener('change', updateRate);
        if (bOut) bOut.addEventListener('change', updateRate);

        // Booking form submit
        const bookForm = document.getElementById('bookingForm');
        if (bookForm) {
            bookForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.handleBookingSubmit();
            };
        }

        // Payment form submit
        const payForm = document.getElementById('paymentForm');
        if (payForm) {
            payForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.handlePaymentSubmit();
            };
        }
    }

    openBookingModal(prefill = {}) {
        const modal = document.getElementById('bookingModal');
        if (!modal) return;

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        // Autofill username if logged in and not specified in prefill
        const defaultName = prefill.name || (this.currentUser ? this.currentUser.username : '');
        document.getElementById('bookName').value = defaultName;

        if (prefill.phone) document.getElementById('bookPhone').value = prefill.phone;
        if (prefill.email) document.getElementById('bookEmail').value = prefill.email;
        if (prefill.aadhaar) document.getElementById('bookAadhaar').value = prefill.aadhaar;
        if (prefill.room_type) document.getElementById('bookRoomType').value = prefill.room_type;
        
        document.getElementById('bookCheckIn').value = prefill.check_in || today;
        document.getElementById('bookCheckOut').value = prefill.check_out || tomorrow;
        if (prefill.guests) document.getElementById('bookGuests').value = prefill.guests;

        // Trigger dynamic pricing estimation
        document.getElementById('bookRoomType').dispatchEvent(new Event('change'));

        modal.classList.add('active');
    }

    async handleBookingSubmit() {
        const payload = {
            customer_name: document.getElementById('bookName').value,
            contact_number: document.getElementById('bookPhone').value,
            email: document.getElementById('bookEmail').value,
            aadhaar: document.getElementById('bookAadhaar').value,
            room_type: document.getElementById('bookRoomType').value,
            check_in: document.getElementById('bookCheckIn').value,
            check_out: document.getElementById('bookCheckOut').value,
            guests: parseInt(document.getElementById('bookGuests').value) || 1,
            payment_method: document.getElementById('bookPaymentMethod').value,
            username: this.currentUser ? this.currentUser.username : null
        };

        const submitBtn = document.getElementById('btnSubmitBooking');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Confirming Reservation...';

        try {
            const res = await API.createBooking(payload);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Confirm Reservation';

            if (res.success) {
                this.showToast(`✨ Reservation Confirmed! Suite allocated. Total: ₹${res.pricing ? res.pricing.total_amount : ''}`, 'success');
                document.getElementById('bookingModal').classList.remove('active');
                this.roomVisualizer.loadRooms();
                this.dashboard.init();
                if (this.currentUser && this.currentUser.role === 'guest') {
                    this.loadMyBookings();
                }

                // Directly generate & present official digital stay voucher
                const confirmedBooking = res.booking || {
                    id: res.booking_id || Math.floor(100 + Math.random() * 900),
                    customer_name: payload.customer_name,
                    room_type: payload.room_type,
                    room_number: res.allocated_room || res.room_number || '',
                    check_in: payload.check_in,
                    check_out: payload.check_out,
                    guests: payload.guests,
                    paid: 0,
                    total_amount: res.pricing ? res.pricing.total_amount : 0
                };
                this.bookingsMap.set(confirmedBooking.id, confirmedBooking);
                setTimeout(() => this.openVoucherModal(confirmedBooking), 400);
            } else {
                this.showToast(`❌ Booking Failed: ${res.detail || 'Room unavailable for selected dates'}`, 'error');
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Confirm Reservation';
            this.showToast(`❌ Error connecting to server: ${err.message}`, 'error');
        }
    }

    openPaymentModal(bookingId, customerName, totalAmount, paidSoFar) {
        const modal = document.getElementById('paymentModal');
        if (!modal) return;

        const remaining = Math.max(0, totalAmount - paidSoFar);

        document.getElementById('payBookingId').value = bookingId;
        document.getElementById('payCustomerName').innerText = customerName;
        document.getElementById('payTotalDue').innerText = `₹${remaining.toFixed(2)}`;
        document.getElementById('payAmount').value = remaining.toFixed(2);
        document.getElementById('payAmount').max = remaining;

        modal.classList.add('active');
    }

    openPaymentModalById(id) {
        const b = this.bookingsMap.get(Number(id)) || this.bookingsMap.get(String(id));
        if (b) {
            this.openPaymentModal(b.id, b.customer_name, b.total_amount, b.paid || 0);
        }
    }

    openVoucherModalById(id) {
        const b = this.bookingsMap.get(Number(id)) || this.bookingsMap.get(String(id));
        if (b) {
            this.openVoucherModal(b);
        }
    }

    async handlePaymentSubmit() {
        const bookingId = parseInt(document.getElementById('payBookingId').value);
        const amount = parseFloat(document.getElementById('payAmount').value);
        const paymentMethod = document.getElementById('payMethod').value;

        try {
            const res = await API.recordPayment({
                booking_id: bookingId,
                amount: amount,
                payment_method: paymentMethod
            });

            if (res.success) {
                this.showToast(`✅ Payment Recorded Successfully! TX: ${res.transaction_id}`, 'success');
                document.getElementById('paymentModal').classList.remove('active');
                this.dashboard.init();
                this.roomVisualizer.loadRooms();
                if (this.currentUser && this.currentUser.role === 'guest') {
                    this.loadMyBookings();
                }
            } else {
                this.showToast(`❌ Payment Failed: ${res.detail || res.message}`, 'error');
            }
        } catch (err) {
            this.showToast(`❌ Payment Error: ${err.message}`, 'error');
        }
    }

    async confirmDeleteBooking(bookingId) {
        if (!confirm(`Are you sure you want to cancel reservation #${bookingId}?`)) return;
        try {
            const res = await API.deleteBooking(bookingId);
            if (res.success) {
                this.showToast(res.message || `Reservation #${bookingId} cancelled.`, 'success');
                this.dashboard.init();
                this.roomVisualizer.loadRooms();
                if (this.currentUser && this.currentUser.role === 'guest') {
                    this.loadMyBookings();
                }
            } else {
                this.showToast("Failed to cancel reservation.", "error");
            }
        } catch (err) {
            this.showToast("Failed to delete booking.", "error");
        }
    }

    bindSmartCheckIn() {
        const dropzone = document.getElementById('ocrDropzone');
        const fileInput = document.getElementById('ocrFileInput');
        const sampleBtn = document.getElementById('btnSampleOcr');
        const samplePassport = document.getElementById('btnSamplePassport');
        const sampleDL = document.getElementById('btnSampleDL');

        if (dropzone && fileInput) {
            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) await this.runOcr(null, file);
            };
        }

        if (sampleBtn) {
            sampleBtn.onclick = async () => {
                const sampleDoc = `
GOVERNMENT OF INDIA / AADHAAR
Name: Siddharth Deshmukh
DOB: 12/04/1995
Gender: Male
12-Digit Aadhaar: 9874 5612 3490
Phone: 9823019283
Email: siddharth.d@gmail.com
                `;
                await this.runOcr(sampleDoc, null);
            };
        }

        if (samplePassport) {
            samplePassport.onclick = async () => {
                const sampleDoc = `
REPUBLIC OF INDIA / PASSPORT
Surname: CHATE, Given Name: ANIKET
Nationality: INDIAN
DOB: 15/08/1996
Passport No: Z4918274
Phone: 9845012345
Email: aniket.chate@hotelgrand.in
                `;
                await this.runOcr(sampleDoc, null);
            };
        }

        if (sampleDL) {
            sampleDL.onclick = async () => {
                const sampleDoc = `
UNION OF INDIA / DRIVING LICENCE
Name: Priya Sharma
DOB: 22/11/1998
DL Number: KA01-20210087456
Phone: 9900112233
Email: priya.sharma@luxuryguest.com
                `;
                await this.runOcr(sampleDoc, null);
            };
        }
    }

    async runOcr(text, file) {
        const statusEl = document.getElementById('ocrStatus');
        if (statusEl) statusEl.innerHTML = '<div style="color: var(--accent); padding: 10px; font-style: italic;">✦ Verifying identity with Vision AI Neural Scanner...</div>';

        try {
            const res = await API.scanIdDocument(text, file);
            if (res.success && res.extracted) {
                const d = res.extracted;
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div class="ocr-verified-card">
                            <div style="color: var(--success); font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                                <span>✓</span> Identity Verified via Document Scanner (${d.id_type || 'National ID'})
                            </div>
                            <div style="font-size: 0.92rem; margin-bottom: 4px;">Name: <strong>${d.full_name}</strong> · ID: <strong>${d.id_number}</strong></div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Contact: ${d.phone || 'N/A'} · Email: ${d.email || 'N/A'}</div>
                            <button type="button" class="btn-luxury-primary" style="font-size: 0.8rem; padding: 7px 18px;" 
                                onclick="App.openBookingModal({
                                    name: '${d.full_name}',
                                    aadhaar: '${d.id_number}',
                                    phone: '${d.phone}',
                                    email: '${d.email}'
                                })">
                                Pre-fill Reservation With Verified Details →
                            </button>
                        </div>
                    `;
                }
                this.showToast("✓ Identity Document Authenticated Successfully", "success");
            }
        } catch (e) {
            if (statusEl) statusEl.innerHTML = '<div style="color: var(--danger); padding: 10px;">Document scanning service error.</div>';
        }
    }

    // --- Curated Experiences Modal ---
    bindExperienceModal() {
        const modal = document.getElementById('experienceModal');
        const closeBtn = document.getElementById('closeExperienceModal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => modal.classList.remove('active');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }

        const form = document.getElementById('experienceForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const title = document.getElementById('expCategory').value;
                const name = document.getElementById('expGuestName').value;
                const date = document.getElementById('expDate').value;
                const time = document.getElementById('expTime').value;
                const guests = document.getElementById('expGuests').value;

                modal.classList.remove('active');
                form.reset();
                this.showToast(`✦ Experience Requested: ${title} for ${name} (${guests} Guests on ${date} at ${time}). Our concierge team will confirm shortly.`, 'success');
            };
        }
    }

    openExperienceModal(title, category) {
        const modal = document.getElementById('experienceModal');
        if (!modal) return;
        document.getElementById('expModalTitle').innerText = `Reserve ${title}`;
        document.getElementById('expCategory').value = `${title} (${category})`;
        document.getElementById('expGuestName').value = this.currentUser ? this.currentUser.username : '';
        document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
        modal.classList.add('active');
    }

    // --- Official Voucher Modal ---
    bindVoucherModal() {
        const modal = document.getElementById('voucherModal');
        const closeBtn = document.getElementById('closeVoucherModal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => modal.classList.remove('active');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }
    }

    openVoucherModal(b) {
        const modal = document.getElementById('voucherModal');
        if (!modal || !b) return;

        const totalAmount = parseFloat(b.total_amount) || 0;
        const paidAmount = parseFloat(b.paid) || 0;
        const isPaid = (b.is_paid === true || b.is_paid === 1) || (paidAmount >= totalAmount && totalAmount > 0);

        document.getElementById('voucherBookingId').innerText = '#HG-2026-' + String(b.id).padStart(3, '0');
        document.getElementById('voucherGuestName').innerText = b.customer_name || 'Valued Guest';
        document.getElementById('voucherSuiteName').innerText = `${b.room_type} Room ${b.room_number ? '· Suite #' + b.room_number : ''}`;
        document.getElementById('voucherCheckIn').innerText = `${b.check_in} (from 2:00 PM)`;
        document.getElementById('voucherCheckOut').innerText = `${b.check_out} (until 11:00 AM)`;
        document.getElementById('voucherGuests').innerText = `${b.guests || 2} Guests`;
        document.getElementById('voucherPaymentMethod').innerText = isPaid ? 'Paid & Verified' : 'Balance Settlement Pending';
        document.getElementById('voucherTotalAmount').innerText = `₹${totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        document.getElementById('voucherPaidAmount').innerText = `₹${paidAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

        const statusBadge = document.getElementById('voucherStatusBadge');
        if (statusBadge) {
            statusBadge.className = isPaid ? 'status-badge-luxury paid' : 'status-badge-luxury due';
            statusBadge.innerText = isPaid ? 'CONFIRMED · PAID IN FULL' : 'RESERVATION CONFIRMED';
        }

        modal.classList.add('active');
    }

    // --- Toast Notification Utility ---
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `luxury-toast ${type}`;

        const icon = document.createElement('span');
        icon.style.cssText = 'font-size: 1.1rem; color: var(--accent);';
        icon.textContent = '✦';

        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(msgSpan);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    bindFeedback() {
        const form = document.getElementById('feedbackForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const name = document.getElementById('feedGuestName').value;
                const rating = parseInt(document.getElementById('feedRating').value);
                const comment = document.getElementById('feedComment').value;

                try {
                    const res = await API.submitFeedback({ guest_name: name, rating, comment });
                    if (res.success) {
                        const a = res.analysis;
                        const alertBadge = a.urgent_alert 
                            ? '🚨 Urgent Manager Flagged' 
                            : 'Sentiment: ' + a.sentiment;

                        this.showToast(`Thank you ${name}! Sentiment: ${a.sentiment} (Score: ${a.sentiment_score})`, 'success');
                        form.reset();
                        this.loadReviewsStream();
                    }
                } catch (err) {
                    this.showToast("Error submitting review.", "error");
                }
            };
        }
    }

    async loadReviewsStream() {
        const container = document.getElementById('recentReviewsStream');
        if (!container) return;

        try {
            const res = await API.getFeedback();
            if (res.success && res.feedback && res.feedback.length > 0) {
                container.innerHTML = res.feedback.slice(0, 6).map(f => {
                    const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
                    const sentClass = f.urgent_alert ? 'sentiment-urgent' : (f.sentiment === 'Positive' ? 'sentiment-positive' : 'sentiment-neutral');
                    const sentLabel = f.urgent_alert ? 'Alert Flagged' : (f.sentiment || 'Evaluated');

                    return `
                        <div class="review-post-card">
                            <div class="review-post-header">
                                <div>
                                    <strong style="color: var(--primary); font-size: 0.95rem;">${f.guest_name}</strong>
                                    <div style="color: #E2A03F; font-size: 0.9rem; margin-top: 2px;">${stars}</div>
                                </div>
                                <span class="review-sentiment-tag ${sentClass}">${sentLabel}</span>
                            </div>
                            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0;">"${f.comment}"</p>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) {
            console.error("Could not load reviews stream:", e);
        }
    }
}

// Instantiate globally
document.addEventListener('DOMContentLoaded', () => {
    window.App = new AppController();
    window.App.init();
});
