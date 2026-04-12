const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const OTP = require('../models/OTP');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in DB
        await OTP.findOneAndUpdate(
            { email },
            { otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        const mailOptions = {
            from: `"coRide Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your coRide Registration OTP',
            text: `Your OTP for coRide registration is ${otp}. It is valid for 5 minutes.`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">coRide Verification</h2>
          <p>Hello,</p>
          <p>Your OTP for registration is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, phone, otp } = req.body;

    try {
        // Check if OTP is valid
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            fullName: name,
            email,
            password,
            phone,
        });

        if (user) {
            // Create user stats
            await UserStats.create({
                user_id: user._id,
            });

            // Delete OTP after successful registration
            await OTP.deleteOne({ email });

            res.status(201).json({
                _id: user._id,
                name: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                drivingLicenseNumber: user.drivingLicenseNumber,
                drivingLicenseImage: user.drivingLicenseImage,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                drivingLicenseNumber: user.drivingLicenseNumber,
                drivingLicenseImage: user.drivingLicenseImage,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Authenticate with Google
// @route   POST /api/auth/google-login
// @access  Public
router.post('/google-login', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // Create user if doesn't exist
            user = await User.create({
                fullName: name,
                email,
                password: Math.random().toString(36).slice(-8), // Random password for social login
                phone: 'Not Provided', // Google doesn't always provide phone
                status: 'active',
                role: 'user',
            });

            // Create user stats
            await UserStats.create({
                user_id: user._id,
            });
        }

        res.json({
            _id: user._id,
            name: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            drivingLicenseNumber: user.drivingLicenseNumber,
            drivingLicenseImage: user.drivingLicenseImage,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Google authentication failed' });
    }
});

module.exports = router;
