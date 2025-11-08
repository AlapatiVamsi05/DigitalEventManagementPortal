const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { sendEventApprovalEmail, sendEventRejectionEmail, sendRoleChangeEmail, sendEventDeletionEmail } = require('../services/emailService');

// Get all pending events (admin and owner only)
router.get('/events/pending', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const pendingEvents = await Event.find({ isApproved: false }).populate('hostId', 'username email role');
        res.json(pendingEvents);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending events', error: err.message });
    }
});

// Approve event (admin and owner only)
router.patch('/events/:id/approve', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('hostId');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.isApproved = true;
        await event.save();

        // Send approval email to host asynchronously
        if (event.hostId && event.hostId.email) {
            sendEventApprovalEmail(event.hostId, event).catch(err => console.error('Email error:', err));
        }

        res.json({ message: 'Event approved successfully', event });
    } catch (err) {
        res.status(500).json({ message: 'Error approving event', error: err.message });
    }
});

// Reject/Disapprove event (admin and owner only)
router.patch('/events/:id/reject', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('hostId');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.isApproved = false;
        await event.save();

        // Send rejection email to host asynchronously
        if (event.hostId && event.hostId.email) {
            sendEventRejectionEmail(event.hostId, event).catch(err => console.error('Email error:', err));
        }

        res.json({ message: 'Event rejected', event });
    } catch (err) {
        res.status(500).json({ message: 'Error rejecting event', error: err.message });
    }
});

// Get all users (admin and owner only)
router.get('/users', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Get specific user by ID (admin and owner only)
router.get('/users/:id', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
});

// Promote user to admin (admin and owner can do this)
router.patch('/users/:id/promote-admin', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'owner') {
            return res.status(400).json({ message: 'Cannot modify owner role' });
        }

        const oldRole = user.role;
        user.role = 'admin';
        await user.save();

        // Send role change email asynchronously
        if (oldRole !== 'admin') {
            sendRoleChangeEmail(user, 'admin', req.user.username).catch(err => console.error('Email error:', err));
        }

        res.json({ message: 'User promoted to admin successfully', user: user.toJSON() });
    } catch (err) {
        res.status(500).json({ message: 'Error promoting user', error: err.message });
    }
});

// Promote user to organizer (admin and owner only)
router.patch('/users/:id/promote-organizer', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'owner') {
            return res.status(400).json({ message: 'Cannot modify owner role' });
        }

        if (user.role === 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owner can modify admin role' });
        }

        const oldRole = user.role;
        user.role = 'organizer';
        await user.save();

        // Send role change email asynchronously
        if (oldRole !== 'organizer') {
            sendRoleChangeEmail(user, 'organizer', req.user.username).catch(err => console.error('Email error:', err));
        }

        res.json({ message: 'User promoted to organizer successfully', user: user.toJSON() });
    } catch (err) {
        res.status(500).json({ message: 'Error promoting user', error: err.message });
    }
});

// Demote user to regular user (admin can demote organizers and users, owner can demote anyone except owner)
router.patch('/users/:id/demote', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'owner') {
            return res.status(400).json({ message: 'Cannot demote owner' });
        }

        if (user.role === 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owner can demote admin' });
        }

        const oldRole = user.role;
        user.role = 'user';
        await user.save();

        // Send role change email asynchronously
        if (oldRole !== 'user') {
            sendRoleChangeEmail(user, 'user', req.user.username).catch(err => console.error('Email error:', err));
        }

        res.json({ message: 'User demoted to regular user successfully', user: user.toJSON() });
    } catch (err) {
        res.status(500).json({ message: 'Error demoting user', error: err.message });
    }
});

// Delete user (owner only)
router.delete('/users/:id', protect, authorizeRoles('owner'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'owner') {
            return res.status(400).json({ message: 'Cannot delete owner account' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
});

// Delete any event (admin and owner only, but admin cannot delete owner's events)
router.delete('/events/:id', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('hostId', 'role').populate('participants.userId');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Admin cannot delete owner's events
        if (req.user.role === 'admin' && event.hostId.role === 'owner') {
            return res.status(403).json({ message: 'Admins cannot delete events created by owner' });
        }

        // Send deletion emails to all participants asynchronously
        const participants = event.participants.map(p => p.userId).filter(u => u);
        if (participants.length > 0) {
            sendEventDeletionEmail(event, participants).catch(err => console.error('Email error:', err));
        }

        await event.deleteOne();
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting event', error: err.message });
    }
});

// Get all organizers (admin and owner only)
router.get('/organizers', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer' }).select('-password');
        res.json(organizers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching organizers', error: err.message });
    }
});

// Get all admins (admin and owner only)
router.get('/admins', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching admins', error: err.message });
    }
});

module.exports = router;
