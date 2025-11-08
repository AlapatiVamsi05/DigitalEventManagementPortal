const mongoose = require('mongoose');
const { table } = require('node:console');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Message content is required'],
        minlength: [10, 'Message must be at least 10 characters'],
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    type: {
        type: String,
        enum: ['general', 'account_deletion_request'],
        default: 'general'
    },
    requestType: {
        type: String,
        enum: ['register_decline', 'login_decline', null],
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

messageSchema.index({ submittedAt: -1 });

messageSchema.index({ userId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
