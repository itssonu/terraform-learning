export const DEMAND = {
    TP_PLD: 'TP_PLD',
    TP_N_PLD: 'TP_N_PLD',
    TP_GED: 'TP_GED',
    UIM_PLD: 'UIM_PLD',
    UIM_N_PLD: 'UIM_N_PLD',
    UM_PLD: 'UM_PLD',
    UM_N_PLD: 'UM_N_PLD',
    Simplified_TP_PLD: 'Simplified_TP_PLD',
    Simplified_UIM_PLD: 'Simplified_UIM_PLD',
    Simplified_UM_PLD: 'Simplified_UM_PLD',
    Medical_Chronology: 'Medical_Chronology',
}

export const DEMAND_TYPE = {
    [DEMAND.TP_PLD]: { key: 'thirdPartyPolicyLimit', text: 'Third Party Policy Limit Demand', value: DEMAND.TP_PLD },
    [DEMAND.TP_N_PLD]: { key: 'thirdPartyNonPolicyLimit', text: 'Third Party Non-Policy Limit Demand', value: DEMAND.TP_N_PLD },
    [DEMAND.TP_GED]: { key: 'tp_ged', text: 'Third Party Government Entity Demand', value: DEMAND.TP_GED },
    [DEMAND.UIM_PLD]: { key: 'uimPolicyLimitDemand', text: 'UIM Policy Limit Demand', value: DEMAND.UIM_PLD },
    [DEMAND.UIM_N_PLD]: { key: 'uimNonPolicyLimitDemand', text: 'UIM Non-Policy Limit Demand', value: DEMAND.UIM_N_PLD },
    [DEMAND.UM_PLD]: { key: 'um_pld', text: 'UM Policy Limit Demand', value: DEMAND.UM_PLD },
    [DEMAND.UM_N_PLD]: { key: 'um_n_pld', text: 'UM Non-Policy Limit Demand', value: DEMAND.UM_N_PLD },
    [DEMAND.Simplified_TP_PLD]: { key: 'simplified_tp_pld', text: 'Simplified Third Party Policy Limit Demand', value: DEMAND.Simplified_TP_PLD },
    [DEMAND.Simplified_UIM_PLD]: { key: 'simplified_uim_pld', text: 'Simplified UIM Policy Limit Demand', value: DEMAND.Simplified_UIM_PLD },
    [DEMAND.Simplified_UM_PLD]: { key: 'simplified_um_pld', text: 'Simplified UM Policy Limit Demand', value: DEMAND.Simplified_UM_PLD },
    [DEMAND.Medical_Chronology]: { key: 'medical_chronology', text: 'Medical Chronology', value: DEMAND.Medical_Chronology },
}

export const CASE_TYPE = {
    AUTO_ACCIDENT: 'AUTO_ACCIDENT',
    TRIP_AND_FALL: 'TRIP_AND_FALL',
    SLIP_AND_FALL: 'SLIP_AND_FALL',
    PREMISE_LIABILITY: 'PREMISE_LIABILITY',
    //PRODUCT_LIABILITY: 'PRODUCT_LIABILITY',
    DOG_BITE: 'DOG_BITE',
}

export const CASE_TYPE_MAP = {
    [CASE_TYPE.AUTO_ACCIDENT]: { key: 'auto_accident', text: 'Auto Accident', value: CASE_TYPE.AUTO_ACCIDENT },
    [CASE_TYPE.TRIP_AND_FALL]: { key: 'trip_and_fall', text: 'Trip and Fall', value: CASE_TYPE.TRIP_AND_FALL },
    [CASE_TYPE.SLIP_AND_FALL]: { key: 'slip_and_fall', text: 'Slip and Fall', value: CASE_TYPE.SLIP_AND_FALL },
    [CASE_TYPE.PREMISE_LIABILITY]: { key: 'premise_liability', text: 'Premise Liability', value: CASE_TYPE.PREMISE_LIABILITY },
    // [CASE_TYPE.PRODUCT_LIABILITY]: { key: 'product_liability', text: 'Product Liability', value: CASE_TYPE.PRODUCT_LIABILITY },
    [CASE_TYPE.DOG_BITE]: { key: 'dog_bite', text: 'Dog Bite', value: CASE_TYPE.DOG_BITE }
};

export const CASE_TYPE_DEMANDS = {
    [CASE_TYPE.AUTO_ACCIDENT]: [
        DEMAND.TP_PLD,
        DEMAND.TP_N_PLD,
        DEMAND.TP_GED,
        DEMAND.UIM_PLD,
        DEMAND.UIM_N_PLD,
        DEMAND.UM_PLD,
        DEMAND.UM_N_PLD,
        DEMAND.Simplified_TP_PLD,
        DEMAND.Simplified_UIM_PLD,
        DEMAND.Simplified_UM_PLD,
        DEMAND.Medical_Chronology
    ],

    [CASE_TYPE.TRIP_AND_FALL]: [
        DEMAND.TP_PLD,
        DEMAND.TP_N_PLD,
        DEMAND.TP_GED,
        DEMAND.Simplified_TP_PLD,
        DEMAND.Medical_Chronology
    ],

    [CASE_TYPE.SLIP_AND_FALL]: [
        DEMAND.TP_PLD,
        DEMAND.TP_N_PLD,
        DEMAND.TP_GED,
        DEMAND.Simplified_TP_PLD,
        DEMAND.Medical_Chronology
    ],

    [CASE_TYPE.PREMISE_LIABILITY]: [
        DEMAND.TP_PLD,
        DEMAND.TP_N_PLD,
        DEMAND.TP_GED,
        DEMAND.Simplified_TP_PLD,
        DEMAND.Medical_Chronology
    ],

    // [CASE_TYPE.PRODUCT_LIABILITY]: [
    //     DEMAND.TP_PLD,
    //     DEMAND.TP_N_PLD,
    //     DEMAND.TP_GED,
    //     DEMAND.Simplified_TP_PLD,
    //     DEMAND.Medical_Chronology
    // ],

    [CASE_TYPE.DOG_BITE]: [
        DEMAND.TP_PLD,
        DEMAND.TP_N_PLD,
        DEMAND.TP_GED,
        DEMAND_TYPE.Simplified_TP_PLD.value,
        DEMAND.Medical_Chronology
    ]

};

export const DEMAND_GROUP = {
    TP: [DEMAND.TP_PLD, DEMAND.TP_N_PLD, DEMAND.Simplified_TP_PLD, DEMAND.TP_GED],
    UIM: [DEMAND.UIM_PLD, DEMAND.UIM_N_PLD, DEMAND.Simplified_UIM_PLD],
    UM: [DEMAND.UM_PLD, DEMAND.UM_N_PLD, DEMAND.Simplified_UM_PLD],
    PLD: [DEMAND.TP_PLD, DEMAND.UIM_PLD, DEMAND.UM_PLD],
    NON_PLD: [DEMAND.TP_N_PLD, DEMAND.UIM_N_PLD, DEMAND.UM_N_PLD],
    SIMPLIFIED: [DEMAND.Simplified_TP_PLD, DEMAND.Simplified_UIM_PLD, DEMAND.Simplified_UM_PLD],
    REGULAR: [DEMAND.TP_PLD, DEMAND.TP_N_PLD, DEMAND.UIM_PLD, DEMAND.UIM_N_PLD, DEMAND.UM_PLD, DEMAND.UM_N_PLD],
    ALL: Object.values(DEMAND)
}