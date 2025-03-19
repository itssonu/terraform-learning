import * as type from '../type';

const initialState = {
    liability: {},
    injuryData: {},
}

export default function liability(state = initialState, action) {
  switch (action.type) {
    case type.STORED_LIABILTY:
      return {
        ...state,
        liability: action.payload
      }
    default:
      return state
  }
}