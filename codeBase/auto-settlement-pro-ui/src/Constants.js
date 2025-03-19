import { DEMAND_TYPE } from "./utils/enum";

var CryptoJS = require("crypto-js");
class Constants {
    static ApiUrl = {
        create: '/create',
        generate: '/generatePdf',
        generateuintArray: '/generateuintArray',
        pdfConverter: "/upload-pdf",
        getErrorLog: '/GetErrorLog',
        deleteCase: '/DeleteCase',
        preProcessMedicalRecords: '/PreProcessMedicalRecords',
        template: {
            getDemandTemplate: '/api/template/getDemandTemplate',
            deleteDemandTemplate: '/api/template/deleteDemandTemplate',
            addUpdateDemandTemplate: '/api/template/addUpdateDemandTemplate',
            getTemplateSettings: '/api/template/getTemplateSettings',
            addUpdateTemplateSettings: '/api/template/addUpdateTemplateSettings',
            getTemplates: '/api/template/getAllDemandTemplates',
        },
        user: {
            add: '/api/user/add',
            getUsers: "/api/user/getUsers",
            updateProfile: "/api/user/profile",
            updateUser: "/api/user/UpdateUser",
            getfilterUser: "/api/user/filterUser",
            getfilterMonth: "/api/user/filterMonth",
        },

        case: {
            getCases: '/api/case/getCases',
            getCaseById: '/api/case/getCaseById'
        },
        companies: {
            getCompanies: '/api/companies/getcompanies',
            addCompanies: '/api/companies/addcompanies',
            updatecompanies: '/api/companies/updatecompanies',
            filtercompanies: '/api/companies/filtercompanies',

        },
        logout: {
            logout: "/api/logout/logout",
        },
        // error: {
        //     getErrorLog: '/GetErrorLog'
        // },
        auth: {
            superAdminSignin: '/api/auth/Supersignin',
            sigin: '/api/auth/signin',
            forgotPassword: '/api/auth/forgotPaasword',
            resetPassword: '/api/auth/resetpassword',
        },
        subscription: {
            subs: "/api/subscription/AddSubs",
        },
        company: {
            dashboard: {
                userAnalytics: '/api/company/dashboard/users-analytics',
                monthlyAnalytics: '/api/company/dashboard/company-monthly-cases-analytics'
            }
        },
        super: {
            dashboard: {
                companyAnalytics: '/api/super/dashboard/companies-analytics'
            }
        },

        utils: {
            getSignedUrl: 'api/utils/getSignedUrl'
        },
    }

