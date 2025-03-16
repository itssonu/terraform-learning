const router = require("express").Router();
const { getUsersAnalytics, getComapnyMonthlyCasesAnalytics } = require("../../controllers/companyDashboardController");

router.post('/users-analytics', getUsersAnalytics);
router.post('/company-monthly-cases-analytics', getComapnyMonthlyCasesAnalytics);

module.exports = router;