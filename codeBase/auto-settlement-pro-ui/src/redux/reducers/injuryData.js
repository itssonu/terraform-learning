import * as type from '../type';

const initialState = {
  injury: {},
}

export default function injuryData(state = initialState, action) {
  switch (action.type) {
    case type.STORED_INJURY_ANALYSIS:
      return {
        ...state,
        injury: action.payload
      }
    default:
      return state
  }
}
