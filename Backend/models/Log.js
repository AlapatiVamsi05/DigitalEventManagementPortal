const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Admin ID is required']
    },
    message: {
        type: String,
        required: [true, 'Log message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    type: {
        type: String,
        enum: {
            values: ['event_approval', 'event_deletion', 'user_to_organizer_approval', 'user_to_admin_approval', 'other'],
            message: 'Invalid log type'
        },
        required: [true, 'Log type is required']
    },
    typeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Enable timestamps to automatically add createdAt and updatedAt
});

logSchema.index({ adminId: 1 });

logSchema.index({ type: 1 });

logSchema.index({ adminId: 1, type: 1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;