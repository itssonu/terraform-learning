import * as type from '../type';

export function storePainAndSufferingData(painData) {
    return {
        type: type.STORED_PAIN_AND_SUFFERING,
        payload: painData,
    }
}