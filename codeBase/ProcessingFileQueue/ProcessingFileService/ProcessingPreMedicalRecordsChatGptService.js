const mongoose = require("mongoose");
const { chatGpt } = require("../Contant");
const { processAi } = require("./ChatGptPdfProcessor");
const { saveChatGptData } = require("./SaveChatGptResponse");
const CaseSchema = require('../src/db/models/Case')
const ComprehendMedical = require('aws-sdk/clients/comprehendmedical');

const moment = require('moment');
const { saveErrorLog } = require('./SaveChatGptResponse')

const ProcessPreMedicalIcalIcdCodes = async (content, caseId, userId, domainName) => {
    try {
        //  throw new Error('Simulated error');
        //console.log(content)
        let icdCodesChatGptResponse = [];
        let IcdCodesObject;
        let getIcdCodes = content
        let pattern = /[A-Z][0-9]{2}\.[0-9A-Z]{1,4}/g;
        let icdCodes = getIcdCodes?.match(pattern);

        let removeDuplicateIcdCodes = [... new Set(icdCodes)]
        const removeNotFoundIcdCodes = await notFoundIcdCodes(content, removeDuplicateIcdCodes)
        let uniqueIcdCodes = [... new Set(removeNotFoundIcdCodes)]
        let promtp = `Please provide the corresponding diseases for the given ICD-10 codes: ${uniqueIcdCodes}.
     Please provide only codes and their corressponding diease name.  Give me the output without any additional text or explanation.`

        if (icdCodes) {
            const reponse = await processAi({content: promtp});
            icdCodesChatGptResponse = reponse.replace(/ICD-10-CM/g, " ")
            const icdCodePattern = /[A-Z][0-9]{2}\.[0-9A-Z]{1,4}/g
            const icdCodesResp = icdCodesChatGptResponse.match(icdCodePattern);
            const disease = icdCodesChatGptResponse.replace(/[A-Z][0-9]{2}\.[0-9A-Z]{1,4}/g, '')
            const repmoveSpecialCharacter = disease?.replace(/\-/g, '')
            const diseaseName = repmoveSpecialCharacter?.split('\n')
            IcdCodesObject = { key: icdCodesResp, values: diseaseName }
            return IcdCodesObject
        } else {
            console.log('No IcdCodes found in this file')
            const { dieaseNameChatGptReponse, icdCodesChatGptResponse } = await getIcdCodesFromDiagonsisName(content, IcdCodesObject, caseId, userId, domainName)
            const icdCodesResp = icdCodesChatGptResponse.split('\n')
            const disease = dieaseNameChatGptReponse
            if (disease.length > 0) {
                const repmoveSpecialCharacter = disease
                const removeCharacter = repmoveSpecialCharacter?.replace(/[1-9].|10/g, '')
                const diseaseName = removeCharacter.split('\n')
                IcdCodesObject = { key: icdCodesResp, values: diseaseName }
            }
            return IcdCodesObject
        }
    } catch (e) {
        console.log(e)
        const errorCode = 500
        const errorDescrition = e.message
        await saveErrorLog(caseId, userId, errorCode, errorDescrition, domainName)
    }


}

const notFoundIcdCodes = async (content, IcdCodes) => {

    let newIcdCodes = [];

    for (let i = 0; i < IcdCodes.length; i++) {
        for (let j = 0; j < content.length; j++) {
            if (content.includes(IcdCodes[i])) {
                newIcdCodes.push(IcdCodes[i]);
            } else {
                console.log('Not found')
            }
        }

    }
    return newIcdCodes;

}

const getIcdCodesFromDiagonsisName = async (content, IcdCodesObject, caseId, userId, domainName) => {
    let icdCodesChatGptResponse = [];
    let dieaseNameChatGptReponse = [];
    let index = 0;
    let chunkSize = 15000
    let text = content

    while (index < text.length) {
        const medicalText = text.substr(index, chunkSize);
        const prompt = `This is a medical record. Please analyze the following text and provide only the diagnosis names from it: ${medicalText}. Provide only the disease names and do not include any extra explanations.`
        const reponse = await processAi({content: prompt})
        dieaseNameChatGptReponse = reponse.replace(/[1-9].|10/g, " ")
        console.log(dieaseNameChatGptReponse)
        index += chunkSize
    }

    const prompt = `Following are diagonsis name :- ${dieaseNameChatGptReponse}, 
    Based on diagonis name please find ICD-10 codes.Please provide ICD Code only. remove diagonsis name provide ICD-10 codes. Give me the output without any additional text or explanation.`
    //and its coressponding disease name.`;
    const reponse = await processAi({content: prompt})
    // let response = icdCodes.data.choices[0].message.content ? icdCodes.data.choices[0].message.content : "No-Data"
    icdCodesChatGptResponse = reponse.replace(/ICD-10-CM/g, " ")
    console.log(icdCodesChatGptResponse)

    return { dieaseNameChatGptReponse, icdCodesChatGptResponse };
}

