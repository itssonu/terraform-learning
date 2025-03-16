const MEDICAL_RECORD_TYPE = {
    ALL_OTHER_MEDICAL_RECORDS: 'All Other Medical Records',
    MRI_OTHER_IMAGING: 'MRI Other Imaging',
    CONSULTATION_REPORTS: 'Consultation Reports',
    HOSPITAL: 'Hospital',
    SURGERY_CENTER_REPORTS: 'Surgery Center Reports',
    EMERGENCY_ROOM: 'ER'
}

const DEMAND = {
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

const DEMAND_TYPE = {
    [DEMAND.TP_PLD]: { key: 'thirdPartyPolicyLimit', text: 'Third Party Policy Limit Demand', value: DEMAND.TP_PLD, alias: "3P_PLD" },
    [DEMAND.TP_N_PLD]: { key: 'thirdPartyNonPolicyLimit', text: 'Third Party Non-Policy Limit Demand', value: DEMAND.TP_N_PLD, alias: "3P_N_PLD" },
    [DEMAND.TP_GED]: { key: 'tp_ged', text: 'Third Party Government Entity Demand', value: DEMAND.TP_GED, alias: "3P_GED" },
    [DEMAND.UIM_PLD]: { key: 'uimPolicyLimitDemand', text: 'UIM Policy Limit Demand', value: DEMAND.UIM_PLD, alias: "UIM_PLD" },
    [DEMAND.UIM_N_PLD]: { key: 'uimNonPolicyLimitDemand', text: 'UIM Non-Policy Limit Demand', value: DEMAND.UIM_N_PLD, alias: "UIM_N_PLD" },
    [DEMAND.UM_PLD]: { key: 'um_pld', text: 'UM Policy Limit Demand', value: DEMAND.UM_PLD, alias: "UM_PLD" },
    [DEMAND.UM_N_PLD]: { key: 'um_n_pld', text: 'UM Non-Policy Limit Demand', value: DEMAND.UM_N_PLD, alias: "UM_N_PLD" },
    [DEMAND.Simplified_TP_PLD]: { key: 'simplified_tp_pld', text: 'Simplified Third Party Policy Limit Demand', value: DEMAND.Simplified_TP_PLD, alias: "Simplified_3P_PLD" },
    [DEMAND.Simplified_UIM_PLD]: { key: 'simplified_uim_pld', text: 'Simplified UIM Policy Limit Demand', value: DEMAND.Simplified_UIM_PLD, alias: "Simplified_UIM_PLD" },
    [DEMAND.Simplified_UM_PLD]: { key: 'simplified_um_pld', text: 'Simplified UM Policy Limit Demand', value: DEMAND.Simplified_UM_PLD, alias: "Simplified_UM_PLD" },
    [DEMAND.Medical_Chronology]: { key: 'medical_chronology', text: 'Medical Chronology', value: DEMAND.Medical_Chronology, alias: "Medical_Chronology" },
}

const CASE_TYPE = {
    AUTO_ACCIDENT: 'AUTO_ACCIDENT',
    TRIP_AND_FALL: 'TRIP_AND_FALL',
    SLIP_AND_FALL: 'SLIP_AND_FALL',
    PREMISE_LIABILITY: 'PREMISE_LIABILITY',
    //PRODUCT_LIABILITY: 'PRODUCT_LIABILITY',
    DOG_BITE: 'DOG_BITE',
}

const CASE_TYPE_DEMANDS = {
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
        DEMAND_TYPE.TP_PLD.value,
        DEMAND_TYPE.TP_N_PLD.value,
        DEMAND_TYPE.Simplified_TP_PLD.value,
        DEMAND.Medical_Chronology
    ]

};

module.exports = { MEDICAL_RECORD_TYPE, DEMAND_TYPE, CASE_TYPE, CASE_TYPE_DEMANDS, DEMAND }