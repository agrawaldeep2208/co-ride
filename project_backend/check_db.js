const mongoose = require('mongoose');
require('dotenv').config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const User = require('./models/User');
        const Ride = require('./models/Ride');
        const RideRequest = require('./models/RideRequest');
        const UserStats = require('./models/UserStats');

        const userCount = await User.countDocuments();
        const rideCount = await Ride.countDocuments();
        const requestCount = await RideRequest.countDocuments();
        const statsCount = await UserStats.countDocuments();

        console.log('Users:', userCount);
        console.log('Rides:', rideCount);
        console.log('Requests:', requestCount);
        console.log('UserStats:', statsCount);

        const rides = await Ride.find().limit(5);
        console.log('Sample Rides:', rides);

        const requests = await RideRequest.find().limit(5);
        console.log('Sample Requests:', requests);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
