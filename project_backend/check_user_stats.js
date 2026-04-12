const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const User = require('./models/User');
        const Ride = require('./models/Ride');
        const RideRequest = require('./models/RideRequest');

        const firstUser = await User.findOne();
        if (!firstUser) {
            console.log('No users found');
            process.exit(0);
        }

        const userId = firstUser._id;
        console.log('Checking for user:', firstUser.fullName, 'ID:', userId);

        const ridesCreated = await Ride.countDocuments({ creator_id: userId });
        const ridesJoined = await RideRequest.countDocuments({ passengerId: userId, status: 'approved' });
        const reqReceived = await RideRequest.countDocuments({ 
            rideId: { $in: await Ride.find({ creator_id: userId }).distinct('_id') },
            status: 'pending'
        });
        const reqSent = await RideRequest.countDocuments({ passengerId: userId, status: 'pending' });

        console.log({
            ridesCreated,
            ridesJoined,
            reqReceived,
            reqSent
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUserStats();
