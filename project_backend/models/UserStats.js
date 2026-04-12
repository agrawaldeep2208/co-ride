const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    totalRidesCreated: {
        type: Number,
        default: 0,
    },
    totalRidesJoined: {
        type: Number,
        default: 0,
    },
    totalPaymentsMade: {
        type: Number,
        default: 0,
    },
    totalPaymentsReceived: {
        type: Number,
        default: 0,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('UserStats', userStatsSchema);
