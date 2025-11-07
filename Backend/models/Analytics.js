const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event ID is required'],
        unique: true
    },
    totalRegistrations: {
        type: Number,
        default: 0,
        min: [0, 'Total registrations cannot be negative']
    },
    totalCheckIns: {
        type: Number,
        default: 0,
        min: [0, 'Total check-ins cannot be negative']
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Average rating cannot be negative'],
        max: [5, 'Average rating cannot exceed 5']
    },
    engagementScore: {
        type: Number,
        default: 0,
        min: [0, 'Engagement score cannot be negative'],
        max: [100, 'Engagement score cannot exceed 100']
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

analyticsSchema.index({ eventId: 1 });

analyticsSchema.index({ engagementScore: -1 });

analyticsSchema.index({ generatedAt: -1 });

analyticsSchema.statics.calculateEngagement = function (totalRegistrations, totalCheckIns, totalFeedbacks, averageRating) {
    if (totalRegistrations === 0) return 0;

    const attendanceRatio = totalCheckIns / totalRegistrations;
    const feedbackRatio = totalFeedbacks / totalRegistrations;
    const ratingRatio = averageRating / 5;

    const engagement = (attendanceRatio * 0.5 + feedbackRatio * 0.3 + ratingRatio * 0.2) * 100;
    return Math.round(engagement * 100) / 100;
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
