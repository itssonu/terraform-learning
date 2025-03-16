import * as type from '../type';

const initialState = {
    injuryData: {
        isPreProcessRecordLoading: false,
    },
    summaryLoadingPercentage : 0,
}

export default function PreProcessMedicalRecords(state = initialState, action) {
    switch (action.type) {
        case type.PRE_PROCCESSED_MEDICAL_DATA:
            return {
                ...state,
                injuryData: action.payload
            }
        case type.SUMMARY_LOADING:
            return {
                ...state,
                summaryLoadingPercentage: action.payload
            }
        default:
            return state
    }
}