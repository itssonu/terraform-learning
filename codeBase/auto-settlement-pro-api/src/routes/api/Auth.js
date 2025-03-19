var router = require("express").Router();
const { AuthController } = require("../../controllers");
const initMiddleware = require("../../miiddleware/initMiddleware");

// User Auth routes
router.post('/signin', AuthController.signIn);
router.post('/Supersignin', initMiddleware, AuthController.SupersignIn);
router.post('/forgotPaasword', AuthController.forgotPassword);
router.post('/resetpassword', AuthController.changePassword)

module.exports = router;