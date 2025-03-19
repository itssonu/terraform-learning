const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  detailsInput: {
    type: Object,
    // required: [true, 'Details input is required.'],
  },
  backup: {
    type: Object,
  },
  s3UniqueId: {
    type: String,
  },
  result: {
    type: Object,
    isDemandLetterGenerated: {
      type: Boolean
    },
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
    visitDates: {
      type: Array
    },
    injuryPhotoRecords: {
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
    }
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
    preMedicalRecords_progress: {
      type: String,
    },
    demandLetter_progress: {
      type: String,
    },
    isPoliceFileProcessing: {
      type: Boolean,
      default: 0
    }
  },
  isCaseEdited: {
    type: Boolean
  },
  createdOn: {
    type: String,
    // required: [true, 'Created on is required.'],
  },
  updatedOn: {
    type: String
  },
  isMedicalBillProcessing: {
    type: Boolean
  },
  isCaseNeedtoShow: {
    type: Boolean
  },
  isCaseGeneratedSccessfuly: {
    type: Boolean
  },
  istimetaken: {
    type: String,
    // required: [true, 'Created on is required.'],
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "users"
  },
  invoiceFilePath: {
    type: String,
    trim: true
  },
  docxFiles: {
    type: Object,
  },
  isDraftCase: {
    type: Boolean
  },
  isPreProcessRecordLoading: {
    type: Boolean
  }
})

module.exports = CaseSchema;
