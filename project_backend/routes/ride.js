const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const RideRequest = require('../models/RideRequest');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// @desc    Create a new ride
// @route   POST /api/ride
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            vehicle_id,
            source,
            destination,
            date,
            time,
            totalSeats,
            pricePerSeat
        } = req.body;

        // Verify the vehicle belongs to the user
        const vehicle = await Vehicle.findOne({ _id: vehicle_id, owner_id: req.user._id });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or not owned by you' });
        }

        if (totalSeats > vehicle.seatingCapacity) {
            return res.status(400).json({ message: `Number of seats (${totalSeats}) cannot exceed the vehicle's seating capacity (${vehicle.seatingCapacity})` });
        }

        // Generate a 4-digit join code
        const joinCode = Math.floor(1000 + Math.random() * 9000).toString();

        const ride = await Ride.create({
            creator_id: req.user._id,
            vehicle_id,
            source,
            destination,
            date,
            time,
            totalSeats,
            availableSeats: totalSeats,
            pricePerSeat,
            status: 'active',
            joinCode
        });

        res.status(201).json(ride);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all rides
// @route   GET /api/ride
// @access  Public
router.get('/', async (req, res) => {
    try {
        const rides = await Ride.find({ status: 'active' })
            .populate('creator_id', 'fullName email phone')
            .populate('vehicle_id');
        res.json(rides);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's created rides
// @route   GET /api/ride/created
// @access  Private
router.get('/created', protect, async (req, res) => {
    try {
        const rides = await Ride.find({ creator_id: req.user._id })
            .populate('vehicle_id')
            .sort({ createdAt: -1 });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Request to join a ride
// @route   POST /api/ride/:id/request
// @access  Private
router.post('/:id/request', protect, async (req, res) => {
    try {
        const { seatsRequested } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.creator_id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot request your own ride' });
        }

        if (ride.availableSeats < seatsRequested) {
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        // Check if request already exists
        const existingRequest = await RideRequest.findOne({
            rideId: ride._id,
            passengerId: req.user._id,
            status: { $in: ['pending', 'approved'] }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have an active request for this ride' });
        }

        const request = await RideRequest.create({
            rideId: ride._id,
            passengerId: req.user._id,
            seatsRequested
        });

        // Trigger notification for the ride creator
        await Notification.create({
            userId: ride.creator_id,
            type: 'request',
            title: 'New Ride Request',
            message: `${req.user.fullName || req.user.name || 'Someone'} requested to join your ride from ${ride.source} to ${ride.destination}`,
            rideId: ride._id
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's booked rides (requests)
// @route   GET /api/ride/booked
// @access  Private
router.get('/booked', protect, async (req, res) => {
    try {
        const requests = await RideRequest.find({ passengerId: req.user._id })
            .populate({
                path: 'rideId',
                populate: [
                    { path: 'creator_id', select: 'fullName email phone' },
                    { path: 'vehicle_id' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get requests for user's created rides
// @route   GET /api/ride/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
    try {
        const rides = await Ride.find({ creator_id: req.user._id });
        const rideIds = rides.map(ride => ride._id);

        const requests = await RideRequest.find({ rideId: { $in: rideIds } })
            .populate('passengerId', 'fullName email phone')
            .populate('rideId')
            .sort({ createdAt: -1 });
            
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve or reject a ride request
// @route   PUT /api/ride/request/:id
// @access  Private
router.put('/request/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await RideRequest.findById(req.params.id)
            .populate('rideId');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Verify user owns the ride
        if (request.rideId.creator_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is already processed' });
        }

        if (status === 'approved') {
            if (request.rideId.availableSeats < request.seatsRequested) {
                return res.status(400).json({ message: 'Not enough seats' });
            }
            
            // Update available seats
            await Ride.findByIdAndUpdate(request.rideId._id, {
                $inc: { availableSeats: -request.seatsRequested }
            });
        }

        request.status = status;
        await request.save();

        const type = status === 'approved' ? 'approval' : 'rejection';
        const title = status === 'approved' ? 'Request Approved' : 'Request Declined';
        const message = status === 'approved' 
            ? `Your request to join the ride from ${request.rideId.source} to ${request.rideId.destination} has been approved` 
            : `Your request to join the ride from ${request.rideId.source} to ${request.rideId.destination} has been declined`;

        // Trigger notification for passenger
        await Notification.create({
            userId: request.passengerId,
            type,
            title,
            message,
            rideId: request.rideId._id
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single ride by ID
// @route   GET /api/ride/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('creator_id', 'fullName email phone rating')
            .populate('vehicle_id');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // If the user is the creator, also include all requests for this ride
        let requests = [];
        if (ride.creator_id._id.equals(req.user._id)) {
            requests = await RideRequest.find({ rideId: ride._id })
                .populate('passengerId', 'fullName email phone rating');
        } else {
            // If checking as a passenger, check if they have a request
            requests = await RideRequest.find({ rideId: ride._id, passengerId: req.user._id });
        }

        res.json({ ride, requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Start ride
// @route   PUT /api/ride/:id/start
// @access  Private
router.put('/:id/start', protect, async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (!ride.creator_id.equals(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ride.status !== 'active') {
            return res.status(400).json({ message: `Cannot start ride that is ${ride.status}` });
        }

        ride.status = 'started';
        
        // Ensure joinCode exists for older rides
        if (!ride.joinCode) {
            ride.joinCode = Math.floor(1000 + Math.random() * 9000).toString();
        }

        await ride.save();

        // Send notifications to all approved passengers
        const approvedRequests = await RideRequest.find({ rideId: ride._id, status: 'approved' });
        
        const notificationPromises = approvedRequests.map(async (request) => {
            const passengerNotification = new Notification({
                userId: request.passengerId,
                type: 'ride_started',
                title: 'Ride Started! 🚗',
                message: `Your ride from ${ride.source} to ${ride.destination} has started! Use verification code ${ride.joinCode} to join.`,
                rideId: ride._id
            });
            return passengerNotification.save();
        });

        await Promise.all(notificationPromises);

        res.json(ride);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Join ride with code
// @route   PUT /api/ride/:id/join
// @access  Private
router.put('/:id/join', protect, async (req, res) => {
    try {
        const { code } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'started') {
            return res.status(400).json({ message: 'Ride has not started yet' });
        }

        if (ride.joinCode !== code) {
            return res.status(400).json({ message: 'Invalid join code' });
        }

        const request = await RideRequest.findOne({
            rideId: ride._id,
            passengerId: req.user._id
        });

        if (!request) {
            return res.status(404).json({ message: 'No request found for this ride' });
        }

        if (request.status === 'joined') {
            return res.status(400).json({ message: 'You have already joined this ride' });
        }

        if (request.status !== 'approved') {
            return res.status(400).json({ message: `Your request status is ${request.status}, not approved` });
        }

        request.status = 'joined';
        await request.save();

        res.json({ message: 'Joined successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Finish ride
// @route   PUT /api/ride/:id/finish
// @access  Private
router.put('/:id/finish', protect, async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (!ride.creator_id.equals(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ride.status !== 'started') {
            return res.status(400).json({ message: 'Only started rides can be finished' });
        }

        ride.status = 'completed';
        await ride.save();

        // Notify all participants (approved or joined)
        const requests = await RideRequest.find({
            rideId: ride._id,
            status: { $in: ['approved', 'joined'] }
        });

        const notifications = requests.map(reqst => ({
            userId: reqst.passengerId,
            type: 'completion',
            title: 'Ride Finished',
            message: `The ride from ${ride.source} to ${ride.destination} has been completed. Hope you had a great journey!`,
            rideId: ride._id
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Create Payment records for all joined participants
        const joinedRequests = requests.filter(r => r.status === 'joined');
        
        if (joinedRequests.length > 0) {
            const payments = joinedRequests.map(reqst => ({
                rideId: ride._id,
                passengerId: reqst.passengerId,
                driverId: ride.creator_id,
                amount: ride.pricePerSeat * reqst.seatsRequested,
                status: 'pending'
            }));
            
            await Payment.insertMany(payments);
        }

        res.json(ride);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
