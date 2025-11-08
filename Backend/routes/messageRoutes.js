const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get all messages (admin/owner only)
router.get('/', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('userId', 'username email role')
            .sort({ submittedAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// Get deletion requests only (admin/owner only)
router.get('/deletion-requests', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const requests = await Message.find({
            type: 'account_deletion_request',
            status: 'pending'
        })
            .populate('userId', 'username email role')
            .sort({ submittedAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching deletion requests', error: error.message });
    }
});

// Delete user account from deletion request (admin/owner only)
router.delete('/deletion-request/:messageId/execute', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId).populate('userId');

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.type !== 'account_deletion_request') {
            return res.status(400).json({ message: 'This is not a deletion request' });
        }

        const user = message.userId;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check permissions
        if (user.role === 'owner') {
            return res.status(403).json({ message: 'Cannot delete owner account' });
        }

        if (user.role === 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owner can delete admin accounts' });
        }

        // Delete the user
        await User.findByIdAndDelete(user._id);

        // Mark message as resolved
        message.status = 'resolved';
        await message.save();

        res.json({
            message: 'User account deleted successfully',
            deletedUser: {
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user account', error: error.message });
    }
});

// Dismiss/reject deletion request (admin/owner only)
router.patch('/deletion-request/:messageId/dismiss', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        message.status = 'resolved';
        await message.save();

        res.json({ message: 'Deletion request dismissed' });
    } catch (error) {
        res.status(500).json({ message: 'Error dismissing request', error: error.message });
    }
});

// Delete a message (admin/owner only)
router.delete('/:id', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
});

module.exports = router;
