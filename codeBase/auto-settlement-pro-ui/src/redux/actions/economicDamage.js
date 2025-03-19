import * as type from '../type';

export function storeEconomicDamage(damageData) {
    return {
        type: type.STORED_ECONOMIC_DAMAGE,
        payload: damageData,
    }
}