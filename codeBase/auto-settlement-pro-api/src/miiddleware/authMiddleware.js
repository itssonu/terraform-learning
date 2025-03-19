const jwt = require('jsonwebtoken');
const { getDBName } = require('../utils/helper');

exports.create = (data) => {
    return jwt.sign(data, process.env.JWT_PRIVATEKEY, { expiresIn: process.env.JWT_EXPIRES_IN });
}
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Token is missing',
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATEKEY);
        // console.log(decoded,"decoded");
        req.userId = decoded.id;
        req.domainName = decoded.domainName.split('.')
        req.user = { ...decoded, dbName: getDBName({ domainName: decoded?.domainName }) }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token is expired" });
    }
};