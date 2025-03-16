import * as type from '../type';

const initialState = {
    isCaseSaved: true,
}

export default function IsCaseSaved(state = initialState, action) {

    switch (action.type) {
        case type.IS_CASE_SAVED:
            return {
                ...state,
                isCaseSaved: action.payload
            }
        default:
            return state
    }
}