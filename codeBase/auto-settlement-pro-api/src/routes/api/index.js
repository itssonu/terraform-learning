var router = require('express').Router()
const { verifyToken } = require('../../miiddleware/authMiddleware');
const initMiddleware = require('../../miiddleware/initMiddleware.js');
const isAuthorize = require('../../miiddleware/isAuthorize.js');


router.use('/user', verifyToken, initMiddleware, require('./User'));
router.use('/case', verifyToken, initMiddleware, require('./Case'));
router.use('/auth', initMiddleware, require('./Auth'));
router.use('/companies', verifyToken, isAuthorize({ isSuperAdmin: true }), initMiddleware, require('./Companies'));
router.use('/logout', verifyToken, initMiddleware, require('./Logout'));
router.use('/Subscription', initMiddleware, require('./Subscription'));
router.use('/super/dashboard', verifyToken, isAuthorize({ isSuperAdmin: true }), initMiddleware, require('./superDashboard.js'));
router.use('/company/dashboard', verifyToken, initMiddleware, require('./companyDashboard.js'));
router.use('/utils', verifyToken, initMiddleware, require('./utils.js'));

router.use('/template', verifyToken, isAuthorize({ isAdmin: true }), initMiddleware, require('./Template'))
module.exports = router