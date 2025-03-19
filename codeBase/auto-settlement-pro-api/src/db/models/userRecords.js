const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const UserRecordSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required.'],
        index: true,
        unique: [true, 'Email is already registered!']
    },
    domainName: {
        type: String,
        default: "",
    },
})

UserRecordSchema.plugin(uniqueValidator);


module.exports = UserRecordSchema;