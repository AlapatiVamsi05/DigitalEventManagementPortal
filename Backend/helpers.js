const { Event, Analytics, Feedback } = require('./models');


//create tickets
const generateTicketId = () => {
    const prefix = 'DEMPEV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${timestamp}${random}`;
};

// generates otp
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// calcs engagement metric
const updateEventAnalytics = async (eventId) => {
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        const totalRegistrations = event.participants.length;
        const totalCheckIns = event.participants.filter(p => p.attended).length;

        const feedbacks = await Feedback.find({ eventId });
        const totalFeedbacks = feedbacks.length;
        const averageRating = totalFeedbacks > 0
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
            : 0;

        const engagementScore = Analytics.calculateEngagement(
            totalRegistrations,
            totalCheckIns,
            totalFeedbacks,
            averageRating
        );

        const analytics = await Analytics.findOneAndUpdate(
            { eventId },
            {
                totalRegistrations,
                totalCheckIns,
                totalFeedbacks,
                averageRating: Math.round(averageRating * 100) / 100,
                engagementScore,
                generatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        return analytics;
    } catch (error) {
        console.error('Error updating analytics:', error);
        throw error;
    }
};


// check if user is already registered for an event
const isUserRegistered = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) return false;

    return event.participants.some(p => p.userId.toString() === userId.toString());
};

// validates registration
const isRegistrationOpen = (event) => {
    const now = new Date();
    return now >= event.regStartDateTime && now <= event.regEndDateTime;
};


// check if event started
const hasEventStarted = (event) => {
    return new Date() >= event.startDateTime;
};


// check if event ended
const hasEventEnded = (event) => {
    return new Date() >= event.endDateTime;
};

module.exports = {
    generateTicketId,
    generateOTP,
    updateEventAnalytics,
    isUserRegistered,
    isRegistrationOpen,
    hasEventStarted,
    hasEventEnded
};
