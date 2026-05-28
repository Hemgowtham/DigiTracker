const mongoose = require('mongoose');

// Define the blueprint for a registration event
const registrationSchema = new mongoose.Schema({
    domain: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

// Export the model so our server can use it
module.exports = mongoose.model('Registration', registrationSchema);