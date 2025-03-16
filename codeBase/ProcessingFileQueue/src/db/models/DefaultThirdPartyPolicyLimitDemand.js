const mongoose = require('mongoose')


const DefaultThirdPartyPolicyLimitDemandSchema = new mongoose.Schema({
    companyName: {
        type: String
    },
    attorneyName: {
        type: String
    },
    state: {
        type: String
    },
    attorneyEmail: {
        type: String
    },
    firmAddress: {
        type: String
    },
    introduction: {
        type: String
    },
    liabilityTitle: {
        type: String
    },
    liabilityDescription: {
        type: String
    },
    introductionTitle: {
        type: String
    },
    introductionDescription: {
        type: String
    },
    priorMedicalRecordTitle: {
        type: String
    },
    priorMedicalRecordDescription: {
        type: String
    },
    nonEconomicDamageTitle: {
        type: String
    },
    nonEconomicDamageDescription: {
        type: String
    },
    lossOfIncomeTitle: {
        type: String
    },
    lossOfIncomeDescription: {
        type: String
    },
    settlementDemandTitle: {
        type: String
    },
    settlementDemandDescription: {
        type: String
    },
    badFaithExposerTitle: {
        type: String
    },
    badFaithExposerDescription: {
        type: String
    },
    termOfSettlementTitle: {
        type: String
    },
    termOfSettlementDescription: {
        type: String
    },
    incidentTitle: {
        type: String
    },
    incidentDescription: {
        type: String
    },
    tripFallLiability: {
        type: String
    },

},
    { timestamps: true });

// const DefaultThirdPartyPolicyLimitDemand = mongoose.model(
//     'template', DefaultThirdPartyPolicyLimitDemandSchema,
// )

module.exports = DefaultThirdPartyPolicyLimitDemandSchema