import * as type from '../type';

const initialState = {
  damage: {},
}

export default function damageData(state = initialState, action) {
  switch (action.type) {
    case type.STORED_DAMAGE_ANALYSIS:
      return {
        ...state,
        damage: action.payload
      }
    default:
      return state
  }
}