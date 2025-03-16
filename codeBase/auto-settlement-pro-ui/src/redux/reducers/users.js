import * as type from '../type';

const initialState = {
}

export default function users(state = initialState, action) {
  switch (action.type) {
    case type.GET_USERS:
      return {
        ...state,
        users: action.payload
      }
    case type.SET_USERS:
      return {
        ...state,
        ...action.payload
      }
    default:
      return state
  }
}