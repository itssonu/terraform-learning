
import * as type from '../type';

const initialState = {
    refData: {},
    addCaseFormStep: 0
}

export default function FormikRefCapture(state = initialState, action) {
    switch (action.type) {
        case type.REF_DATA_CAPTURED:
            return {
                ...state,
                refData: action.payload
            }

        case type.ADD_CASE_FORM_STEP:
            return {
                ...state,
                addCaseFormStep: action.payload
            }
            
        default:
            return state
    }
}

