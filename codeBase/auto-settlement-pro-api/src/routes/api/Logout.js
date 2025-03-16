var router = require("express").Router();
const { LogoutController } = require("../../controllers");

// User Api Routes
router.post("/logout", LogoutController.logout);
 

module.exports = router;