    static RefernceVariables = [
        { value: "[Clientname]", text: "Clientname" },
        { value: "[clientFullName]", text: "Client Full Name" },
        { value: "[Faultername]", text: "Faultername" },
        { value: "[Gender]", text: "Gender" },
        { value: "[Age]", text: "Age" },
        { value: "[PastMonthlyPainAmount]", text: "PastMonthlyPainAmount" },
        { value: "[FutureYearlyPainAmount]", text: "FutureYearlyPainAmount" },
        { value: "[Amount]", text: "Amount" },
        { value: "[CreatedDate]", text: "CreatedDate" },
        { value: "[ClientProfession]", text: "ClientProfession" },
        { value: "[MissedWorkHours]", text: "MissedWorkHours" },
        { value: "[HourlyWorkingRate]", text: "HourlyWorkingRate" },
        { value: "[AccidentDate]", text: "Accident Date" },
        { value: "[PoliceReportExhibit]", text: "Police Report Exhibit" },
        { value: "[PriorMedicalRecordExhibit]", text: "Prior Medical Record Exhibit" },
        { value: "[AccidentInjuryPhotosExhibit]", text: "Accident Injury Photo Exhibit" },
        { value: "[PropertyInjuryPhotosExhibit]", text: "Property Injury Photos Exhibit" },
        { value: "[MedicalRecordExhibit]", text: "Medical Record Exhibit" },
        { value: "[MedicalBillExhibit]", text: "Medical Bill Exhibit" },
        { value: "[lifeExpectancyAge]", text: "Life Expectancy" },
        { value: "[monthsDifference]", text: "Months Difference" },
        { value: "[pastNonEconomicDamages]", text: "Past Non Economic Damages" },
        { value: "[perDayAmountForFutureNonEconomicDamages]", text: "Per Day Amount For Future Non-Economic Damages" },
        { value: "[postNonEconomicsDamagesFinalAmount]", text: "Post Non-Economics Damages Final Amount" },
        { value: "[perDayPasNonEconomicDamagesAmount]", text: "Per Day Past Non-Economic Damages Amount" },
        { value: "[perDayPasNonEconomicDamagesFinalAmount]", text: "Per Day Past Non-Economic Damages Final Amount" },
        { value: "[he/she]", text: "He/She" },
        { value: "[his/her]", text: "His/Her" },
        { value: "[him/her]", text: "Him/Her" },
        { value: "[lossofIncomeCalculatedAmount]", text: "Loss of Income Calculated Amount" },
        { value: "[PainAndSuffringSection]", text: "PainandSuffringSection" },
        { value: "</t>", text: "Tab" },
        { value: "[LLMLiabilityDescription].", text: "LLM Liability Description" },

        { value: "[LLMFactsOfIncident]", text: "LLM Facts Of Incident" },
        { value: "[LLMDangerousCondition]", text: "LLM Dangerous Conditions" },
        { value: "[LLMACNotice]", text: "LLM AC Notice" },
        { value: "[LLMAdequateWarning]", text: "LLM Adequate Warning" },
        { value: "[LLMConsumerExpectation]", text: "LLM Consumer Expectation" },
        { value: "[LLMRiskBenefit]", text: "LLM Risk Benefit" },
        { value: "[LLMManufacturingDefect]", text: "LLM Manufacturing Defect" },
        { value: "[defAdjusterName]", text: "Defendant Adjuster Name" },
        { value: "[defInsuranceName]", text: "Defendant Insurance Name" },
        { value: "[defAdjusterAddress]", text: "Defendant Adjuster Address" },
        { value: "[defAdjusterCity]", text: "Defendant Adjuster City" },
        { value: "[defAdjusterState]", text: "Defendant Adjuster State" },
        { value: "[defAdjusterZip]", text: "Defendant Adjuster Zip" },
        { value: "[clientAdjusterName]", text: "Client Adjuster Name" },
        { value: "[clientInsuranceName]", text: "Client Insurance Name" },
        { value: "[clientAdjusterAddress]", text: "Client Adjuster Address" },
        { value: "[clientAdjusterCity]", text: "Client Adjuster City" },
        { value: "[clientAdjusterState]", text: "Client Adjuster State" },
        { value: "[clientAdjusetrZip]", text: "Client Adjusetr Zip" },
        { value: "[defClaimNumber]", text: "Defendant Claim Number" },
        { value: "[clientClaimNumber]", text: "Client Claim Number" },
        { value: "[defInsuranceLastName]", text: "Defendant Insurance Last Name" },
        { value: "[LLMLossIncome]", text: "LLM Loss of Income" },
        { value: "[LLMMedicalExpenses]", text: "LLM Future Medical Expenses" }
    ]

