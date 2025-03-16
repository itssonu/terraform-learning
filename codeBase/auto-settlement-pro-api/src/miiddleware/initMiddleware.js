const BaseController = require("../controllers/BaseController");
const { initDb } = require("../db/dbConnection");
const { getDBName } = require("../utils/helper");

const initMiddleware = async (req, res, next) => {
    try {
        initDb()
    } catch (error) {
        return BaseController.apisResponse(res, {
            statusCode: 208,
            message: "error in initial setup middleware",
            success: false,
        });
    }
    next();
};

module.exports = initMiddleware;
