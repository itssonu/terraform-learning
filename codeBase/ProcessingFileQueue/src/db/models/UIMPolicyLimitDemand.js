const mongoose = require('mongoose')

const UIMPolicyLimitDemandSchema = new mongoose.Schema({
    uimpcompanyName: {
        type: String
    },
    uimpattorneyName: {
        type: String
    },
    uimpstate: {
        type: String
    },
    uimpattorneyEmail: {
        type: String
    },
    uimpfirmAddress: {
        type: String
    },
    uimpintroduction: {
        type: String
    },
    uimpliabilityTitle: {
        type: String
    },
    uimpliabilityDescription: {
        type: String
    },
    uimpintroductionTitle: {
        type: String
    },
    uimpintroductionDescription: {
        type: String
    },
    uimppriorMedicalRecordTitle: {
        type: String
    },
    uimppriorMedicalRecordDescription: {
        type: String
    },
    uimpnonEconomicDamageTitle: {
        type: String
    },
    uimpnonEconomicDamageDescription: {
        type: String
    },
    uimplossOfIncomeTitle: {
        type: String
    },
    uimplossOfIncomeDescription: {
        type: String
    },
    uimpsettlementDemandTitle: {
        type: String
    },
    uimpsettlementDemandDescription: {
        type: String
    },
    uimpbadFaithExposerTitle: {
        type: String
    },
    uimpbadFaithExposerDescription: {
        type: String
    },
    uimptermOfSettlementTitle: {
        type: String
    },
    uimptermOfSettlementDescription: {
        type: String
    },
},
    { timestamps: true }
)

// const UIMPolicyLimitDemand = mongoose.model('UIMPolicyLimitDemandTemplate', UIMPolicyLimitDemandSchema)

module.exports = UIMPolicyLimitDemandSchema;