    static Dropdowns = {
        FileType: [
            { value: 'ER', text: 'ER' },
            { value: 'Hospital', text: 'Hospital' },
            { value: 'Consultation Reports', text: 'Consultation Reports' },
            { value: 'MRI Other Imaging', text: 'MRI / Other Imaging' },
            { value: 'Surgery Center Reports', text: 'Surgery Center Reports' },
            { value: 'All Other Medical Records', text: 'All Other Medical Records' }
        ],

        States: [
            { value: "California", text: "California" },
            { value: "Alabama", text: "Alabama" },
            { value: "Alaska", text: "Alaska" },
            { value: "Arizona", text: "Arizona" },
            { value: "Arkansas", text: "Arkansas" },
            { value: "Colorado", text: "Colorado" },
            { value: "Connecticut", text: "Connecticut" },
            { value: "Delaware", text: "Delaware" },
            { value: "Florida", text: "Florida" },
            { value: "Georgia", text: "Georgia" },
            { value: "Hawaii", text: "Hawaii" },
            { value: "Idaho", text: "Idaho" },
            { value: "Illinois", text: "Illinois" },
            { value: "Indiana", text: "Indiana" },
            { value: "Iowa", text: "Iowa" },
            { value: "Kansas", text: "Kansas" },
            { value: "Kentucky", text: "Kentucky" },
            { value: "Louisiana", text: "Louisiana" },
            { value: "Maine", text: "Maine" },
            { value: "Maryland", text: "Maryland" },
            { value: "Massachusetts", text: "Massachusetts" },
            { value: "Michigan", text: "Michigan" },
            { value: "Minnesota", text: "Minnesota" },
            { value: "Mississippi", text: "Mississippi" },
            { value: "Missouri", text: "Missouri" },
            { value: "Montana", text: "Montana" },
            { value: "Nebraska", text: "Nebraska" },
            { value: "Nevada", text: "Nevada" },
            { value: "New Hampshire", text: "New Hampshire" },
            { value: "New Jersey", text: "New Jersey" },
            { value: "New Mexico", text: "New Mexico" },
            { value: "New York", text: "New York" },
            { value: "North Carolina", text: "North Carolina" },
            { value: "North Dakota", text: "North Dakota" },
            { value: "Ohio", text: "Ohio" },
            { value: "Oklahoma", text: "Oklahoma" },
            { value: "Oregon", text: "Oregon" },
            { value: "Pennsylvania", text: "Pennsylvania" },
            { value: "Rhode Island", text: "Rhode Island" },
            { value: "South Carolina", text: "South Carolina" },
            { value: "South Dakota", text: "South Dakota" },
            { value: "Tennessee", text: "Tennessee" },
            { value: "Texas", text: "Texas" },
            { value: "Utah", text: "Utah" },
            { value: "Vermont", text: "Vermont" },
            { value: "Virginia", text: "Virginia" },
            { value: "Washington", text: "Washington" },
            { value: "West Virginia", text: "West Virginia" },
            { value: "Wisconsin", text: "Wisconsin" },
            { value: "Wyoming", text: "Wyoming" },

        ],

        Gender: [
            { value: "he", text: "he" },
            { value: "she", text: "she" }
        ],

        MrMrs: [
            { value: "Male", text: "Male" },
            { value: "Female", text: "Female" }
        ],

        CaseTypes: [
            { value: "Multiple", text: "Multiple" },
            { value: "Individual", text: "Individual" },
        ],

        LevelOfPain: [
            { value: "1", text: "1" },
            { value: "2", text: "2" },
            { value: "3", text: "3" },
            { value: "4", text: "4" },
            { value: "5", text: "5" },
            { value: "6", text: "6" },
            { value: "7", text: "7" },
            { value: "8", text: "8" },
            { value: "9", text: "9" },
            { value: "10", text: "10" }
        ],

        BodyParts: [
            { value: "head", text: "Head" },
            { value: "neck", text: "Neck" },
            { value: "shoulders", text: "Shoulders" },
            { value: "back", text: "Back" },
            { value: "arms", text: "Arms" },
            { value: "elbows", text: "Elbows" },
            { value: "wrists", text: "Wrists" },
            { value: "hands", text: "Hands" },
            { value: "chest", text: "Chest" },
            { value: "abdomen", text: "Abdomen" },
            { value: "hips", text: "Hips" },
            { value: "legs", text: "Legs" },
            { value: "knees", text: "Knees" },
            { value: "ankles", text: "Ankles" },
            { value: "feet", text: "Feet" }
        ],

        multiPlaintiff: [
            { value: "Multiple", text: "Multiple" },
            { value: "Individual", text: "Individual" },
        ],

    }



    static getAuthtoken = () => {
        let token = localStorage.getItem("authtoken")
        if (!token || token === null || token === undefined) { return { isToken: false } }
        return { token: token, isToken: true }

    }

    static encrypt(text) {
        const ss = process.env.REACT_APP_LOCAL_CRYPTO_SECRET;
        return CryptoJS.AES.encrypt(text, process.env.REACT_APP_LOCAL_CRYPTO_SECRET).toString();
    }
    static decrypt(text) {
        const ss = process.env.REACT_APP_LOCAL_CRYPTO_SECRET;
        var bytes = CryptoJS.AES.decrypt(text, process.env.REACT_APP_LOCAL_CRYPTO_SECRET);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

}


export default Constants;