const processandPreMedicalRecordsChatGptService = async (content, updatedCompleteRequest, socketService, caseId, userId, injury, count, caseModel, medicalProviderName, preMedicalProviderNames, medicalType, domainName, providers, pageCountBeforeCurrentProvider) => {
    try {
        // const icdCodesAndDiagonsis = await ProcessMedicalIcalIcdCodes(content, caseId, userId)
        // await saveChatGptData({ icdCodesRecords: icdCodesAndDiagonsis }, caseModel)
        const mediCalResponse = await getMedicalProviderNames(content, updatedCompleteRequest, socketService, caseId, userId, injury, count, caseModel, medicalProviderName, preMedicalProviderNames, medicalType, domainName, providers, pageCountBeforeCurrentProvider);
        console.log(mediCalResponse);
        count = count + 1
        if (count === preMedicalProviderNames) {
            providers = []
        }
        return {
            mediCalResponse,
            // completedRequests
        }
    } catch (er) {
        console.log(er)
        const errorCode = 500
        const errorDescrition = er.message
        await saveErrorLog(caseId, userId, errorCode, errorDescrition, domainName)
    }
}

const splitStringIntoChunks = (string, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < string.length; i += chunkSize) {
        chunks.push(string.substring(i, i + chunkSize));
    }
    return chunks;
}

const procesObjectiveFindings = async (text, caseId, userId, domainName) => {
    const objectiveFindingsPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like {

        objectiveFindings: "short detailed paragraph on objective findings"

    }. Text to analyze is in this curly bracket {CHUNKED_FILE_TEXT} Notes for the response :- 
    1.This is the medical record text of the patient.
    2. Please analyse it and provide a patient report with a short paragraph of objective findings.
    3. Please maintain the order as follows: Objective.
    4. It should be only one paragraph.
    5. Please remove patient's personal info like name, age, address and other personal stuff.
    Please provide Only JSON data. Give me the output without any additional text or explanation.
    .`

    const currentProviderObjectiveText = objectiveFindingsPrompt.replace("CHUNKED_FILE_TEXT", text);
    const response = await processAi({content: currentProviderObjectiveText});

    try {
        const parsedResponse = JSON.parse(response);
        return parsedResponse.objectiveFindings ? parsedResponse.objectiveFindings : "No-data"
    }
    catch (e) {
        console.log(e)
    }
}

const getPlanAndRecommendationData = async (chunkedFileText1, caseId, userId) => {

    const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {

        treatmentDates: [
            {    
               planRecommendation: ""   
            }
        ]

    }. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response :
    1. Please review the ER record file text of a patient. Extract the plan and Recommendation summary from the Emergency Room Report. Summary should contain that how patient was brought.
    2. Remove information such as ED Course, Diagnosis,History of Present Illness, Imaging, Impressions, Findings and Imaging Results.
    3. Do not inlcude information about Radiologies.
    4. If there is any prescription, do not include it.
    5. Ensure that patient personal information such as Name, Age, Phone Number, and Email are removed from the output.
    6. Don't add admit date and discharge date and summary.
    7. who was the doctor/surgeon/ Attendent and what was their recommendations but in this do not include patiend deatils and history of illness.
    Please provide Only JSON data. Give me the output without any additional text or explanation.
    `;
    let recommendations = []
    let count = 0;
    for (let i = 0; i < chunkedFileText1.length; i++) {
        const findCaseById = await CaseModelTable.findById(caseId)
        if (findCaseById) {
            let chunkedText = chunkedFileText1[i];
            chunkedText = chunkedText.replaceAll(',', ' ')
            const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
            const response = await processAi({content: currentProviderTreatmentSummaryText});
            if (response) {
                try {
                    let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                    recommendations = [...recommendations, ...treatmentSummaryDates]
                } catch (e) {
                    console.log(e)
                }
            }
        }
    }

    return recommendations;

}

