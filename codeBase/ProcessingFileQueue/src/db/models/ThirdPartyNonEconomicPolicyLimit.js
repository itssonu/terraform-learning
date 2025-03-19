const mongoose = require('mongoose')

const ThirdPartyNonEconomicPolicyLimitSchema = new mongoose.Schema({
    tpnpcompanyName: {
        type: String
    },
    tpnpattorneyName: {
        type: String
    },
    tpnpstate: {
        type: String
    },
    tpnpattorneyEmail: {
        type: String
    },
    tpnpfirmAddress: {
        type: String
    },
    tpnpintroduction: {
        type: String
    },
    tpnpliabilityTitle: {
        type: String
    },
    tpnpliabilityDescription: {
        type: String
    },
    tpnpintroductionTitle: {
        type: String
    },
    tpnpintroductionDescription: {
        type: String
    },
    tpnppriorMedicalRecordTitle: {
        type: String
    },
    tpnppriorMedicalRecordDescription: {
        type: String
    },
    tpnpnonEconomicDamageTitle: {
        type: String
    },
    tpnpnonEconomicDamageDescription: {
        type: String
    },
    tpnplossOfIncomeTitle: {
        type: String
    },
    tpnplossOfIncomeDescription: {
        type: String
    },
    tpnpsettlementDemandTitle: {
        type: String
    },
    tpnpsettlementDemandDescription: {
        type: String
    },
    tpnpbadFaithExposerTitle: {
        type: String
    },
    tpnpbadFaithExposerDescription: {
        type: String
    },
    tpnptermOfSettlementTitle: {
        type: String
    },
    tpnptermOfSettlementDescription: {
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
    { timestamps: true }
)

// const ThirdPartyNonEconomicPolicyLimit = mongoose.model('thirdPartyNonEconomicPolicyLimitTemplate', ThirdPartyNonEconomicPolicyLimitSchema)

module.exports = ThirdPartyNonEconomicPolicyLimitSchema;