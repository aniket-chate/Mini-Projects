/**
 * Hotel Grand AI Platform - Central API Client
 */
const API_BASE = window.location.origin;

const API = {
    // Authentication & Access Control
    async login(username, password) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await res.json();
    },

    async signup(username, password, role = 'guest', passcode = null) {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, passcode })
        });
        return await res.json();
    },

    async getMe(token) {
        const res = await fetch(`${API_BASE}/api/auth/me?token=${encodeURIComponent(token)}`);
        return await res.json();
    },

    async getUsers() {
        const res = await fetch(`${API_BASE}/api/auth/users`);
        return await res.json();
    },

    // Rooms
    async getRooms() {
        const res = await fetch(`${API_BASE}/api/rooms`);
        return await res.json();
    },

    async getRoomTypes() {
        const res = await fetch(`${API_BASE}/api/rooms/types`);
        return await res.json();
    },

    async checkAvailability(roomType, checkIn, checkOut) {
        const params = new URLSearchParams({
            room_type: roomType,
            check_in: checkIn,
            check_out: checkOut
        });
        const res = await fetch(`${API_BASE}/api/rooms/availability?${params}`);
        return await res.json();
    },

    // Bookings
    async createBooking(bookingData) {
        const res = await fetch(`${API_BASE}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        return await res.json();
    },

    async getBookings() {
        const res = await fetch(`${API_BASE}/api/bookings`);
        return await res.json();
    },

    async getMyBookings(username) {
        const res = await fetch(`${API_BASE}/api/bookings/my?username=${encodeURIComponent(username)}`);
        return await res.json();
    },

    async searchBookings(query) {
        const res = await fetch(`${API_BASE}/api/bookings/search?q=${encodeURIComponent(query)}`);
        return await res.json();
    },

    async deleteBooking(bookingId) {
        const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    // Payments
    async recordPayment(paymentData) {
        const res = await fetch(`${API_BASE}/api/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        return await res.json();
    },

    // Telemetry & Reports
    async getTelemetry() {
        const res = await fetch(`${API_BASE}/api/reports/telemetry`);
        return await res.json();
    },

    // AI Services
    async chatWithConcierge(message, history = [], role = 'guest', username = null) {
        const res = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, role, username })
        });
        return await res.json();
    },

    async scanIdDocument(text = "", file = null) {
        const formData = new FormData();
        if (text) formData.append('document_text', text);
        if (file) formData.append('file', file);

        const res = await fetch(`${API_BASE}/api/ai/scan-id`, {
            method: 'POST',
            body: formData
        });
        return await res.json();
    },

    async submitFeedback(feedbackData) {
        const res = await fetch(`${API_BASE}/api/ai/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        return await res.json();
    },

    async getFeedback() {
        const res = await fetch(`${API_BASE}/api/ai/feedback`);
        return await res.json();
    }
};

window.API = API;
