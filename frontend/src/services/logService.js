import api from './api';

export const logService = {
    /**
     * Get admin logs with optional filtering
     * @param {Object} params - Filter parameters
     * @param {string} params.type - Filter by log type
     * @param {string} params.adminId - Filter by admin ID
     * @param {number} params.page - Page number
     * @param {number} params.limit - Number of logs per page
     * @returns {Promise<Object>} Logs and pagination info
     */
    async getLogs(params = {}) {
        const response = await api.get('/admin/logs', { params });
        return response.data;
    },

    /**
     * Get log statistics
     * @returns {Promise<Array>} Log statistics
     */
    async getLogStats() {
        const response = await api.get('/admin/logs/stats');
        return response.data;
    }
};