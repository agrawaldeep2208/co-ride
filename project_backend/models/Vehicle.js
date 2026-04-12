const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vehicleModel: {
        type: String,
        required: true,
    },
    vehicleNumber: {
        type: String,
        required: true,
        unique: true,
    },
    vehicleType: {
        type: String,
        enum: ['Bike', 'Hatchback', 'Sedan', 'SUV'],
        required: true,
    },
    fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel', 'CNG', 'EV'],
        required: true,
    },
    ratePerKm: {
        type: Number,
        required: true,
    },
    seatingCapacity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