const getImagingDetails = async (chunkedFileText1, caseId, userId) => {

    // const ocrTextLimit = 20000;
    // const chunkedFileText1 = splitStringIntoChunks(uniqueScansData, ocrTextLimit);
    const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like {

        treatmentDates:[
            {
            imagingName:"Scan name should be here",
            scanType:"Type of Scan",
            imagingImpression:["impression should insert here"],
            duplicate:""
        }
        ]

    }. Text to analyze is in this curly bracket {CHUNKED_FILE_TEXT} Notes for the response :- 
    1. Include the radiology name and impressions from CT scans, X-rays, or MRIs containing the keywords "CT scan," "X-ray," or "MRI." Insert the area imaged in "imagingName". Do not include any duplicate imaging entries.
    2. List impressions in bullet points under "imagingImpressions". Do not include any duplicate imaging impressions from the ER.
    3.Exclude the procedure provider, window settings, or findings unrelated to CT scans, X-rays, or MRIs.
    4.If there are no relevant findings, return "No findings". Do not include other details.
    5.Identify the type of scan conducted and insert the scan type into "scanType".
    6.Only include one "imagingName" entry at a time; do not combine multiple names into one entry.
    7.If there are no related CT scans, X-rays, or MRIs, leave those array fields blank rather than adding unwanted data.
    8.If there is a radiology name but no associated impressions, do not include that entry.
    9.Only extract the impressions from the relevant imaging scans. Do not include other findings with the impressions.
    10.Remove any duplicate CT scans, X-rays, or MRIs, entries to ensure each imaging entry is unique.
    Please provide Only JSON data. Give me the output without any additional text or explanation.
    `
    let scansReport = []
    let count = 0;
    for (let i = 0; i < chunkedFileText1.length; i++) {
        // if (count <= 3) {
        const findCaseById = await CaseModelTable.findById(caseId)
        if (findCaseById) {
            let chunkedText = chunkedFileText1[i];
            chunkedText = chunkedText.replaceAll(',', ' ')
            const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
            const response = await processAi({content: currentProviderTreatmentSummaryText});
            if (response) {
                try {
                    let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                    scansReport = [...scansReport, ...treatmentSummaryDates]

                } catch (e) {
                    console.log(e)
                }
            }
        }
        count = count + 1
        // }
    }

    return scansReport;
}

const getSystemAndPhysicalExamData = async (chunkedFileText1, caseId, userId) => {

    const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {

        treatmentDates: [
            {    
               systemPhysicalExam: ""   
            }
        ]

    }. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
        1.Extract the positive symptoms of diseases mentioned in the Review of Systems/Review of Symptoms disease section of the patient's ER record file. Ignore any negative symptoms of diseases and provide a summary of the findings.
        2.Please ignore information such as Physical Exam, First Vitals, Imaging, and Impressions.
        3.Do not add any unrelated Data by yourself.
        4.try to make paragraph short and simple but informative.
        Please provide Only JSON data. Give me the output without any additional text or explanation.
        `;



    let scansReport = []
    let count = 0;
    for (let i = 0; i < chunkedFileText1.length; i++) {
        // if (count <= 3) {
        const findCaseById = await CaseModelTable.findById(caseId)
        if (findCaseById) {
            let chunkedText = chunkedFileText1[i];
            chunkedText = chunkedText.replaceAll(',', ' ')
            const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
            const response = await processAi({content: currentProviderTreatmentSummaryText});
            if (response) {
                try {
                    let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                    scansReport = [...scansReport, ...treatmentSummaryDates]

                } catch (e) {
                    console.log(e)
                }
            }
        }
        count = count + 1
        // }
    }

    return scansReport;
}


