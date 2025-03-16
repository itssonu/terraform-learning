import * as type from '../type';

export function storeCaseInfoData(caseInfo) {
    return {
        type: type.STORED_CASE_INFO,
        payload: caseInfo,
    }
}