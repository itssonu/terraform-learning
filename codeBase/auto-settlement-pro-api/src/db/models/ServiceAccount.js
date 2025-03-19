const mongoose = require('mongoose');

const ServiceAccountSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    apiKey: {
        type: String,
    }
});

module.exports = ServiceAccountSchema;