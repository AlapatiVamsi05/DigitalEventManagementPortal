import api from './api';

export const authService = {
    async login(identifier, password) {
        try {
            const response = await api.post('/auth/login', { identifier, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            // Explicitly rethrow so Login page can toast the error
            throw error.response?.data || error;
        }
    },


    async register(username, email, password) {
        const response = await api.post('/auth/register', { username, email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async getProfile() {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    async updateProfile(profileData) {
        const response = await api.put('/auth/profile', profileData);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async updatePassword(passwordData) {
        const response = await api.put('/auth/password', passwordData);
        return response.data;
    },
};
