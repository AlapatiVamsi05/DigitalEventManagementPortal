const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { hasEventStarted } = require('../helpers');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { sendEventUpdateEmail, sendEventDeletionEmail } = require('../services/emailService');

// get all events
router.get('/all', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching events', error: err.message });
    }
});

// get approved events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({ isApproved: true });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching events', error: err.message });
    }
});

// creates new event (all authenticated users can create)
router.post('/', protect, async (req, res) => {
    try {
        // Organizers, admins, and owners get auto-approval
        // Regular users need admin approval (isApproved = false)
        const isApproved = req.user.role === 'admin' || req.user.role === 'owner' || req.user.role === 'organizer';

        const event = await Event.create({
            hostId: req.user._id,
            ...req.body,
            isApproved
        });
        res.status(201).json({
            message: `Event created successfully${!isApproved ? ' (Pending admin approval)' : ''}`,
            event
        });
    } catch (err) {
        res.status(500).json({ message: 'Error creating event', error: err.message });
    }
});

// events hosted by current user
router.get('/my', protect, async (req, res) => {
    try {
        const events = await Event.find({ hostId: req.user._id });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching events', error: err.message });
    }
});

// specific event details
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching event', error: err.message });
    }
});


// update event (host, admin, or owner)
router.put('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('participants.userId');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Only host, admin, or owner can update
        if (event.hostId.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' &&
            req.user.role !== 'owner') {
            return res.status(403).json({ message: 'You do not have permission to update this event' });
        }

        if (hasEventStarted(event))
            return res.status(400).json({ message: 'Event already started' });

        Object.assign(event, req.body);
        await event.save();

        // Send update emails to all participants
        const participants = event.participants.map(p => p.userId).filter(u => u);
        if (participants.length > 0) {
            await sendEventUpdateEmail(event, participants);
        }

        res.json({ message: 'Event updated', event });
    } catch (err) {
        res.status(500).json({ message: 'Error updating event', error: err.message });
    }
});

// delete event (host, admin, or owner)
router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('hostId', 'role').populate('participants.userId');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Admin cannot delete owner's events
        if (req.user.role === 'admin' && event.hostId.role === 'owner') {
            return res.status(403).json({ message: 'Admins cannot delete events created by owner' });
        }

        // Only host, admin (except owner's events), or owner can delete
        if (event.hostId._id.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' &&
            req.user.role !== 'owner') {
            return res.status(403).json({ message: 'You do not have permission to delete this event' });
        }

        // Send deletion emails to all participants
        const participants = event.participants.map(p => p.userId).filter(u => u);
        if (participants.length > 0) {
            await sendEventDeletionEmail(event, participants);
        }

        await event.deleteOne();
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting event', error: err.message });
    }
});

module.exports = router;
