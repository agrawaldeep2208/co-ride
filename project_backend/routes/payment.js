const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const UserStats = require('../models/UserStats');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// @desc    Get Razorpay Config
// @route   GET /api/payment/config
// @access  Private
router.get('/config', protect, (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
    try {
        const { paymentId } = req.body;
        const paymentRecord = await Payment.findById(paymentId);

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const options = {
            amount: Math.round(paymentRecord.amount * 100), // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${paymentId}`,
        };

        const order = await razorpay.orders.create(options);
        
        // Optionally store the razorpay order_id in the payment record
        // paymentRecord.transactionId = order.id; // Not yet verified, but useful for mapping
        // await paymentRecord.save();

        res.json(order);
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
    try {
        const { 
            paymentId, 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature 
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Signature valid, complete the payment
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        payment.status = 'completed';
        payment.paymentMethod = 'UPI (Razorpay)';
        payment.transactionId = razorpay_payment_id;
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

        res.json({ message: 'Payment verified and completed successfully', payment });
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ message: error.message });
    }
});

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

// @desc    Complete a payment (Simulated/Fallback)
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

        if (payment.status === 'completed' || payment.status === 'pending_confirmation') {
            return res.status(400).json({ message: 'Payment already processed or pending confirmation' });
        }

        const { paymentMethod } = req.body;

        if (paymentMethod === 'Cash') {
            payment.status = 'pending_confirmation';
            payment.paymentMethod = 'Cash';
            await payment.save();
            return res.json({ message: 'Cash payment initiated. Waiting for driver confirmation.', payment });
        }

        // Simulate immediate success for other simulated methods (if any left)
        payment.status = 'completed';
        payment.paymentMethod = paymentMethod || 'Simulated Wallet';
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

// @desc    Confirm Cash Payment (Driver Only)
// @route   PUT /api/payment/:id/confirm-cash
// @access  Private
router.put('/:id/confirm-cash', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // Only the driver designated for this payment can confirm it
        if (payment.driverId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only the driver can confirm cash payments' });
        }

        if (payment.status !== 'pending_confirmation') {
            return res.status(400).json({ message: 'Payment is not awaiting confirmation' });
        }

        payment.status = 'completed';
        payment.completedAt = Date.now();
        payment.transactionId = 'CASH_' + crypto.randomBytes(4).toString('hex').toUpperCase();
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

        res.json({ message: 'Cash payment confirmed successfully', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get User Payment Analytics for Dashboard
// @route   GET /api/payment/analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Daily Earnings and Spending
        const dailyStats = await Payment.aggregate([
            {
                $match: {
                    $or: [{ driverId: userId }, { passengerId: userId }],
                    status: 'completed',
                    completedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }
                    },
                    earnings: {
                        $sum: {
                            $cond: [{ $eq: ["$driverId", userId] }, "$amount", 0]
                        }
                    },
                    spending: {
                        $sum: {
                            $cond: [{ $eq: ["$passengerId", userId] }, "$amount", 0]
                        }
                    }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        // 2. Payment Method Distribution
        const methodStats = await Payment.aggregate([
            {
                $match: {
                    driverId: userId,
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $regexMatch: { input: "$paymentMethod", regex: /UPI/i } },
                            "UPI",
                            { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "Cash", "Other"] }
                        ]
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        // Format data for Recharts
        const chartData = dailyStats.map(stat => ({
            date: stat._id.date,
            earnings: stat.earnings,
            spending: stat.spending
        }));

        const pieData = methodStats.map(stat => ({
            name: stat._id,
            value: stat.count
        }));

        res.json({
            chartData,
            pieData
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
