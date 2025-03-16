import * as type from '../type';

export function storeMedicalProvider(providerData) {
    return {
        type: type.STORED_MEDICAL_PROVIDER,
        payload: providerData,
    }
}