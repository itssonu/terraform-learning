import * as type from '../type';

const initialState = {
    caseData: {},
}

export default function caseData(state = initialState, action) {
    switch (action.type) {
        case type.STORED_CASE_INFO:
            return {
                ...state,
                caseData: action.payload
            }
        default:
            return state
    }
}