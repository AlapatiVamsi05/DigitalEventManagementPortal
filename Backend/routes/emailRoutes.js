const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { sendBulkEventReminders } = require('../services/emailService');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Handle registration decline
router.get('/decline-registration', async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, action, timestamp] = decoded.split(':');

        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 24 * 60 * 60 * 1000) {
            return res.status(400).send('<h1>Link expired</h1><p>This confirmation link has expired. Please contact support if you still need assistance.</p>');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('<h1>User not found</h1>');
        }

        // Create deletion request message
        await Message.create({
            userId: user._id,
            message: `User ${user.username} (${user.email}) has requested account deletion via registration email confirmation. They indicated they did not create this account.`,
            type: 'account_deletion_request',
            requestType: 'register_decline',
            status: 'pending'
        });

        res.send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4CAF50;">Request Submitted</h2>
        <p>Your account deletion request has been submitted to the administrators.</p>
        <p>An admin or owner will review your request and take appropriate action.</p>
        <p>You will receive a confirmation email once your account has been processed.</p>
      </div>
    `);
    } catch (error) {
        console.error('Error handling registration decline:', error);
        res.status(500).send('<h1>Error</h1><p>An error occurred processing your request.</p>');
    }
});

// Handle login decline
router.get('/decline-login', async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, action, timestamp] = decoded.split(':');

        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 24 * 60 * 60 * 1000) {
            return res.status(400).send('<h1>Link expired</h1><p>This confirmation link has expired. Please contact support if you still need assistance.</p>');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('<h1>User not found</h1>');
        }

        // Create deletion request message
        await Message.create({
            userId: user._id,
            message: `User ${user.username} (${user.email}) has reported unauthorized login activity and requested account deletion for security reasons. Login detected at ${new Date().toLocaleString()}.`,
            type: 'account_deletion_request',
            requestType: 'login_decline',
            status: 'pending'
        });

        res.send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #f44336;">Security Request Submitted</h2>
        <p>Your security concern has been reported and your account deletion request has been submitted to the administrators.</p>
        <p>An admin or owner will review your request immediately and take appropriate action.</p>
        <p>For immediate assistance, please contact our support team.</p>
      </div>
    `);
    } catch (error) {
        console.error('Error handling login decline:', error);
        res.status(500).send('<h1>Error</h1><p>An error occurred processing your request.</p>');
    }
});

// Send event reminders manually (admin/owner only)
router.post('/send-reminders', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { hours } = req.body;

        if (!hours || !Array.isArray(hours)) {
            return res.status(400).json({ message: 'Please provide an array of hours' });
        }

        const results = {};

        for (const hour of hours) {
            const emailsSent = await sendBulkEventReminders(hour);
            results[hour] = emailsSent;
        }

        res.json({
            message: 'Reminder emails sent successfully',
            results
        });
    } catch (error) {
        res.status(500).json({ message: 'Error sending reminders', error: error.message });
    }
});

module.exports = router;
