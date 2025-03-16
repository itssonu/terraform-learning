const mongoose = require('mongoose')

const UMPLDTemplate = new mongoose.Schema({

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

    firmName: {
        type: String
    },
},
    { timestamps: true },
)

module.exports = UMPLDTemplate;