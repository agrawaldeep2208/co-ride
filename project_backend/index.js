require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicle');
const rideRoutes = require('./routes/ride');
const notificationRoutes = require('./routes/notification');
const userRoutes = require('./routes/user');
const ratingRoutes = require('./routes/rating');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Database connection
const PORT = process.env.PORT || 5000;

const User = require('./models/User');

mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        
        // Seed Admin User
        const adminEmail = '23it430@bvmengineering.ac.in';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            console.log('Seeding Admin User...');
            await User.create({
                fullName: 'Deep Agrawal',
                email: adminEmail,
                password: 'admin',
                role: 'admin',
                phone: '9876543210',
                status: 'active'
            });
            console.log('Admin User Seeded successfully');
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });
