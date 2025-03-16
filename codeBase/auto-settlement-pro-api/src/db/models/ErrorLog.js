const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
    userId: {
        type: Object
    },
    caseId: {
        type: Object
    },
    errorCode: {
        type: String
    },
    errorDescrition: {
        type: String
    },
    createDate: {
        type: String
    }
})

const ErrorLog = mongoose.model(
    'errorlog',
    errorLogSchema
)

module.exports = ErrorLog;