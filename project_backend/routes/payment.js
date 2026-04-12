const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const UserStats = require('../models/UserStats');
const crypto = require('crypto');

// @desc    Get payments for a ride
// @route   GET /api/payment/ride/:rideId
// @access  Private
router.get('/ride/:rideId', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ rideId: req.params.rideId });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Complete a payment
// @route   PUT /api/payment/:id/pay
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        if (payment.passengerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to pay for this' });
        }

        if (payment.status === 'completed') {
            return res.status(400).json({ message: 'Payment already completed' });
        }

        // Simulate payment gateway success
        payment.status = 'completed';
        payment.paymentMethod = req.body.paymentMethod || 'Simulated Wallet';
        payment.transactionId = 'TXN_' + crypto.randomBytes(8).toString('hex').toUpperCase();
        payment.completedAt = Date.now();
        await payment.save();

        // Update Passenger Stats
        await UserStats.findOneAndUpdate(
            { user_id: payment.passengerId },
            { $inc: { totalPaymentsMade: payment.amount } },
            { upsert: true }
        );

        // Update Driver Stats
        await UserStats.findOneAndUpdate(
            { user_id: payment.driverId },
            { $inc: { totalPaymentsReceived: payment.amount } },
            { upsert: true }
        );

        res.json({ message: 'Payment successful', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
