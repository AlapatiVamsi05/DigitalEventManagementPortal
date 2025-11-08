const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { generateTicketId, generateOTP, updateEventAnalytics, isUserRegistered, isRegistrationOpen } = require('../helpers');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { sendEventRegistrationEmail } = require('../services/emailService');

// register an user for an event
router.post('/:id/register', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (!isRegistrationOpen(event))
            return res.status(400).json({ message: 'Registration closed' });

        if (await isUserRegistered(req.params.id, userId))
            return res.status(400).json({ message: 'Already registered' });

        const ticketId = generateTicketId();
        event.participants.push({ userId, ticketId });
        await event.save();
        await updateEventAnalytics(event._id);

        // Get user details and send confirmation email asynchronously
        const user = await User.findById(userId);
        if (user) {
            sendEventRegistrationEmail(user, event, ticketId).catch(err => console.error('Email error:', err));
        }

        res.json({ message: 'Registered successfully', ticketId });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Error registering for event', error: err.message });
    }
});

// generate otp (only host, admin, or owner)
router.post('/:id/otp', protect, authorizeRoles('organizer', 'admin', 'owner'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Only host, admin, or owner can generate OTP
        if (event.hostId.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' &&
            req.user.role !== 'owner') {
            return res.status(403).json({ message: 'You do not have permission to generate OTP for this event' });
        }

        const otp = generateOTP();
        event.otp = otp;
        event.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await event.save();

        res.json({ message: 'OTP generated successfully', otp });
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Error generating OTP', error: err.message });
    }
});

// mark attendance
router.post('/:id/checkin', protect, async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user._id;
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (new Date() > event.otpExpiresAt)
            return res.status(400).json({ message: 'OTP expired' });
        if (event.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        const participant = event.participants.find(p => p.userId.toString() === userId.toString());
        if (!participant)
            return res.status(400).json({ message: 'User not registered for event' });

        participant.attended = true;
        await event.save();
        await updateEventAnalytics(event._id);

        res.json({ message: 'Attendance marked successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error marking attendance', error: err.message });
    }
});

module.exports = router;
