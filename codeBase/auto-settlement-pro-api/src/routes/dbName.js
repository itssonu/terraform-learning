const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// let setDbConnection = "";
// const DbConnection = setDbConnection;
//local
const dbName = (req,res,next)=>{
    const dbName =  "master";
    req.dbName = dbName;
    req.dbConnection = mongoose.connection.useDb(dbName);
    next()
}
// production
// const dbName = (req,res,next)=>{
//     const origin = req.headers.origin;
//     const domain = origin ? origin.replace(/^https?:\/\/|:\d{1,5}$/g, '') : "master";

//     let subdomain = domain;
//     if (domain) {
//         const domainParts = domain.split('.');
//         if (domainParts.length > 2) {
//             subdomain = domainParts[0];
//         }
//     }

//     req.dbName = subdomain == "184" ? "master" : subdomain;
//     console.log('req.dbName:', req.dbName);  
//     req.dbConnection = mongoose.connection.useDb(req.dbName);
//     next()
// }

router.use('/',dbName, require('./api/Home'));
router.use('/api',dbName, require('./api'))

module.exports = {dbName};