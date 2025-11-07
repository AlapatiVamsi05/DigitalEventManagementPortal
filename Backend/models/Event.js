const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    allowed: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: {
            values: ['free', 'paid', 'pending'],
            message: 'Status must be either free, paid, or pending'
        },
        default: 'free'
    },
    ticketId: {
        type: String,
        required: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    attended: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const eventSchema = new mongoose.Schema({
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Host ID is required']
    },
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    location: {
        type: String,
        required: [true, 'Event location is required'],
        trim: true,
        maxlength: [300, 'Location cannot exceed 300 characters']
    },
    imageUrl: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    startDateTime: {
        type: Date,
        required: [true, 'Event start date and time is required']
    },
    endDateTime: {
        type: Date,
        required: [true, 'Event end date and time is required'],
        validate: {
            validator: function (value) {
                return value > this.startDateTime;
            },
            message: 'End date must be after start date'
        }
    },
    regStartDateTime: {
        type: Date,
        required: false,
        default: Date.now
    },
    regEndDateTime: {
        type: Date,
        required: [true, 'Registration end date and time is required'],
        validate: {
            validator: function (value) {
                return value > this.regStartDateTime && value <= this.startDateTime;
            },
            message: 'Registration end date must be after registration start and before event start'
        }
    },
    registrationDeadline: {
        type: Date,
        required: false
    },
    qr: {
        type: String,
        default: ''
    },
    otp: {
        type: String,
        length: 6
    },
    otpExpiresAt: {
        type: Date
    },
    participants: [participantSchema],
    isApproved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

eventSchema.index({ hostId: 1 });

eventSchema.index({ startDateTime: 1 });

eventSchema.index({ isApproved: -1 });

eventSchema.index({ 'participants.userId': 1 });

// Ensure same user can't register twice for the same event
// But can register for multiple different events
eventSchema.index({ _id: 1, 'participants.userId': 1 }, { unique: true, sparse: true });

eventSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = otp;
    this.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return otp;
};

eventSchema.methods.verifyOTP = function (inputOTP) {
    if (!this.otp || !this.otpExpiresAt) {
        return false;
    }
    if (new Date() > this.otpExpiresAt) {
        return false;
    }
    return this.otp === inputOTP;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
