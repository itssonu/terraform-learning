const express = require('express');
const path = require('path')
const { dbName } = require('./dbName');
const router = express.Router();
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

router.use('/', dbName, require('./api/Home'));
router.use('/api', dbName, require('./api'))

module.exports = router;