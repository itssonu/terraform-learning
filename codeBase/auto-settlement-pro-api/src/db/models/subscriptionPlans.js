const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const SubscriptionPlan = new mongoose.Schema({
    monthlyCreditsUsed: {
        type: String,
        default: "",
    },
    monthlyCredits: {
        type: String,
        default: "",
    },
    yearlyCredits: {
        type: String,
        default: "",
    },
    creditsInProgress:{
        type: String,
        default: "",
    },
    monthlypendingCredits:{
        type: String,
        default: "",
    },
    subscription : {
        type: String,
        default: "",
    }, 
    subscriptionPrice: {
        type: String,
        default: "",
    },
    noOfUser: {
        type: String,
        default: "",
    },
    subscriptionDemand: {
        type: String,
        default: "",
    }, 
    email : {
        type: String,
        default: "",
    },
    caseCount :{
        type: String,
        default: "",
    },
    maxCaseCount :{
        type: String,
        default: "",
    },
    monthlyAlaCarteCasesCharged :{
        type: String,
        default: "",
    },
    annualyAlaCarteCasesCharged :{
        type: String,
        default: "",
    },
    demandCreditsAccrued :{
        type: String,
        default: "",
    },
    lastUpdated: { type: Date, default: Date.now },
})

SubscriptionPlan.plugin(uniqueValidator);


module.exports = SubscriptionPlan;