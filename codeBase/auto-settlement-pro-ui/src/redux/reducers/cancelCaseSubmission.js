import * as type from '../type';

const initialState = {
    cancelCaseSubmission: false,
}

export default function CancelCaseSubmission(state = initialState, action) {

    switch (action.type) {
        case type.CANCEL_CASE:
            return {
                ...state,
                cancelCaseSubmission: action.payload
            }
        default:
            return state
    }
}