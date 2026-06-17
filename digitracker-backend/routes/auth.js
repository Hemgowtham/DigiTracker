const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Otp = require('../models/Otp');
require('dotenv').config(); 

const router = express.Router();

// --- 1. Set Up the Email Sender Engine ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- REUSABLE UTILITY: Send Formatted Emails ---
const sendSecureEmail = async (targetEmail, subject, title, message, otpCode) => {
    const mailOptions = {
        from: `"DigiTracker Security" <${process.env.EMAIL_USER}>`,
        to: targetEmail,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; max-width: 500px; margin: auto;">
                <h2 style="color: #000;">${title}</h2>
                <p style="color: #555; font-size: 16px;">${message}</p>
                <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otpCode}</span>
                </div>
                <p style="color: #777; font-size: 14px;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

// --- 2. SIGNUP ROUTE (Create Account & Send OTP) ---
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        
        if (user && user.isVerified) {
            return res.status(400).json({ error: "Account already exists. Please log in." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user) {
            user.password = hashedPassword;
            await user.save();
        } else {
            user = new User({ email, password: hashedPassword, isVerified: false });
            await user.save();
        }

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await new Otp({ email, code: generatedOtp }).save();

        // Use the reusable email function
        await sendSecureEmail(
            email, 
            'Your DigiTracker Verification Code', 
            'Account Verification', 
            'Thank you for signing up for DigiTracker. Here is your verification code:', 
            generatedOtp
        );
        
        res.status(200).json({ message: "Verification code sent to email!" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- 3. VERIFY OTP ROUTE (Signup Verification) ---
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, code } = req.body;
        const validOtp = await Otp.findOne({ email, code });
        
        if (!validOtp) return res.status(400).json({ error: "Invalid or expired verification code." });

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        await Otp.deleteOne({ _id: validOtp._id });

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

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid email or password." });

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ message: "Login successful!", token, email: user.email });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- 5. FORGOT PASSWORD (Request OTP) ---
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ error: "Email not found in database. Please check for typos!" }); 
        }

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save to the MongoDB Otp model instead of temporary memory
        await new Otp({ email, code: generatedOtp }).save();

        // Use the reusable email function
        await sendSecureEmail(
            email, 
            'DigiTracker - Password Reset Code', 
            'Password Reset Request', 
            'You requested to reset your password for your DigiTracker account. Here is your secure 6-digit verification code:', 
            generatedOtp
        );

        res.status(200).json({ message: "OTP sent to your email successfully." });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: "Server error while sending email" });
    }
});

// --- 6. RESET PASSWORD (Verify OTP & Update DB) ---
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Search the MongoDB Otp collection
        const validOtp = await Otp.findOne({ email, code: otp });

        if (!validOtp) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // Hash the new password securely using bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await User.updateOne({ email }, { password: hashedPassword });
        
        // Destroy the OTP so it can't be reused
        await Otp.deleteOne({ _id: validOtp._id });

        res.status(200).json({ message: "Password has been successfully reset!" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// --- 7. GOOGLE OAUTH ROUTE ---
router.post('/google', async (req, res) => {
    try {
        const { email, googleId } = req.body;
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({ email, googleId, isVerified: true });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ message: "Google login successful!", token, email: user.email });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;