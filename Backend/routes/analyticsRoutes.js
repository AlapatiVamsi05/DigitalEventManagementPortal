const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Event = require('../models/Event');
const { updateEventAnalytics } = require('../helpers');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');


router.get('/:id/analytics', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Allow access to: event host, admin, or owner
        const isHost = event.hostId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        const isOwner = req.user.role === 'owner';

        if (!isHost && !isAdmin && !isOwner) {
            return res.status(403).json({ message: 'You do not have permission to view analytics for this event' });
        }

        const analytics = await Analytics.findOne({ eventId: req.params.id });
        if (!analytics) return res.status(404).json({ message: 'No analytics found' });
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching analytics', error: err.message });
    }
});

// updates an event analytics
router.post('/:id/analytics/update', protect, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const analytics = await updateEventAnalytics(req.params.id);
        res.json({ message: 'Analytics updated', analytics });
    } catch (error) {
        res.status(500).json({ message: 'Error updating analytics', error: error.message });
    }
});

module.exports = router;
