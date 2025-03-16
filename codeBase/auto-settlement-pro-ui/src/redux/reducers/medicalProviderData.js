import * as type from '../type';

const initialState = {
    medicalProvider: {},
}

export default function medicalProviderData(state = initialState, action) {
    switch (action.type) {
        case type.STORED_MEDICAL_PROVIDER:
            return {
                ...state,
                medicalProvider: action.payload
            }
        default:
            return state
    }
}
