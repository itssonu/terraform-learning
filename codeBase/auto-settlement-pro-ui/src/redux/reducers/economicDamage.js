import * as type from '../type';

const initialState = {
    damage: {},
}

export default function economicDamage(state = initialState, action) {
    switch (action.type) {
        case type.STORED_ECONOMIC_DAMAGE:
            return {
                ...state,
                damage: action.payload
            }
        default:
            return state
    }
}