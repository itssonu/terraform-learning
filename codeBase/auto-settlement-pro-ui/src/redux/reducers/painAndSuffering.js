import * as type from '../type';

const initialState = {
    painAndSufferingData: {},
}

export default function painAndSufferingData(state = initialState, action) {
    switch (action.type) {
        case type.STORED_PAIN_AND_SUFFERING:
            return {
                ...state,
                painAndSufferingData: action.payload
            }
        default:
            return state
    }
}