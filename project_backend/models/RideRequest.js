const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true,
    },
    passengerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    seatsRequested: {
        type: Number,
        required: true,
        min: 1,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'joined'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('RideRequest', rideRequestSchema);
