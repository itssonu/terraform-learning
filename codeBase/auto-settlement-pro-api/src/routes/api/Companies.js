var router = require("express").Router();
const { ComnpaniesController } = require("../../controllers");

// User Auth routes
router.post('/addcompanies', ComnpaniesController.AddCompanies);
router.get('/getcompanies', ComnpaniesController.GetCompanies);
router.post('/updatecompanies', ComnpaniesController.UpdateCompanies);
router.get('/filtercompanies', ComnpaniesController.FilterCompanies);


module.exports = router;