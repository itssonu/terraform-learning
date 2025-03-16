const mongoose = require('mongoose')

const SimplifiedUMPLDTemplate = new mongoose.Schema({

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

    nonEconomicDamageTitle: {
        type: String
    },
    nonEconomicDamageDescription: {
        type: String
    },

    settlementDemandTitle: {
        type: String
    },

    settlementDemandDescription: {
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

module.exports = SimplifiedUMPLDTemplate;