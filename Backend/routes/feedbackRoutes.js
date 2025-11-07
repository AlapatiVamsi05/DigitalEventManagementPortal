const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const { updateEventAnalytics, hasEventEnded } = require('../helpers');
const { protect } = require('../middleware/authMiddleware');

// submits feedback for an event
router.post('/:id/feedback', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user._id;
        const eventId = req.params.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (!hasEventEnded(event))
            return res.status(400).json({ message: 'Event not finished yet' });

        // Check if user is registered for this event
        const isRegistered = event.participants.some(
            participant => participant.userId.toString() === userId.toString()
        );

        if (!isRegistered) {
            return res.status(403).json({ message: 'Only registered participants can submit feedback' });
        }

        // Check if user already submitted feedback
        const existingFeedback = await Feedback.findOne({ userId, eventId });
        if (existingFeedback) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event' });
        }

        await Feedback.create({ userId, eventId, rating, comment });
        await updateEventAnalytics(eventId);

        res.json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Error submitting feedback', error: err.message });
    }
});

// get all feedbacks that are submitteed for an event.
router.get('/:id/feedback', async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ eventId: req.params.id });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
    }
});

module.exports = router;
