import * as type from '../type';

const initialState = {
    routeName: '',
}

export default function routeName(state = initialState, action) {
    switch (action.type) {
        case type.ROUTE_NAME:
            return {
                ...state,
                routeName: action.payload
            }
        default:
            return state
    }
}