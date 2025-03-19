import * as type from '../type';

const initialState = {
    subscription: {},
}

export default function subscription(state = initialState, action) {
  switch (action.type) {
    case type.SUBSCRIPTION:
      return {
        ...state,
        subscription: action.payload
      }
    default:
      return state
  }
}