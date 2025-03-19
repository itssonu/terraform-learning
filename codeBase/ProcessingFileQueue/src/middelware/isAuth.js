const jwt = require('jsonwebtoken');
const { getDBName } = require('../utils/helper');

exports.isAuth = (req, res, next) => {
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
        req.user = { ...decoded, authId: decoded.id, dbName: getDBName({ domainName: decoded?.domainName }) }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token is expired" });
    }
};