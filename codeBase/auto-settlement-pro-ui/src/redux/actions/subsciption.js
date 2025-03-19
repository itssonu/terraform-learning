import * as type from '../type';

export function storeSubscription(subscriptionData) {
  return {
      type: type.SUBSCRIPTION,
      payload: subscriptionData,
    }
}