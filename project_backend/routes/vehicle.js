const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

// @desc    Register a new vehicle
// @route   POST /api/vehicle
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            vehicleModel,
            vehicleNumber,
            vehicleType,
            fuelType,
            ratePerKm,
            seatingCapacity
        } = req.body;

        // Validation for Indian Vehicle Number (Standard & BH Series)
        // Standard: MH12AB1234
        // BH: 22BH1234A
        const cleanNumber = vehicleNumber.replace(/\s+/g, '').toUpperCase();
        const standardRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        const bhRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

        if (!standardRegex.test(cleanNumber) && !bhRegex.test(cleanNumber)) {
            return res.status(400).json({ 
                message: 'Invalid vehicle number format. Should be like MH12AB1234 or 22BH1234A' 
            });
        }

        const vehicleExists = await Vehicle.findOne({ vehicleNumber: cleanNumber });

        if (vehicleExists) {
            return res.status(400).json({ message: 'Vehicle already registered' });
        }

        const vehicle = await Vehicle.create({
            owner_id: req.user._id,
            vehicleModel,
            vehicleNumber: cleanNumber,
            vehicleType,
            fuelType,
            ratePerKm,
            seatingCapacity
        });

        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's vehicles
// @route   GET /api/vehicle/my-vehicles
// @access  Private
router.get('/my-vehicles', protect, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner_id: req.user._id });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicle/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Check ownership
        if (vehicle.owner_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await vehicle.deleteOne();
        res.json({ message: 'Vehicle removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
