const User = require("../db/models/User");
const BaseController = require('./BaseController');
const UtilityHelpers = require('../UtilityHelpers');
const { uploadPhoto } = require('../miiddleware/UploaadPhoto')
const Token = require('../miiddleware/authMiddleware')
const mongoose = require("mongoose");
const db = require('../db/dbConnection');

const logoutHandler = async () => {
    try {
        // Disconnect from the MongoDB server
        await mongoose.disconnect();

        // ... rest of the code
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

class LogoutController extends BaseController {
    static async logout(req, res) {
        try {
            const { domainName } = req.body;
            let response = {
                statusCode: 200,
                success: true,
                message: "Welcome",
            }
    
            return super.SendSuccessResponse(res, response);
        } catch (err) {
            return super.SendErrorsAsResponse(err, res)
        }
    }
    
}
module.exports = LogoutController;