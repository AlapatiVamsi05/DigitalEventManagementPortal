import api from './api';

export const adminService = {
    async getPendingEvents() {
        const response = await api.get('/admin/events/pending');
        return response.data;
    },

    async approveEvent(eventId) {
        const response = await api.patch(`/admin/events/${eventId}/approve`);
        return response.data;
    },

    async rejectEvent(eventId) {
        const response = await api.patch(`/admin/events/${eventId}/reject`);
        return response.data;
    },

    async getAllUsers() {
        const response = await api.get('/admin/users');
        return response.data;
    },

    async getUserById(userId) {
        const response = await api.get(`/admin/users/${userId}`);
        return response.data;
    },

    async promoteToAdmin(userId) {
        const response = await api.patch(`/admin/users/${userId}/promote-admin`);
        return response.data;
    },

    async promoteToOrganizer(userId) {
        const response = await api.patch(`/admin/users/${userId}/promote-organizer`);
        return response.data;
    },

    async demoteUser(userId) {
        const response = await api.patch(`/admin/users/${userId}/demote`);
        return response.data;
    },

    async deleteUser(userId) {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },

    async deleteEvent(eventId) {
        const response = await api.delete(`/admin/events/${eventId}`);
        return response.data;
    },

    async getOrganizers() {
        const response = await api.get('/admin/organizers');
        return response.data;
    },

    async getAdmins() {
        const response = await api.get('/admin/admins');
        return response.data;
    },

    async getAllMessages() {
        const response = await api.get('/messages');
        return response.data;
    },

    async getDeletionRequests() {
        const response = await api.get('/messages/deletion-requests');
        return response.data;
    },

    async executeDeletionRequest(messageId) {
        const response = await api.delete(`/messages/deletion-request/${messageId}/execute`);
        return response.data;
    },

    async dismissDeletionRequest(messageId) {
        const response = await api.patch(`/messages/deletion-request/${messageId}/dismiss`);
        return response.data;
    },

    async deleteMessage(messageId) {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    },

    async sendEventReminders(hours) {
        const response = await api.post('/email/send-reminders', { hours });
        return response.data;
    },
};
