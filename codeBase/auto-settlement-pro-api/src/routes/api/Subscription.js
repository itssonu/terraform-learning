const express = require('express');
const router = express.Router();
const { authenticateService } = require('../../miiddleware/serviceAuthMiddleware');
const SubscriptionController = require('../../controllers/SubscriptionController');

router.post('/renewSubscription', 
    authenticateService, // First verify service account
    SubscriptionController.renewSubscription
);

module.exports = router;