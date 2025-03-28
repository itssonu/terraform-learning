const mongoose = require('mongoose')

const DemandTemplateSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true
    },
    caseType: {
        type: String,
        required: true
    },
    demandType: {
        type: String,
        required: true
    },
    factIncidentTitle: {
        type: String
    },
    factIncidentDescription: {
        type: String
    },
    liabilityTitle: {
        type: String
    },
    liabilityDescription: {
        type: String
    },
    priorMedicalRecordTitle: {
        type: String
    },
    priorMedicalRecordDescription: {
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
    termOfSettlementTitle: {
        type: String
    },
    termOfSettlementDescription: {
        type: String
    },
    badFaithExposerTitle: {
        type: String
    },
    badFaithExposerDescription: {
        type: String
    },
    templateFileName: {
        type: String
    },
    templateFile: {
        type: String
    },
    shouldShowSettlementTable: {
        type: Boolean
    }
}, { timestamps: true });

module.exports = DemandTemplateSchema
