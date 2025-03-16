const { getObjectSignedUrl } = require("../utils/aws/s3");
const { SendSuccessResponse, SendErrorResponse } = require("./BaseController");

const getSignedUrl = async (req, res, next) => {
    try {
        const { path } = req.body;
        
        if (!path) {
            return SendErrorResponse(res, {
                message: 'File path is required'
            });
        }

        const signedUrl = await getObjectSignedUrl({
            path,
            expireIn: 60 * 5,
        });

        return SendSuccessResponse(res, {
            data: {
                signedUrl,
            }
        });

    } catch (error) {
        next(error)
    }
};

module.exports = {
    getSignedUrl
};