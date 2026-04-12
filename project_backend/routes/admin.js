const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const RideRequest = require('../models/RideRequest');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRides = await Ride.countDocuments();
        
        const payments = await Payment.find({ status: 'completed' });
        const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
        
        const activeRequests = await RideRequest.countDocuments({ status: 'pending' });
        
        // Recent Activity (last 5 entries)
        const recentRides = await Ride.find().sort({ createdAt: -1 }).limit(5);
        const recentRequests = await RideRequest.find().sort({ createdAt: -1 }).limit(5);
        
        const recentActivity = [
            ...recentRides.map(r => ({
                id: r._id,
                type: 'ride',
                action: 'New ride created',
                route: `${r.source} to ${r.destination}`,
                time: r.createdAt
            })),
            ...recentRequests.map(r => ({
                id: r._id,
                type: 'request',
                action: 'New ride request received',
                route: 'System wide request',
                time: r.createdAt
            }))
        ].sort((a, b) => b.time - a.time).slice(0, 5);

        res.json({
            stats: [
                { label: 'Total Rides', value: totalRides, icon: 'Car', color: 'bg-blue-500' },
                { label: 'Total Users', value: totalUsers, icon: 'Users', color: 'bg-green-500' },
                { label: 'Active Requests', value: activeRequests, icon: 'Users', color: 'bg-yellow-500' },
                { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: 'TrendingUp', color: 'bg-emerald-500' },
            ],
            recentActivity
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
        const UserStats = require('../models/UserStats');
        const Ride = require('../models/Ride');
        const RideRequest = require('../models/RideRequest');

        const usersWithStats = await Promise.all(users.map(async (user) => {
            const stats = await UserStats.findOne({ user_id: user._id });
            const ridesCreated = await Ride.countDocuments({ creator_id: user._id });
            const ridesJoined = await RideRequest.countDocuments({ passengerId: user._id, status: 'approved' });
            
            return {
                ...user,
                rating: stats?.averageRating || 0,
                totalRides: ridesCreated + ridesJoined
            };
        }));

        res.json(usersWithStats);
    } catch (error) {
        console.error('Admin Fetch Users Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all rides
// @route   GET /api/admin/rides
// @access  Private/Admin
router.get('/rides', protect, admin, async (req, res) => {
    try {
        const rides = await Ride.find().populate('creator_id', 'fullName rating').populate('vehicle_id', 'vehicleModel vehicleNumber vehicleType').sort({ createdAt: -1 });
        res.json(rides);
    } catch (error) {
        console.error('Admin Fetch Rides Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
