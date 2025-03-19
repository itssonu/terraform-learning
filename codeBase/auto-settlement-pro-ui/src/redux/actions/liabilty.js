import * as type from '../type';

export function storeLiablity(liability) {
  return {
    type: type.STORED_LIABILTY,
    payload: liability,
  }
}
export function storeLiablityEstern(liability) {
  return {
    type: type.STORED_LIABILTY,
    payload: liability,
  }
}
export function storeInjuryAnalysis(InjuryData) {
  return {
    type: type.STORED_INJURY_ANALYSIS,
    payload: InjuryData,
  }
}
export function storeInjuryAnalysisEstern(InjuryData) {
  return {
    type: type.STORED_INJURY_ANALYSIS,
    payload: InjuryData,
  }
}
export function storeDamageAnalysisEstern(DamageData) {
  return {
    type: type.STORED_DAMAGE_ANALYSIS,
    payload: DamageData,
  }
}

export function preProcessedMedicalRecordsData(PreProcessMedicalRecords) {
  return {
    type: type.PRE_PROCCESSED_MEDICAL_DATA,
    payload: PreProcessMedicalRecords
  }
}

export function generateSummaryLoading(generateSummaryLoading) {
  return {
    type: type.SUMMARY_LOADING,
    payload: generateSummaryLoading
  }
}

export function isCaseSaved(isCase) {

  return {
    type: type.IS_CASE_SAVED,
    payload: isCase
  }
}

export function routeName(data) {
  return {
    type: type.ROUTE_NAME,
    payload: data
  }
}

export function formikRefCapture(refData) {
  return {
    type: type.REF_DATA_CAPTURED,
    payload: refData
  }

}

export function changeAddCaseFormStep(step=0) {
  return {
    type: type.ADD_CASE_FORM_STEP,
    payload: step
  }

}

export function cancelCaseSubmission(data) {
  return {
    type: type.CANCEL_CASE,
    payload: data
  }
}