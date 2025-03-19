const router = require("express").Router();
const { getCompaniesAnalytics } = require("../../controllers/superDashboardController");

router.post('/companies-analytics', getCompaniesAnalytics);

module.exports = router;