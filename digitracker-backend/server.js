require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // 1. Import CORS
const Registration = require('./models/Registration');


const User = require('./models/User'); 
const bcrypt = require('bcrypt');

const authRoutes = require('./routes/auth');
const app = express();
const PORT = 3000;

app.use(cors()); // 2. Open the security gates to allow external requests
app.use(express.json());

app.use('/api/auth', authRoutes);

// 2. Paste your exact connection string here. 
// IMPORTANT: Replace <password> with your actual database user password!
const mongoURI = process.env.MONGO_URI;
// 3. Connect to the database
mongoose.connect(mongoURI)
    .then(() => console.log('🟢 Successfully connected to MongoDB!'))
    .catch((err) => console.log('🔴 Database connection failed:', err));


// Temporary OTP Store (In production, this goes into MongoDB)

app.get('/', (req, res) => {
    res.send('DigiTracker Backend is successfully running!');
});

// --- POST ROUTE: Catch incoming extension data (With Deduplication) ---
app.post('/api/track', async (req, res) => {
    try {
        const incomingData = req.body; 

        // UPSERT LOGIC: Find an exact match of domain + email. 
        // If found, update the timestamp. If not found, create it.
        await Registration.findOneAndUpdate(
            { domain: incomingData.domain, email: incomingData.email }, // 1. What to look for
            { timestamp: Date.now() },                                  // 2. What to update
            { new: true, upsert: true }                                 // 3. Create if missing
        );

        console.log("✅ Success: Registration logged/updated!", incomingData.domain);
        res.status(200).json({ message: "Footprint securely logged/updated!" });

    } catch (error) {
        console.error("❌ Failed to save:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET route to send footprints ONLY for the logged-in email
app.get('/api/footprints', async (req, res) => {
    try {
        const userEmail = req.query.email; // Grab the email from the frontend request
        
        if (!userEmail) {
            return res.status(400).json({ error: "Email is required to fetch footprints" });
        }

        // Find registrations that specifically match this email
        const footprints = await Registration.find({ email: userEmail }).sort({ timestamp: -1 });
        res.status(200).json(footprints);
    } catch (error) {
        console.error("❌ Failed to fetch data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE route to remove a specific footprint from the database
app.delete('/api/footprints/:id', async (req, res) => {
    try {
        const footprintId = req.params.id; // Grab the unique ID from the URL

        // Tell MongoDB to find this specific ID and destroy it
        const deletedFootprint = await Registration.findByIdAndDelete(footprintId);

        if (!deletedFootprint) {
            return res.status(404).json({ error: "Footprint not found." });
        }

        res.status(200).json({ message: "Footprint permanently deleted." });
    } catch (error) {
        console.error("❌ Failed to delete:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- ADMIN ROUTE: Fetch ALL global footprints ---
app.get('/api/admin/footprints', async (req, res) => {
    try {
        // Find EVERY registration in the database, newest first
        const allFootprints = await Registration.find().sort({ timestamp: -1 });
        res.status(200).json(allFootprints);
    } catch (error) {
        console.error("❌ Failed to fetch admin data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- BULLETPROOF PURGE ROUTE: Delete all footprints for a specific user ---
app.delete('/api/user/footprints/:email', async (req, res) => {
    try {
        const userEmail = req.params.email; // Grabs the email directly from the URL URL

        if (!userEmail) {
            return res.status(400).json({ error: "Email is required to purge data." });
        }

        // Tell MongoDB to find every record with this email and destroy it
        const result = await Registration.deleteMany({ email: userEmail });

        console.log(`🗑️ Data Purged: Deleted ${result.deletedCount} records for ${userEmail}`);
        res.status(200).json({ message: "All user data permanently erased." });

    } catch (error) {
        console.error("❌ Failed to purge data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});