var router = require("express").Router();
const { UserController  } = require("../../controllers");
const isAuthorize = require("../../miiddleware/isAuthorize");

// User Api Routes
router.post("/Add", isAuthorize({ isAdmin: true }), UserController.Add);
router.get("/GetUsers", UserController.GetUsers);
router.put('/profile',UserController.UpdateProfile)
router.post('/UpdateUser', isAuthorize({ isAdmin: true }), UserController.UpdateUser)
router.post('/filterUser',UserController.filterUser)
router.post('/filterMonth',UserController.filterMonth)


module.exports = router;