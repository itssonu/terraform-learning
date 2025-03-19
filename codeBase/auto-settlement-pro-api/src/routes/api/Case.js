var router = require("express").Router();
const { CaseController, ErrorController } = require("../../controllers");

// User Api Routes
router.get("/GetCases", CaseController.GetCases);
router.get("/getCaseById/:id", CaseController.getCaseById);
 

module.exports = router;