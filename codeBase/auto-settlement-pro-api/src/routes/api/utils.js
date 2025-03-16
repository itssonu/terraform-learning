const { getSignedUrl } = require("../../controllers/utilController");

var router = require("express").Router();

// User Api Routes
router.post("/getSignedUrl", getSignedUrl);
 

module.exports = router;