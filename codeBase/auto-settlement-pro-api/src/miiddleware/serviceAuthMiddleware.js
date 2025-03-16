const ServiceAccountSchema = require('../db/models/ServiceAccount');
const dbConn = require('../db/dbConnection');
const { useDB } = require("../utils/dbUtil");
const { createJwtToken } = require('../utils/authHelper');

exports.authenticateService = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key is missing'
        });
    }

    try {
        dbConn.initDb();
        const db = useDB()
        const ServiceAccountModel = db.model("serviceaccounts", ServiceAccountSchema);
        console.log(apiKey)
        const serviceAccount = await ServiceAccountModel.findOne({ apiKey: apiKey });
        console.log(serviceAccount)
        
        if (!serviceAccount) {
            return res.status(401).json({
                success: false,
                message: 'Invalid API key'
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};