const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Ride = require('../models/Ride');
const RideRequest = require('../models/RideRequest');
const UserStats = require('../models/UserStats');
const { protect } = require('../middleware/auth');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/licenses');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use userid as filename
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${req.user._id}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only (.jpg, .jpeg, .png)!'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

// @desc    Upload driving license
// @route   POST /api/user/upload-license
// @access  Private
router.post('/upload-license', protect, (req, res, next) => {
    upload.single('licenseImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err.message });
        }
        // Everything went fine.
        next();
    });
}, async (req, res) => {
    try {
        const { drivingLicenseNumber } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        if (!drivingLicenseNumber) {
            return res.status(400).json({ message: 'Please provide driving license number' });
        }

        const relativePath = `uploads/licenses/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                drivingLicenseNumber,
                drivingLicenseImage: relativePath,
                licenseStatus: 'pending'
            },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user dashboard stats
// @route   GET /api/user/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('Fetching stats for user:', userId);

        // Rides Created
        const ridesCreated = await Ride.countDocuments({ creator_id: userId });
        console.log('Rides Created:', ridesCreated);

        // Rides Joined (Approved Requests)
        const ridesJoined = await RideRequest.countDocuments({ 
            passengerId: userId, 
            status: 'approved' 
        });
        console.log('Rides Joined:', ridesJoined);

        // Requests Received (Incoming Pending)
        const userRides = await Ride.find({ creator_id: userId }).select('_id');
        const userRideIds = userRides.map(r => r._id);
        const requestsReceived = await RideRequest.countDocuments({ 
            rideId: { $in: userRideIds }, 
            status: 'pending' 
        });
        console.log('Requests Received:', requestsReceived);

        // Requests Sent (Outgoing Pending)
        const requestsSent = await RideRequest.countDocuments({ 
            passengerId: userId, 
            status: 'pending' 
        });
        console.log('Requests Sent:', requestsSent);

        // Rating
        const stats = await UserStats.findOne({ user_id: userId });
        const rating = stats ? stats.averageRating : 0;
        console.log('Rating:', rating);

        res.json({
            ridesCreated,
            ridesJoined,
            rating,
            requestsReceived,
            requestsSent
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
