const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  detailsInput: {
    type: Object,
    required: [true, 'Details input is required.'],
  },
  s3UniqueId: {
    type: String,
  },
  result: {
    type: Object,
    liabilityAnalysisReport: {
      type: Array
    },
    accidentPhotoRecords: {
      type: Array
    },
    selectedAccidentFiles: {
      type: Array
    },
    bodyInjuryFiles: {
      type: Array
    },
    selectedBodyInjuryFiles: {
      type: Array
    },
    injuryAnalysisReport: {
      type: Array
    },
    nonEconomicalDamageAnalysis: {
      type: Array
    },
    lossOfIncomeAnalysis: {
      type: Array
    },
    conclusion: {
      type: Array
    },
    policeReportRecord: {
      type: String
    },
    icdCodesRecords: {
      type: Object,
    },
    medicalRecords: {
      type: Array
    },
    medicalBillRecords: {
      type: Array
    },
    policeReportExhibitPath: {
      type: Array
    },
  },
  resultProgress: {
    type: Object,
    policeReport_Progress: {
      type: String,
    },
    medicalRecords_progress: {
      type: String,
    }
    ,
    medicalBills_progress: {
      type: String,
    },
    isPoliceFileProcessing: {
      type: Boolean,
      default: 0
    },
    demandLetter_progress: {
      type: String,
    },

    default: {
      policeReport_Progress: '',
      medicalRecords_progress: '',
      medicalBills_progress: '',
      demandLetter_progress: ''
    }
  },
  createdOn: {
    type: String,
    required: [true, 'Created on is required.'],
  },
  updatedOn: {
    type: String
  },
  isMedicalBillProcessing: {
    type: Boolean
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "users"
  },
  docxFiles: {
    thirdPartyPolicyLimit: String,
    thirdPartyNonPolicyLimit: String,
    uimPolicyLimitDemand: String,
    uimNonPolicyLimitDemand: String
  },
  isDraftCase: {
    type: Boolean
  },
  isPreProcessRecordLoading: {
    type: Boolean
  }
})


// const Case = mongoose.model(
//   'cases',
//   CaseSchema
// )

module.exports = CaseSchema;
