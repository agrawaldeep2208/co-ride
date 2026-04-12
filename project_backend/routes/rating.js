const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Rating = require('../models/Rating');
const UserStats = require('../models/UserStats');
const Ride = require('../models/Ride');

// @desc    Submit a rating
// @route   POST /api/rating
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { toUserId, rideId, rating, feedback } = req.body;
        const fromUserId = req.user._id;

        // Validation
        if (!toUserId || !rideId || !rating) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if ride exists and is completed
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        if (ride.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate participants of completed rides' });
        }

        // Prevent self-rating
        if (toUserId.toString() === fromUserId.toString()) {
            return res.status(400).json({ message: 'You cannot rate yourself' });
        }

        // Create rating
        const newRating = await Rating.create({
            fromUserId,
            toUserId,
            rideId,
            rating,
            feedback
        });

        // Update UserStats for the recipient
        let stats = await UserStats.findOne({ user_id: toUserId });
        if (!stats) {
            stats = new UserStats({ user_id: toUserId });
        }

        const totalRatings = stats.totalRatings || 0;
        const currentAvg = stats.averageRating || 0;
        
        stats.averageRating = ((currentAvg * totalRatings) + Number(rating)) / (totalRatings + 1);
        stats.totalRatings = totalRatings + 1;
        stats.updatedAt = Date.now();

        await stats.save();

        res.status(201).json(newRating);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already rated this participant for this ride' });
        }
        console.error('Rating error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get ratings given by current user for a ride
// @route   GET /api/rating/ride/:rideId
// @access  Private
router.get('/ride/:rideId', protect, async (req, res) => {
    try {
        const ratings = await Rating.find({
            rideId: req.params.rideId,
            fromUserId: req.user._id
        });
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
