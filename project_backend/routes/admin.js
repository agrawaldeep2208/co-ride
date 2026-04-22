const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const RideRequest = require('../models/RideRequest');
const Notification = require('../models/Notification');

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
        const pendingVerifications = await User.countDocuments({ licenseStatus: 'pending' });
        
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
                { label: 'Pending Verifications', value: pendingVerifications, icon: 'ShieldCheck', color: 'bg-orange-500' },
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

// @desc    Get all pending license verifications
// @route   GET /api/admin/pending-verifications
// @access  Private/Admin
router.get('/pending-verifications', protect, admin, async (req, res) => {
    try {
        const users = await User.find({ licenseStatus: 'pending' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Admin Fetch Pending Verifications Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Verify or reject a user license
// @route   PATCH /api/admin/verify-license/:userId
// @access  Private/Admin
router.patch('/verify-license/:userId', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be verified or rejected.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { licenseStatus: status },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send notification to user
        const type = status === 'verified' ? 'approval' : 'rejection';
        const title = status === 'verified' ? 'License Verified! ✅' : 'License Rejected ❌';
        const message = status === 'verified' 
            ? 'Your driving license has been verified. You can now create rides!' 
            : 'Your driving license verification was rejected. Please check your document and try again.';

        await Notification.create({
            userId: user._id,
            type,
            title,
            message
        });

        res.json({ message: `User license ${status} successfully`, user });
    } catch (error) {
        console.error('Admin Verify License Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Platform Analytics for Admin Dashboard
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, admin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Global Daily Transaction Volume
        const dailyStats = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    completedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }
                    },
                    earnings: { $sum: "$amount" }, // Total volume processed
                    spending: { $sum: "$amount" }  // Matching for UI consistency
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        // 2. Global Payment Method Distribution
        const methodStats = await Payment.aggregate([
            {
                $match: {
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
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Location-Based Revenue Stats
        const locationStats = await Payment.aggregate([
            {
                $match: {
                    status: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'rides',
                    localField: 'rideId',
                    foreignField: '_id',
                    as: 'rideDetails'
                }
            },
            { $unwind: "$rideDetails" },
            {
                $group: {
                    _id: "$rideDetails.source",
                    revenue: { $sum: "$amount" }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        const chartData = dailyStats.map(stat => ({
            date: stat._id.date,
            earnings: stat.earnings,
            spending: stat.spending
        }));

        const pieData = methodStats.map(stat => ({
            name: stat._id,
            value: stat.count
        }));

        const locationData = locationStats.map(stat => {
            const parts = stat._id.split(',').map(p => p.trim());
            // Heuristic: If we have many parts, usually it's Area, City, State.
            // If we have 2 parts, it's City, State.
            let displayName = stat._id;
            if (parts.length >= 2) {
                // Focus on City (second to last or first)
                displayName = parts.length > 2 ? parts[parts.length - 2] : parts[0];
            }
            
            return {
                location: displayName,
                revenue: stat.revenue
            };
        });

        res.json({
            chartData,
            pieData,
            locationData
        });
    } catch (error) {
        console.error('Admin Analytics Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
