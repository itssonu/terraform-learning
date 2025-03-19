const mongoose = require('mongoose')

const UIMNonPolicyLimitDemandSchema = new mongoose.Schema({
    uimnpcompanyName: {
        type: String
    },
    uimnpattorneyName: {
        type: String
    },
    uimnpstate: {
        type: String
    },
    uimnpattorneyEmail: {
        type: String
    },
    uimnpfirmAddress: {
        type: String
    },
    uimnpintroduction: {
        type: String
    },
    uimnpliabilityTitle: {
        type: String
    },
    uimnpliabilityDescription: {
        type: String
    },
    uimnpintroductionTitle: {
        type: String
    },
    uimnpintroductionDescription: {
        type: String
    },
    uimnppriorMedicalRecordTitle: {
        type: String
    },
    uimnppriorMedicalRecordDescription: {
        type: String
    },
    uimnpnonEconomicDamageTitle: {
        type: String
    },
    uimnpnonEconomicDamageDescription: {
        type: String
    },
    uimnplossOfIncomeTitle: {
        type: String
    },
    uimnplossOfIncomeDescription: {
        type: String
    },
    uimnpsettlementDemandTitle: {
        type: String
    },
    uimnpsettlementDemandDescription: {
        type: String
    },
    uimnpbadFaithExposerTitle: {
        type: String
    },
    uimnpbadFaithExposerDescription: {
        type: String
    },
    uimnptermOfSettlementTitle: {
        type: String
    },
    uimnptermOfSettlementDescription: {
        type: String
    },
},
    { timestamps: true }
)

// const UIMNonPolicyLimitDemand = mongoose.model('UIMNonPolicyLimitDemandTemplate', UIMNonPolicyLimitDemandSchema)

module.exports = UIMNonPolicyLimitDemandSchema;