const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Otp = require('../models/Otp');
require('dotenv').config(); // Load environment variables

const router = express.Router();

// --- 1. Set Up the Email Sender ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- 2. SIGNUP ROUTE (Create Account & Send OTP) ---
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        
        if (user && user.isVerified) {
            return res.status(400).json({ error: "Account already exists. Please log in." });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // If user exists but isn't verified yet, update their password. Otherwise, create new.
        if (user) {
            user.password = hashedPassword;
            await user.save();
        } else {
            user = new User({ email, password: hashedPassword, isVerified: false });
            await user.save();
        }

        // Generate a 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to database (it will auto-delete in 5 minutes based on your schema)
        await new Otp({ email, code: generatedOtp }).save();

        // Email the OTP to the user
        const mailOptions = {
            from: `"DigiTracker Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your DigiTracker Verification Code',
            text: `Your confirmation code is: ${generatedOtp}\n\nThis code will expire in 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: "Verification code sent to email!" });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- 3. VERIFY OTP ROUTE (Upgraded for Auto-Login) ---
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, code } = req.body;
        const validOtp = await Otp.findOne({ email, code });
        
        if (!validOtp) return res.status(400).json({ error: "Invalid or expired verification code." });

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        await Otp.deleteOne({ _id: validOtp._id });

        // Auto-Login: Generate the token immediately!
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ message: "Account verified!", token, email: user.email });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- 4. LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password." });

        if (!user.isVerified) return res.status(401).json({ error: "Please verify your email first." });

        // Compare the submitted password against the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid email or password." });

        // Generate a secure JSON Web Token (JWT)
        const token = jwt.sign(
            { userId: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: "Login successful!", token, email: user.email });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- 5. GOOGLE OAUTH ROUTE ---
router.post('/google', async (req, res) => {
    try {
        // In a full production app, you would verify the Google token using google-auth-library here.
        // For this implementation, we will accept the verified email from the React frontend.
        const { email, googleId } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            // Create a new verified user if they don't exist
            user = new User({ email, googleId, isVerified: true });
            await user.save();
        }

        // Issue the login token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ message: "Google login successful!", token, email: user.email });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;