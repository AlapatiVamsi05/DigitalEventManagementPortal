const Log = require('../models/Log');

/**
 * Creates a new log entry
 * @param {string} adminId - The ID of the admin performing the action
 * @param {string} message - Description of the action
 * @param {string} type - Type of action (event_approval, event_deletion, etc.)
 * @param {string} typeId - ID of the entity the action was performed on
 * @returns {Promise<Object>} The created log entry
 */
const createLog = async (adminId, message, type, typeId) => {
    try {
        const log = await Log.create({
            adminId,
            message,
            type,
            typeId
        });
        return log;
    } catch (error) {
        console.error('Error creating log entry:', error);
        throw error;
    }
};

/**
 * Gets logs with optional filtering
 * @param {Object} filters - Filter options
 * @param {string} filters.type - Filter by log type
 * @param {string} filters.adminId - Filter by admin ID
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of logs per page
 * @returns {Promise<Object>} Logs and pagination info
 */
const getLogs = async (filters = {}, page = 1, limit = 20) => {
    try {
        const query = {};

        if (filters.type) query.type = filters.type;
        if (filters.adminId) query.adminId = filters.adminId;

        // Use a more defensive approach to population
        let logs;
        try {
            logs = await Log.find(query)
                .populate({
                    path: 'adminId',
                    select: 'username email role',
                    options: { strictPopulate: false }
                })
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);
        } catch (populateError) {
            // If population fails, fetch logs without population
            console.warn('Population failed, fetching logs without user details:', populateError.message);
            logs = await Log.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);
        }

        const total = await Log.countDocuments(query);

        return {
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        };
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
};

/**
 * Gets log statistics
 * @returns {Promise<Object>} Statistics about log entries
 */
const getLogStats = async () => {
    try {
        const stats = await Log.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return stats;
    } catch (error) {
        console.error('Error fetching log statistics:', error);
        throw error;
    }
};

module.exports = {
    createLog,
    getLogs,
    getLogStats
};