const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    year: {
        type: Number
    }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    issuedBy: {
        type: String
    },
    proofUrl: {
        type: String
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, 'Username is required'],
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [50, 'Username cannot exceed 50 characters']
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'organizer', 'admin', 'owner'],
            message: 'Role must be either user, organizer, admin, or owner'
        },
        default: 'user'
    },
    skills: {
        type: [String],
        default: []
    },
    experience: {
        type: [experienceSchema],
        default: []
    },
    portfolioLinks: {
        type: [String],
        default: []
    },
    certifications: {
        type: [certificationSchema],
        default: []
    },
    verifiedBadge: {
        type: Boolean,
        default: false
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ verifiedBadge: 1 });

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