const getMedicalProviderNames = async (content, updatedCompleteRequest, socketService, caseId, userId, injury, count, caseModel, medicalProviderName, preMedicalProviderNames, medicalType, domainName, providers, pageCountBeforeCurrentProvider) => {
    let diagnosis = []
    let providerName = medicalProviderName[count]
    let medicalTypeName = medicalType[count]
    console.log(content.length)
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);

    if (medicalTypeName === "All Other Medical Records") {
        const icdCodesAndDiagonsis = await ProcessPreMedicalIcalIcdCodes(content.join(' '), caseId, userId, domainName)
        diagnosis.push(icdCodesAndDiagonsis)
        await saveChatGptData({ icdCodesRecords: icdCodesAndDiagonsis }, caseModel)
    }

    const chunkedFileText = content


    let lastProviderName = providers.length ? providers.at(-1).name : '';

    if (medicalTypeName === "All Other Medical Records") {
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {

        treatmentDates: [
            { date: 'MM/DD/YYYY', treatmentDescription: 'patient reported bla bla' }
        ]

    }. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
        1.It is a medical record file text of a patient.
    2.Please analyze the text and give a date wise treatment summary of every visit by patient in treatmentDates array of object.
    3.Do not add summary of patient treatment in it.Make sure the treatment dates and description are accurately parsed and treatmentDates should be sorted by date key.
    4.Keep the treatDates array empty.If no treatment date is present in text.Don't add extra dates by outside by yourself please.
    5.Please remove personal details of Patient for example Patient name, age, gender, doctor name.
    6.treatmentDescription should be made and sorted using the dates at which the treatment was done while stating the things which was reported by the patient
     and the things which were done on the treatment of that day. 
     Treatment description should be in paragraph.Description should be less 300 words.  
    8.Please remove dates related to medical history. 
    9.Please ensure that every treatment date follows this structure: 'MM/DD/YYYY'.
    Please provide Only JSON data. Give me the output without any additional text or explanation.
     `;


        let treatmentDates = [];
        let combinedTretmentDates = []
        let objectFindings = [];
        let count = 0;
        for (let i = 0; i < chunkedFileText.length; i++) {
            const findCaseById = await CaseModelTable.findById(caseId)
            if (findCaseById) {
                let chunkedText = chunkedFileText[i];
                chunkedText = chunkedText.replaceAll(',', ' ')
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText});
                const uniqueDates = new Set();
                if (response) {
                    try {
                        let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                        treatmentSummaryDates = treatmentSummaryDates.filter((obj) => {
                            if (!uniqueDates.has(obj.date)) {
                                uniqueDates.add(obj.date);
                                return true;
                            }
                            return false;
                        });
                        treatmentSummaryDates = treatmentSummaryDates.filter(x => !treatmentDates.find(y => y.date === x.date));
                        treatmentSummaryDates = treatmentSummaryDates.map(obj => ({ ...obj, pageNumber: i + pageCountBeforeCurrentProvider + 1 }));
                        treatmentDates = [...treatmentDates, ...treatmentSummaryDates].sort((a, b) => a.date - b.date);
                        if (providerName === lastProviderName) {
                            const lastProviderTreatmentDates = providers.at(-1).treatmentDates;
                            treatmentDates = treatmentDates.filter(x => !lastProviderTreatmentDates.find(y => y.date === x.date));
                            providers.at(-1).treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates].sort((a, b) => a.date - b.date)
                        }
                        if (count === 0) {
                            objectFindings = await procesObjectiveFindings(currentProviderTreatmentSummaryText, caseId, userId, domainName)
                        }
                        count = count + 1
                    }
                    catch {

                    }
                }
            } else {
                return
            }
        }


        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                diagnosis,
                objectFindings,
                medicalTypeName
            });
        }
    }

    if (medicalTypeName === "MRI Other Imaging") {
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {

        treatmentDates: [
            { date: 'MM/DD/YYYY', treatmentDescription: 'patient reported bla bla', findings: ['patient MRI Impression'] }
        ]

    }. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
        1.It is a MRI record file text of a patient, just keep the record of which part of the body MRI was done.
        2.Please provide a chronological single line summary, organized by date, the specific body part or parts subjected to MRI scans during each visit by the patient listed in the 'treatmentDates' array of objects.
        3.Do not add summary of patient treatment in it.Make sure the treatment dates and description are accurately parsed and treatmentDates should be sorted by date key.
        4.Keep the treatDates array empty.If no treatment date is present in text.Don't add extra dates by outside by yourself please.
        5.Please remove personal details of Patient for example Patient name, age, gender, doctor name.
        6.treatmentDescription should be made and sorted using the dates at which the treatment was done while stating the thing Please outline the specific body part(s) examined during the MRI scans for each visit. 
         Treatment description should be in points.Impressions should in details.Do not remove any information of impressions by your self.
        7.Please extract all impressions from the MRI record and place them within the findings array.Note that I'm specifically looking for only the impressions from the MRI report. Please avoid adding any additional information.
        8.Please remove dates related to medical history. 
        9.Please ensure that every treatment date follows this structure: 'MM/DD/YYYY'.
        Please provide Only JSON data. Give me the output without any additional text or explanation.
         `;


        let treatmentDates = [];
        let combinedTretmentDates = []
        let objectFindings = []
        for (let i = 0; i < chunkedFileText.length; i++) {
            const findCaseById = await CaseModelTable.findById(caseId)
            if (findCaseById) {
                let chunkedText = chunkedFileText[i];
                chunkedText = chunkedText.replaceAll(',', ' ')
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText});
                const uniqueDates = new Set();
                if (response) {
                    try {
                        let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                        // treatmentSummaryDates = treatmentSummaryDates.filter((obj) => {
                        //     if (!uniqueDates.has(obj.date)) {
                        //         uniqueDates.add(obj.date);
                        //         return true;
                        //     }
                        //     return false;
                        // });
                        treatmentSummaryDates = treatmentSummaryDates.filter(x => !treatmentDates.find(y => y.date === x.date));
                        treatmentSummaryDates = treatmentSummaryDates.map(obj => ({ ...obj, pageNumber: i + pageCountBeforeCurrentProvider + 1 }));
                        treatmentDates = [...treatmentDates, ...treatmentSummaryDates].sort((a, b) => a.date - b.date);
                        if (providerName === lastProviderName) {
                            const lastProviderTreatmentDates = providers.at(-1).treatmentDates;
                            //  treatmentDates = treatmentDates.filter(x => !lastProviderTreatmentDates.find(y => y.date === x.date));
                            providers.at(-1).treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates].sort((a, b) => a.date - b.date)
                        }

                    }
                    catch {

                    }
                }

                //    objectFindings = await procesObjectiveFindings(currentProviderTreatmentSummaryText, caseId, userId)
            } else {
                return
            }
        }

        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                diagnosis,
                objectFindings,
                medicalTypeName
            });
        }
    }

    if (medicalTypeName === "Surgery Center Reports") {
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {

        treatmentDates: [
            {
                date: 'MM/DD/YYYY',
                treatmentDescription: 'Patient reported bla bla.',
                Surgeon: 'Surgeon's name or attendant's name',
                procedures: 'What procedure was done.'
            }
        ]


    }. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
        1.It is a Surgery record file text of a patient, just keep the record of which Surgery was done.
        2.Please provide a chronological single line summary, organized by date, the specific body part or parts subjected to Surgery scans during each visit by the patient listed in the 'treatmentDates' array of objects.
        3.Do not add summary of patient treatment in it.Make sure the treatment dates and description are accurately parsed and treatmentDates should be sorted by date key.
        4.Keep the treatDates array empty.If no treatment date is present in text.Don't add extra dates by outside by yourself please.
    5.Please remove personal details of Patient for example Patient name, age, gender, doctor name.
        6.treatmentDescription should be made and sorted using the dates at which the treatment was done while stating the thing Please outline the specific body part(s) examined during the Surgery scans for each visit. 
         Treatment description should be in paragraph.Description should be less 50 words.  
        7.please write detailed summary of procedures from the Surgery record and place them within the 'procedures' field.I'm specifically looking for only the procedures from the Surgery report. Please refrain from adding any additional information.
    8.Please extract the surgeon's name or attendant's name, if available.Ensure that only one name is extracted, giving priority to the surgeon's name. Place the extracted name under 'Surgeon' 
    9.Please remove dates related to medical history. 
        10.Please ensure that every treatment date follows this structure: 'MM/DD/YYYY'.
        Please provide Only JSON data. Give me the output without any additional text or explanation.
         `;


        let treatmentDates = [];
        let combinedTretmentDates = []
        let objectFindings = []

        for (let i = 0; i < chunkedFileText.length; i++) {
            const findCaseById = await CaseModelTable.findById(caseId)
            if (findCaseById) {
                let chunkedText = chunkedFileText[i];
                chunkedText = chunkedText.replaceAll(',', ' ')
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText});
                const uniqueDates = new Set();
                if (response) {
                    try {
                        let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                        treatmentSummaryDates = treatmentSummaryDates.filter((obj) => {
                            if (!uniqueDates.has(obj.date)) {
                                uniqueDates.add(obj.date);
                                return true;
                            }
                            return false;
                        });
                        treatmentSummaryDates = treatmentSummaryDates.filter(x => !treatmentDates.find(y => y.date === x.date));
                        treatmentSummaryDates = treatmentSummaryDates.map(obj => ({ ...obj, pageNumber: i + pageCountBeforeCurrentProvider + 1 }));
                        treatmentDates = [...treatmentDates, ...treatmentSummaryDates].sort((a, b) => a.date - b.date);
                        if (providerName === lastProviderName) {
                            const lastProviderTreatmentDates = providers.at(-1).treatmentDates;
                            treatmentDates = treatmentDates.filter(x => !lastProviderTreatmentDates.find(y => y.date === x.date));
                            providers.at(-1).treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates].sort((a, b) => a.date - b.date)
                        }
                        //console.log(providers)
                    }
                    catch {

                    }
                }

                objectFindings = await procesObjectiveFindings(currentProviderTreatmentSummaryText, caseId, userId, domainName)
            } else {
                return
            }
        }

        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                diagnosis,
                objectFindings,
                medicalTypeName
            });
        }
    }

    if (medicalTypeName === "ER") {

        const ocrTextLimit = 20000;
        const chunkedFileText1 = splitStringIntoChunks(content, ocrTextLimit);
        console.log(content.length)
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {
            "treatmentDates": [
                {
                    admittedDate: "MM/DD/YYYY",
                    dischargedDate: "MM/DD/YYYY",
                    chiefComplaint: "",
                    impression: "",
                    historyOfPresentIllness: "",
                    pastMedicalHistory: "",
                    pastSurgicalHistory: "",
                    planRecommendation: [],
                    diagnoses: []
                }
            ]
        }. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
            1.It is a ER record file text of a patient.Please Extract Admitted and decharged date from ER Report.
            2.Please extract the Chief Complaint: from the ER report. Do not add Chief complaint Quote it should only be Chief Complaint if available.
            3.Please extract the Impression / ED Plan from the ER report and make short paragraph out of it. 
            4.Please extract the History of Present Illness form the ER report. 
            5.Please extract the Past Medcial History from the ER report. 
            6.Please extract the Past Surgical History from the ER rport. 
            9.Please provide Diagnoses of patient and diagnoses findings should be in points dot not include any kind of ICD Codes.
            10.Please provide detailed summary of ER report.
            Please provide Only JSON data. Give me the output without any additional text or explanation.
            `;

        let treatmentDates = [];
        for (let i = 0; i < chunkedFileText.length; i++) {
            const findCaseById = await CaseModelTable.findById(caseId)
            if (findCaseById) {
                let chunkedText = chunkedFileText[i];
                chunkedText = chunkedText.replaceAll(',', ' ')
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText});
                if (response) {
                    try {
                        let treatmentSummaryDates = JSON.parse(response).treatmentDates;

                        treatmentSummaryDates = treatmentSummaryDates.filter(x => !treatmentDates.find(y => y.date === x.date));
                        //treatmentSummaryDates = treatmentSummaryDates.map(obj => ({ ...obj, pageNumber: i+pageCountBeforeCurrentProvider+1 }));
                        treatmentDates = [...treatmentDates, ...treatmentSummaryDates].sort((a, b) => a.date - b.date);

                        if (providerName === lastProviderName) {
                            const lastProviderTreatmentDates = providers.at(-1).treatmentDates;
                            providers.at(-1).treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates].sort((a, b) => a.date - b.date)
                        }
                    }
                    catch (e) {
                        console.log(e)
                    }
                }

            } else {
                return
            }
        }

        const imagingData = await getImagingDetails(chunkedFileText1, caseId, userId)
        const physicalExaminationData = await getSystemAndPhysicalExamData(chunkedFileText1, caseId, userId)
        const planRecommendation = await getPlanAndRecommendationData(chunkedFileText1, caseId, userId);

        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                medicalTypeName,
                imagingData,
                physicalExaminationData,
                planRecommendation
            });
        }
    }

    if (medicalTypeName === "Hospital") {

        const ocrTextLimit = 40000;
        const chunkedFileText = splitStringIntoChunks(content, ocrTextLimit);
        console.log(content.length)
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like.        
        {
            "treatmentDates": [
                {
                    "admittedDate": "MM/DD/YYYY",
                    "dischargedDate": "MM/DD/YYYY",
                    "chiefComplaint": "",
                    "typeOfService": ["date": "","service": ""],
                    "historyOfPresentIllness": [],
                    "pastMedicalHistory": [],
                    "pastSurgicalHistory": [],
                    "diagnoses": [],
                    "systemPhysicalExam": [],
                    "imagingData": [
                        {
                            "imagingName": "Scan name should be here",
                            "scanType": "Type of Scan",
                            "imagingImpression": [
                                "impression should insert here"
                            ],
                            "duplicate": ""
                        }
                    ],
                    "planRecommendation": [""],
                    "patientComplaint":[""],
                    "painLevel":[""],

                }
            ]
        }
        Please provide a JSON object in its pure form, with correct syntax and without any additional comments or explanations. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
        1.It is a Hospital record file text of a patient. 
        2.Please Extract Admitted and discharged date from Hospital Report.
        4.Extract date wise the "Chief Complaint:/CC" from the Hospital report. Do not add Chief complaint Quote it should only be Chief Complaint if available. Only add Chief Complaint do not add anything by yourself.
        5.Please extract, by date, the date of visit and type of service from the given keywords: 'EMERGENCY DEPARTMENT PROVIDER NOTES'. 
          Determine the date of service and type of service/specialty provided for each visit. 
          Keep the data in the format: 'typeOfService': [{'date': '', 'service': ''}]. 
          Ensure there is only one entry per request, dates are unique, and each service name is singular, relating to services like Surgery, Emergency Room, Therapy, etc. 
          Remove data from following keyword 'Admission Information', 'Visit Information', 'Admission Type','DISCHARGE SUMMARY NOTES' and 'Hospital Service'. 
          Only provide the relevant information without adding any additional comments or quotes. 
          If either piece of information is not available, leave that part blank.
        6.Extract date wise the "History of Present Illness" / "HPI" / "HISTORY And PHYSICAL NOTES" from the Hospital report and make a detailed summary out of it.
        7.Extract date wise the "Past Medical History" from the Hospital report. If medical history is not available then return ["NA"]. 
        8.Extract date wise the "Past Surgical History" from the Hospital report. If Surgical history is not available then return ["NA"].
        9.Extract date wise the positive symptoms of diseases mentioned in the 'Review of Systems' section of the patient's hospital record file. Ignore any negative symptoms of diseases and provide a summary of the positive findings. Place the findings in the "systemPhysicalExam" array.
        10.Please ignore information such as Physical Exam, First Vitals, Imaging, and Impressions. Do not add any unrelated Data by yourself. Try to make the paragraph short and simple but informative.  
        11.Extract date wise in-depth details of the type of scan done, including the "radiology name" and "impressions" from CT scans, X-rays, or MRIs containing the keywords "CT scan," "X-ray," or "MRI." Insert the area imaged in "imagingName." Do not include any duplicate imaging entries.
        12.List impressions in bullet points under "imagingImpressions." Do not include any duplicate imaging impressions from the ER.
        13.Exclude the procedure provider, window settings, or findings unrelated to CT scans, X-rays, or MRIs.
        14.If there are no relevant findings, return "No findings." Do not include other details.
        15.Identify the type of scan conducted and insert the scan type into "scanType."
        16.Only include one "imagingName" entry at a time; do not combine multiple names into one entry.
        17.If there are no related CT scans, X-rays, or MRIs, leave those array fields blank rather than adding unwanted data.
        18.If there is a radiology name but no associated impressions, do not include that entry.
        19.Only extract the impressions from the relevant imaging scans. Do not include other findings with the impressions.
        20.Remove any duplicate CT scan, X-ray, or MRI entries to ensure each imaging entry is unique.
        21.Summarize the patient's "Diagnoses","Assessment" and "Assessment and plan" of the patient and diagnoses findings should be in points dot not include any kind of ICD Codes. If Diagnoses is not found then return ["NA"].    
        22.Please review the hospital record file text of a patient. Extract the plan and Recommendation summary from the Emergency Room Report. Summary should contain how the patient was brought.
        23.Remove information such as ED Course, Diagnosis, History of Present Illness, Imaging, Impressions, Findings, and Imaging Results.
        24.Do not include information about Radiologies.
        25.If there is any prescription, do not include it.
        26.Ensure that patient personal information such as Name, Age, Phone Number, and Email are removed from the output.
        27.Don't add admit date and discharge date and summary.
        28.Who was the doctor/surgeon/ Attendant and what was their recommendations but in this do not include patient details and history of illness.
        29.All findings should be in points.
        30.Summarize date wise the patient's complaints during their hospital visits into a short but informative paragraph and place it in the 'patientComplaint' array. If there were no complaints, return ['NA'].
        31.Summarize date wise the patient's Pain Level during their visits to hospital and place it the 'painLevel' array. If there were no pain level found then return ["NA"].
        Please provide Only JSON data. Give me the output without any additional text or explanation.
        `


        let treatmentDates = [];
        for (let i = 0; i < chunkedFileText.length; i++) {
            const findCaseById = await CaseModelTable.findById(caseId)
            if (findCaseById) {
                let chunkedText = chunkedFileText[i];
                chunkedText = chunkedText.replaceAll(',', ' ')
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText});
                if (response) {
                    //console.log(response)
                    try {
                        let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                        //treatmentSummaryDates = treatmentSummaryDates.map(obj => ({ ...obj, pageNumber: i+pageCountBeforeCurrentProvider+1 }));
                        treatmentDates.push(treatmentSummaryDates)
                        // treatmentDates = [...treatmentDates, ...treatmentSummaryDates]

                        if (providerName === lastProviderName) {
                            const lastProviderTreatmentDates = providers.at(-1).treatmentDates;
                            providers.at(-1).treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates]
                        }
                    }
                    catch (e) {
                        console.log(e)
                    }
                }

            } else {
                return
            }
        }

        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                medicalTypeName,
            });
        }
    }

    if (medicalTypeName === "Consultation Reports") {

        console.log("getting medical providers for consultation reports for premedical records")
        const ocrTextLimit = 100000;
        const chunkedFileText = splitStringIntoChunks(content, ocrTextLimit);
        console.log(content.length)
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like.        
        {
            "treatmentDates": [
                {
                    "diagonis":[],
                    "causation":[],
                    "historyOfInjury":[],
                    "pastMedicalHistory": [],
                    "pastSurgicalHistory": [],
                    "imagingData": [
                        {
                            "imagingName": "Scan name should be here",
                            "scanType": "Type of Scan",
                            "imagingImpression": [
                                "impression should insert here"
                            ],
                            "duplicate": ""
                        }
                    ],
                    treatmentSummary: [
                        { date: 'MM/DD/YYYY', treatmentDescription: 'patient reported bla bla',physicalExamination:[],PlanDiscussion:[] }
                    ]
                }
            ]
        }
        Please provide a JSON object in its pure form, with correct syntax and without any additional comments or explanations. Text to analyze is in this curly bracket { CHUNKED_FILE_TEXT } Notes for the response : -
        1.It is Consultation Reports file text of a patient. 
        Remove "Interval History" from summary.
        2.Extract the diagnoses from the following consultation report and present them in a list format. Each diagnosis should be a separate bullet point. Only include the diagnoses and do not include any other details and store them in a 'diagonis' array.
        3.Look for the keyword 'causation' and extract information from the consultation report. Make sure to use language present in the consultation report. Identify and list the underlying causes or factors contributing to the patient's current condition or symptoms. Present each cause in bullet point format and store them in a 'causation' array. Remove "History of injury" and do not include the date of the accident. Ensure the data is unique, with no repetitive entries. If no findings of causation are present, return 'NA' in the array.
        4. Analyze the consultation report, look for historyOfInjury, and provide a short summary. Store the historyOfInjury array. If historyOfInjury is not found, return [" "] instead. Exclude Interval History from the summary; do not include Interval History in the summary.
        5.Summerize "Past Medical History" from the Consultation Reports. If medical history is not available then return ["NA"]. 
        6.Summerize "Past Surgical History" from the Consultation Reports. If Surgical history is not available then return ["NA"].
        7.Extract date wise in-depth details of the type of scan done, including the "radiology name" and "impressions" from CT scans, X-rays, or MRIs containing the keywords "CT scan," "X-ray," or "MRI." Insert the area imaged in "imagingName." Do not include any duplicate imaging entries.
        8.List impressions in bullet points under "imagingImpressions." Do not include any duplicate imaging impressions from the ER.
        9.Exclude the procedure provider, window settings, or findings unrelated to CT scans, X-rays, or MRIs.
        10.If there are no relevant findings, return "No findings." Do not include other details.
        11.Identify the type of scan conducted and insert the scan type into "scanType."
        12.Only include one "imagingName" entry at a time; do not combine multiple names into one entry.
        13.If there are no related CT scans, X-rays, or MRIs, leave those array fields blank rather than adding unwanted data.
        14.If there is a radiology name but no associated impressions, do not include that entry.
        15.Only extract the impressions from the relevant imaging scans. Do not include other findings with the impressions.
        16.Remove any duplicate CT scan, X-ray, or MRI entries to ensure each imaging entry is unique.
        17.Extract date-wise physical examinations of the patient and store them in Physical Examination. Ensure that all findings are positive, removing any negative and normal findings. Avoid duplicate entries, and ensure each paragraph does not exceed 100 words.
        18.Extract date wise plan/Discussion of patient and store it PlanDiscussion array. All fingdings should be in points.

        Please provide Only JSON data. Give me the output without any additional text or explanation.
        `

        let treatmentDates = [];
        for (let i = 0; i < chunkedFileText.length; i++) {
            const findCaseById = await CaseModelTable.findById(caseId)
            if (findCaseById) {
                let chunkedText = chunkedFileText[i];
                chunkedText = chunkedText.replaceAll(',', ' ')
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText});
                if (response) {
                    //console.log(response)
                    try {
                        let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                        //treatmentSummaryDates = treatmentSummaryDates.map(obj => ({ ...obj, pageNumber: i+pageCountBeforeCurrentProvider+1 }));
                        treatmentDates.push(treatmentSummaryDates)
                        // treatmentDates = [...treatmentDates, ...treatmentSummaryDates]

                        if (providerName === lastProviderName) {
                            const lastProviderTreatmentDates = providers.at(-1).treatmentDates;
                            providers.at(-1).treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates]
                        }
                    }
                    catch (e) {
                        console.log(e)
                    }
                }

            } else {
                return
            }
        }

        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                medicalTypeName,
            });
        }
    }

    return providers;
}


//This function is for testing porpose only
const testFunction = async () => {
    try {
        const text = chatGpt.data;
        // const chunkedData = await splitStringIntoChunks(text, 20000);
        // let providerNames = [];

        // const onProviderAdded = async (providers) => {
        //     providerNames = [...providerNames, ...providers];
        // }

        // await Promise.all(chunkedData.map(async (x) => {
        //     return await convertPDFToImages(x, onProviderAdded);
        // }));

        // const data = providerNames; // Assuming providerNames is the data you want to process

        // await getMedicalProviderNames(text);
    } catch (error) {
        //  throw error;
    }


    // await processData(data)
}

module.exports = {
    processandPreMedicalRecordsChatGptService,
    // ProcessMedicalIcalIcdCodes1,
    ProcessPreMedicalIcalIcdCodes,
    testFunction
}