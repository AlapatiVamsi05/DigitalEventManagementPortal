import api from './api';

export const eventService = {
    async getAllEvents() {
        const response = await api.get('/events');
        return response.data;
    },

    async getAllEventsIncludingUnapproved() {
        const response = await api.get('/events/all');
        return response.data;
    },

    async getEventById(id) {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    async getMyEvents() {
        const response = await api.get('/events/my');
        return response.data;
    },

    async createEvent(eventData) {
        const response = await api.post('/events', eventData);
        return response.data;
    },

    async updateEvent(id, eventData) {
        const response = await api.put(`/events/${id}`, eventData);
        return response.data;
    },

    async deleteEvent(id) {
        const response = await api.delete(`/events/${id}`);
        return response.data;
    },

    async registerForEvent(eventId) {
        const response = await api.post(`/registration/${eventId}/register`);
        return response.data;
    },

    async generateOTP(eventId) {
        const response = await api.post(`/registration/${eventId}/otp`);
        return response.data;
    },

    async checkIn(eventId, otp) {
        const response = await api.post(`/registration/${eventId}/checkin`, { otp });
        return response.data;
    },

    async submitFeedback(eventId, rating, comment) {
        const response = await api.post(`/feedback/${eventId}/feedback`, { rating, comment });
        return response.data;
    },

    async getFeedbacks(eventId) {
        const response = await api.get(`/feedback/${eventId}/feedback`);
        return response.data;
    },

    async getAnalytics(eventId) {
        const response = await api.get(`/analytics/${eventId}/analytics`);
        return response.data;
    },
};
