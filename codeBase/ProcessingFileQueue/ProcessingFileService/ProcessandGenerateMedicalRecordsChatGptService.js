const { chatGpt } = require("../Contant");
const { processAi } = require("./ChatGptPdfProcessor");
const { saveChatGptData } = require("./SaveChatGptResponse");
const CaseSchema = require('../src/db/models/Case')
const mongoose = require("mongoose");
const { saveErrorLog } = require('./SaveChatGptResponse');
const Constants = require("../Contant");

const ProcessMedicalIcalIcdCodes = async (content, caseId, userId, domainName) => {
    try {
        //  throw new Error('Simulated error');
        console.log("inside processMedicalIcdCodes")
        let icdCodesChatGptResponse = [];
        let IcdCodesObject;
        let getIcdCodes = content
        let pattern = /[A-Z][0-9]{2}\.[0-9A-Z]{1,4}/g;
        let icdCodes = getIcdCodes?.match(pattern);
        console.log("icdCodes matched with regex")

        let removeDuplicateIcdCodes = [... new Set(icdCodes)]
        const removeNotFoundIcdCodes = await notFoundIcdCodes(content, removeDuplicateIcdCodes)
        let uniqueIcdCodes = [... new Set(removeNotFoundIcdCodes)]
        console.log("Icd code unique list built")
        let promtp = `Please provide the corresponding diseases for the given ICD-10 codes: ${uniqueIcdCodes}.
     Please provide only codes and their corressponding diease name. Give me the output without any additional text or explanation.`

        if (icdCodes) {
            console.log("before processAI call")
            const reponse = await processAi({content: promtp});
            console.log("after processAI call")
            icdCodesChatGptResponse = reponse.replace(/ICD-10-CM/g, " ")
            const icdCodePattern = /[A-Z][0-9]{2}\.[0-9A-Z]{1,4}/g
            const icdCodesResp = icdCodesChatGptResponse.match(icdCodePattern);
            const disease = icdCodesChatGptResponse.replace(/[A-Z][0-9]{2}\.[0-9A-Z]{1,4}/g, '')
            const repmoveSpecialCharacter = disease?.replace(/\-/g, '')
            const diseaseName = repmoveSpecialCharacter?.split('\n')
            IcdCodesObject = { key: icdCodesResp, values: diseaseName }
            console.log("after a bunch of regex matching and replacing for Icd codes")
            return IcdCodesObject
        } else {
            console.log('No IcdCodes found in this file')
            const { dieaseNameChatGptReponse, icdCodesChatGptResponse } = await getIcdCodesFromDiagonsisName(content, IcdCodesObject, caseId, userId, domainName)
            console.log("after get Icd codes from diagnosis name")
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
        if (content.includes(IcdCodes[i])) {
            newIcdCodes.push(IcdCodes[i])
        } else {
            console.log('Not found')
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
        dieaseNameChatGptReponse = [...dieaseNameChatGptReponse, ...reponse].join('').replace(/[1-9].|10/g, " ")
        console.log(dieaseNameChatGptReponse)
        index += chunkSize
    }
    const prompt = `Following are diagonsis name :- ${dieaseNameChatGptReponse},
    Based on diagnosis name please find ICD-10 codes.Please provide ICD Code only. remove diagonsis name provide ICD-10 codes. Give me the output without any additional text or explanation.`
    const reponse = await processAi({content: prompt})
    icdCodesChatGptResponse = [...icdCodesChatGptResponse, ...reponse].join('').replace(/ICD-10-CM/g, " ")
    console.log(icdCodesChatGptResponse)
    return { dieaseNameChatGptReponse, icdCodesChatGptResponse };
}

const processandGenerateMedicalRecordsChatGptService = async (content, updatedCompleteRequest, socketService, caseId, userId, injury, count, caseModel, medicalProviderName, medicalProvderCount, medicalType, domainName, providers, pageCountBeforeCurrentProvider) => {
    try {
        const mediCalResponse = await getMedicalProviderNames(content, updatedCompleteRequest, socketService, caseId, userId, injury, count, caseModel, medicalProviderName, medicalProvderCount, medicalType, domainName, providers, pageCountBeforeCurrentProvider);
        //console.log("mediCalResponse is:", JSON.stringify(mediCalResponse, null, 2));
        count = count + 1
        if (count === medicalProvderCount) {
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

const splitArrayIntoChunks = (stringArray, maxChunkSize, overlap = 0) => {
    try {
        const chunks = [];
        let currentChunk = [];
        let currentChunkSize = 0;
        let lastOverlapItems = [];

        for (let i = 0; i < stringArray.length; i++) {
            const str = stringArray[i];

            // If adding this string would exceed the chunk size,
            // save the current chunk and start a new one
            if (currentChunkSize + str.length > maxChunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));

                // Store the last 'overlap' number of items for the next chunk
                lastOverlapItems = currentChunk.slice(-overlap);

                // Start new chunk with overlap items
                currentChunk = [...lastOverlapItems];
                currentChunkSize = lastOverlapItems.reduce((sum, item) => sum + item.length, 0);
            }

            // If a single string is larger than the chunk size,
            // it gets its own chunk
            if (str.length > maxChunkSize) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.join(' '));
                    lastOverlapItems = currentChunk.slice(-overlap);
                    currentChunk = [...lastOverlapItems];
                    currentChunkSize = lastOverlapItems.reduce((sum, item) => sum + item.length, 0);
                }
                chunks.push(str);
                lastOverlapItems = overlap > 0 ? [str] : [];
                currentChunk = [...lastOverlapItems];
                currentChunkSize = lastOverlapItems.reduce((sum, item) => sum + item.length, 0);
                continue;
            }

            // Add the string to the current chunk
            currentChunk.push(str);
            currentChunkSize += str.length;
        }

        // Don't forget to add the last chunk if it has any strings
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }

        return chunks;
    } catch (e) {
        return [];
    }
}


const getPlanAndRecommendationData = async (chunkedFileText1, caseId, userId, domainName) => {
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);

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
    const findCaseById = await CaseModelTable.findById(caseId)
    if (findCaseById) {
        for (let i = 0; i < chunkedFileText1.length; i++) {
            let chunkedText = chunkedFileText1[i];
            //chunkedText = chunkedText.replaceAll(',', ' ')
            const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
            const response = await processAi({content: currentProviderTreatmentSummaryText, jsonValidator: true});
            if (response) {
                try {
                    let treatmentSummaryDates = JSON.parse(response).treatmentDates;
                    recommendations = [...recommendations, ...treatmentSummaryDates]

                } catch (e) {
                    console.log(e)
                }
            }
        }
        // count = count + 1
        // }
    }

    return recommendations;

}

const getImagingDetails = async (chunkedFileText1, caseId, userId, domainName) => {
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);

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
    3. Exclude the procedure provider, window settings, or findings unrelated to CT scans, X-rays, or MRIs.
    4. Try to copy the image findings directly from the medical record. If there are no relevant findings, return "No findings". Do not include other details.
    5. Identify the type of scan conducted and insert the scan type into "scanType".
    6. Only include one "imagingName" entry at a time; do not combine multiple names into one entry.
    7. If there are no related CT scans, X-rays, or MRIs, leave those array fields blank rather than adding unwanted data.
    8. If there is a radiology name but no associated impressions, do not include that entry.
    9. Only extract the impressions from the relevant imaging scans. Do not include other findings with the impressions.
    10. Remove any duplicate CT scans, X-rays, or MRIs, entries to ensure each imaging entry is unique.
    Please provide Only JSON data. Give me the output without any additional text or explanation.
    `
    let scansReport = []
    let count = 0;
    for (let i = 0; i < chunkedFileText1.length; i++) {
        const DbConnect = mongoose.connection.useDb(domainName);
        const CaseModelTable = DbConnect.model("cases", CaseSchema);
        const findCaseById = await CaseModelTable.findById(caseId)
        if (findCaseById) {
            let chunkedText = chunkedFileText1[i];
            //chunkedText = chunkedText.replaceAll(',', ' ')
            const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
            const response = await processAi({content: currentProviderTreatmentSummaryText, jsonValidator: true});
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

const getSystemAndPhysicalExamData = async (chunkedFileText1, caseId, userId, domainName) => {

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
        const DbConnect = mongoose.connection.useDb(domainName);
        const CaseModelTable = DbConnect.model("cases", CaseSchema);
        const findCaseById = await CaseModelTable.findById(caseId)
        if (findCaseById) {
            let chunkedText = chunkedFileText1[i];
            //chunkedText = chunkedText.replaceAll(',', ' ')
            const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
            const response = await processAi({content: currentProviderTreatmentSummaryText, jsonValidator: true});
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

const procesObjectiveFindings = async (text, caseId, userId, domainName) => {
    const objectiveFindingsPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like 
    
    {
        objectiveFindings: "short detailed paragraph on objective findings"
    }
    
    Text to analyze is in this curly bracket {CHUNKED_FILE_TEXT} Notes for the response :- 
    1.This is the medical record text of the patient.
    2. Please analyse it and provide a patient report with a short paragraph of objective findings.
    3. Please maintain the order as follows: Objective.
    4. It should be only one paragraph.
    5. Please remove patient's personal info like name, age, address and other personal stuff.
    Please provide Only JSON data. Give me the output without any additional text or explanation.
    .`

    const currentProviderObjectiveText = objectiveFindingsPrompt.replace("CHUNKED_FILE_TEXT", text);
    const response = await processAi({content: currentProviderObjectiveText, jsonValidator: true, thinking: false});
    try {
        const parsedResponse = JSON.parse(response);

        return parsedResponse.objectiveFindings ? parsedResponse.objectiveFindings : "No-data"
    }
    catch (e) {
        console.log(e)
    }
}

const getMedicalProviderNames = async (content, updatedCompleteRequest, socketService, caseId, userId, injury, count, caseModel, medicalProviderName, medicalProvderCount, medicalType, domainName, providers, pageCountBeforeCurrentProvider) => {
    console.log("inside getMediclaProviderNames")
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);
    const numPagesForChunkOverlap = 1
    let diagnosis = []
    let providerName = medicalProviderName[count]
    let medicalTypeName = medicalType[count];
    const genericTextChunkSize = Constants.chunkSize[medicalTypeName] || 100000;
    const Case = DbConnect.model("cases", CaseSchema);
    const caseData = await Case.findById(caseId).lean();
    const userData = caseData?.detailsInput || "";
    const accidentDate = userData.liability?.date


    // if (medicalTypeName === "All Other Medical Records") {
    //     console.log("inside All Other Medical Records")
    //     const icdCodesAndDiagonsis = await ProcessMedicalIcalIcdCodes(content.join(' '), caseId, userId, domainName)
    //     console.log("processed Medical ICD codes")
    //     diagnosis.push(icdCodesAndDiagonsis)
    //     await saveChatGptData({ icdCodesRecords: icdCodesAndDiagonsis }, caseModel, domainName)
    //     console.log("received ")
    // }

    const annotateContent = (content, pageCountBeforeCurrentProvider) => {
        const instructions = "A series of medical records are appended into a large singular combined file. These records may contain page numbers referencing the original document but these are no longer relevant. Ignore these page numbers and use the \"Contents of page ...\" and \"END OF PAGE ...\"language to derive an accurate page number of the entire combined record.";

        return [
            instructions,
            ...content.map((item, index) =>
                `Contents of page ${index + 1 + pageCountBeforeCurrentProvider}: ${item} END OF PAGE ${index + 1 + pageCountBeforeCurrentProvider}`
            )
        ];
    }

    const annotated_content = annotateContent(content, pageCountBeforeCurrentProvider);

    const chunkedFileText = splitArrayIntoChunks(annotated_content, genericTextChunkSize, numPagesForChunkOverlap)
    console.log("text split into chunks");
    //console.log(JSON.stringify(chunkedFileText, null, 2));


    let lastProviderName = providers.length ? providers.at(-1).name : '';

    if (medicalTypeName === "All Other Medical Records") {
        console.log("inside All Other Medical Records")
        
        // Check if case exists early to avoid unnecessary work
        const findCaseById = await CaseModelTable.findById(caseId);
        if (!findCaseById) {
            console.log("couldn't find case by ID");
            return;
        }
    
        // Define a prompt for processing individual chunks independently
        const chunkProcessingPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like {
            "treatmentDates":[
                {"date": "MM/DD/YYYY", "treatmentDescription": "patient reported bla bla", "pageNumber": N}
            ]
        }.
        
        You are a medical analysis assistant parsing medical records of a patient and formatting information into JSON objects.
        
        Here is a chunk of the medical record:
        
        {CHUNKED_FILE_TEXT}
        
        Notes for the response :- 
        1. It is a medical record file text of a patient.
        2. Analyze the text and give a date wise treatment summary of every visit by patient in treatmentDates array of object.
        3. Find the date of the medical record text.
        4. Make sure all dates are unique, do not create multiple objects for the same date
        5. Do not add summary of patient treatment in it. Make sure the treatment dates and description are accurately parsed and treatmentDates should be sorted by date key.
        6. Remove personal details of Patient for example Patient name, age, gender, doctor name.
        7. treatmentDescription should be made and sorted using the dates at which the treatment was done while stating the things which was reported by the patient
           and the things which were done on the treatment of that day. 
           Treatment description should be in paragraph. Description should be less 300 words. Do not include any intro or explanation, only include content from the medical record.
        8. Remove dates related to medical history. 
        9. Ensure that every treatment date follows this structure: 'MM/DD/YYYY'.
        10. Include the page number in each object in treatmentDates.
        11. Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information.
        Please provide Only JSON data. Give me the output without any additional text or explanation.`;
    
        // Start objective findings extraction in parallel
        const objectiveFindingsPromise = procesObjectiveFindings(chunkedFileText[0], caseId, userId, domainName);
    
        // Process each chunk in parallel
        console.log("Starting parallel processing of chunks");
        const chunkPromises = chunkedFileText.map(async (chunk, index) => {
            try {
                const chunkPrompt = chunkProcessingPrompt.replace("{CHUNKED_FILE_TEXT}", chunk);
                const response = await processAi({content: chunkPrompt, jsonValidator: true});
                console.log(`Processed chunk ${index+1}/${chunkedFileText.length}`);
                return JSON.parse(response).treatmentDates || [];
            } catch (error) {
                console.error(`Error processing chunk ${index}:`, error);
                return []; // Return empty array for failed chunks
            }
        });
    
        // Wait for all chunks to be processed
        const chunkResults = await Promise.all(chunkPromises);
        console.log("All chunks processed");
    
        // Flatten the results array
        const allTreatmentDates = chunkResults.flat();
    
        // If no treatment dates found, create an empty array
        let treatmentDates = [];
        
        if (allTreatmentDates.length > 0) {
            // Define a prompt to combine and deduplicate the results
            const combinationPrompt = `You are a medical analysis assistant. 
            I have processed multiple chunks of a medical record and extracted treatment dates and descriptions.
            Now I need you to combine these results, removing duplicates and merging information when the same date appears multiple times.
            
            Here are the extracted treatment dates:
            ${JSON.stringify(allTreatmentDates, null, 2)}
            
            Please provide a JSON object with the following structure:
            {
                "treatmentDates": [
                    {"date": "MM/DD/YYYY", "treatmentDescription": "combined description...", "pageNumber": N}
                ]
            }
            
            Follow these rules:
            1. If the same date appears multiple times, combine the descriptions intelligently to avoid repetition
            2. Sort the treatmentDates array by date
            3. For dates that appear in multiple chunks, use the earliest page number
            4. Ensure treatment descriptions are comprehensive but not repetitive
            5. If a description is repetitive, summarize it.
            
            Provide Only JSON data without any additional text or explanation.`;
    
            // Process the combination
            console.log("Combining and deduplicating treatment dates");
            const combinedResponse = await processAi({content: combinationPrompt, thinking: true, jsonValidator: true});
            treatmentDates = JSON.parse(combinedResponse).treatmentDates;
            console.log("Combined and deduplicated treatment dates");
        } else {
            console.log("No treatment dates found in the medical records");
        }
    
        // Wait for objective findings to complete
        console.log("Waiting for objective findings extraction");
        const objectFindings = await objectiveFindingsPromise;
        console.log("Objective findings extraction complete");
    
        // Continue with provider processing
        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                diagnosis,
                objectFindings,
                medicalTypeName
            });
        } else {
            //If document applies to a previous provider, we must combine treatmentDates objects and deduplicate dates while preserving information
            let lastProviderTreatmentDates = providers.at(-1)?.treatmentDates;
            treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates];
            const uniqueDatesMap = new Map();
    
            treatmentDates.forEach(item => {
                if (uniqueDatesMap.has(item.date)) {
                    // If the date already exists, concatenate the descriptions
                    const existingItem = uniqueDatesMap.get(item.date);
                    existingItem.treatmentDescription += `, ${item.treatmentDescription}`; 
                } else {
                    // If it's a new date, add it to the Map
                    uniqueDatesMap.set(item.date, { ...item });
                }
            });
            // Convert the Map back to an array
            treatmentDates = Array.from(uniqueDatesMap.values());
            //we should better combine dates from separate documents representing the same provider
            providers.at(-1).treatmentDates = treatmentDates.sort((a, b) => a.date - b.date);
        }
        console.log("Done with all other medical records");
    }

    if (medicalTypeName === "MRI Other Imaging") {
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like {
    
            "treatmentDates":[
                {"date": "MM/DD/YYYY", "pageNumber": N, "treatmentDescription": "patient reported bla bla", "findings":["patient MRI Impression"]}
            ]
    
        }.
    
        You are a medical analysis assistant parsing medical records of a patient and formatting information into JSON objects.
    
        Here is the next page of the medical record:
        
        {CHUNKED_FILE_TEXT}
        
        Notes for the response :- 
        1. This is a MRI record file text of a patient, just keep the record of which part of the body MRI was done.
        2. Provide a chronological single line summary, organized by date, the specific body part or parts subjected to MRI scans during each visit by the patient listed in the 'treatmentDates' array of objects.
        3. Do not add summary of patient treatment in it. Make sure the treatment dates and description are accurately parsed and treatmentDates should be sorted by date key.
        4. Keep the treatDates array empty. If no treatment date is present in text. Don't add extra dates by outside by yourself please.
        5. Remove personal details of Patient for example Patient name , age ,gender,doctor name.
        6. treatmentDescription should be made and sorted using the dates at which the treatment was done while stating the thing Please outline the specific body part(s) examined during the MRI scans for each visit. 
         Treatment description should be in points. Impressions should in details. Do not remove any information of impressions by your self.
        7. Extract all impressions from the MRI record and place them within the findings array. Note that I'm specifically looking for only the impressions from the MRI report. Please avoid adding any additional information. Do not create a numbered list, do not include a number prefix for each string in the findings section, even if one is included in the record.
        8. Remove dates related to medical history. 
        9. Ensure that every treatment date follows this structure: 'MM/DD/YYYY'.
        10. Find the date of the medical record text. Update exisitng objects in the treatmentDates array if information in the medical record describes an existing treatment. 
            NOTE: Some treatments occur on the same day but are a different procedure with differnt records and information. These would still require their own treatmentDates object with a separate pageNumber, treatmentDescription, and findings. 
            Make sure to update the proper treatmentDates object by matching "date" and "treatmentDescription" in these cases
        11. Include the page number in each object in treatmentDates, if you are updating an exisitng object use the earliest page number of the treatment date.
        12. Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information. 
        Please provide Only JSON data. Give me the output without any additional text or explanation.
         `;
    
        const combineMRIResultsPrompt = `Combine these MRI record results from different chunks of the same document into a unified JSON result.
        These chunks may have overlapping information - please remove duplicate entries while preserving all unique information.
        For treatments on the same date but for different procedures, keep them as separate entries.
        Sort all treatmentDates by date.
        Output in the format: 
        {
            "treatmentDates": [
                {"date": "MM/DD/YYYY", "pageNumber": N, "treatmentDescription": "patient reported bla bla", "findings":["patient MRI Impression"]}
            ]
        }
    
        Input data: {CHUNK_RESULTS}
        
        Please provide Only JSON data. Give me the output without any additional text or explanation.`;
    
        const findCaseById = await CaseModelTable.findById(caseId);
        if (!findCaseById) {
            console.log("couldn't find case by ID");
            return;
        }
    
        // Process all chunks in parallel
        const chunkPromises = chunkedFileText.map(async (chunkedText, index) => {
            const currentPrompt = treatmentSummaryPrompt.replace("{CHUNKED_FILE_TEXT}", chunkedText);
            const response = await processAi({content: currentPrompt, jsonValidator: true});
            try {
                return JSON.parse(response).treatmentDates || [];
            } catch (e) {
                console.log("Error parsing JSON from chunk", index, e);
                return [];
            }
        });
    
        // Wait for all chunks to complete
        const allChunkResults = await Promise.all(chunkPromises);
        
        // Combine all treatment dates from all chunks
        const allTreatmentDates = allChunkResults.flatMap(results => results);
        
        // If we have treatment dates, process them further
        let treatmentDates = [];
        if (allTreatmentDates.length > 0) {
            // For more complex cases with many treatments, use LLM to combine results
            if (allTreatmentDates.length > 3) {
                const combinePromptWithData = combineMRIResultsPrompt.replace(
                    "{CHUNK_RESULTS}", 
                    JSON.stringify({treatmentDates: allTreatmentDates})
                );
                
                const combinedResponse = await processAi({content: combinePromptWithData, thinking: true, jsonValidator: true});
                try {
                    treatmentDates = JSON.parse(combinedResponse).treatmentDates;
                } catch (e) {
                    console.log("Error parsing JSON from combined response", e);
                    // Fall back to simple deduplication
                    treatmentDates = deduplicateTreatmentDates(allTreatmentDates);
                }
            } else {
                // For simple cases, just deduplicate in code
                treatmentDates = deduplicateTreatmentDates(allTreatmentDates);
            }
        }
        
        // Helper function to deduplicate treatment dates
        function deduplicateTreatmentDates(dates) {
            const uniqueMap = new Map();
            
            dates.forEach(item => {
                const key = `${item.date}-${item.treatmentDescription}`;
                if (!uniqueMap.has(key) || uniqueMap.get(key).pageNumber > item.pageNumber) {
                    uniqueMap.set(key, item);
                }
            });
            
            return Array.from(uniqueMap.values())
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        // Get objective findings
        const objectFindings = await procesObjectiveFindings(
            chunkedFileText[0] + " Extracted information: " + JSON.stringify({treatmentDates}), 
            caseId, 
            userId, 
            domainName
        );
    
        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                diagnosis,
                objectFindings,
                medicalTypeName
            });
        } else {
            // If document applies to a previous provider, combine with existing treatment dates
            let lastProviderTreatmentDates = providers.at(-1).treatmentDates;
            const allDates = [...lastProviderTreatmentDates, ...treatmentDates];
            providers.at(-1).treatmentDates = deduplicateTreatmentDates(allDates);
        }
    }

    if (medicalTypeName === "Surgery Center Reports") {
        const treatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like {
    
            "treatmentDates": [
                {
                    "date": "MM/DD/YYYY",
                    "treatmentDescription": "Patient reported bla bla.",
                    "Surgeon": "Surgeon's name or attendant's name",
                    "procedures": "What procedure was done.",
                    "pageNumber": N
                }
            ]
            
        }.
        
        You are a medical analysis assistant parsing medical records of a patient.
        Here is a page of the medical record:
        
        {CHUNKED_FILE_TEXT}
        
        Notes for the response :- 
        1. It is a Surgery record file text of a patient, just keep the record of which Surgery was done.
        2. Please provide a chronological single line summary, organized by date, the specific body part or parts subjected to Surgery scans during each visit by the patient listed in the 'treatmentDates' array of objects.
        3. Do not add summary of patient treatment in it. Make sure the treatment dates and description are accurately parsed and treatmentDates should be sorted by date key.
        4. Keep the treatDates array empty if no treatment date is present in text. Don't add extra dates by yourself.
        5. Please remove personal details of Patient for example Patient name, age, gender, doctor name.
        6. treatmentDescription should be made and sorted using the dates at which the treatment was done while stating the specific body part(s) examined during the Surgery visit. 
           Treatment description should be in a paragraph.  
        7. Please write detailed summary of procedures from the Surgery record and place them within the 'procedures' field. I'm specifically looking for only the procedures from the Surgery report. Please refrain from adding any additional information.
        8. Please extract the surgeon's name or attendant's name, if available. Ensure that only one name is extracted, giving priority to the surgeon's name. Place the extracted name under 'Surgeon' 
        9. Please remove dates related to medical history. 
        10. Please ensure that every treatment date follows this structure: 'MM/DD/YYYY'.
        11. Include the page number in each object in treatmentDates.
        12. Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information. 
        Please provide Only JSON data. Give me the output without any additional text or explanation.
         `;
    
        const findCaseById = await CaseModelTable.findById(caseId);
        if (!findCaseById) {
            console.log("couldn't find case by ID")
            return
        }
    
        // Process all chunks in parallel
        const chunkPromises = chunkedFileText.map(async (chunkedText, i) => {
            try {
                const currentProviderTreatmentSummaryText = treatmentSummaryPrompt.replace("{CHUNKED_FILE_TEXT}", chunkedText);
                const response = await processAi({content: currentProviderTreatmentSummaryText, jsonValidator: true, thinking: true});
                
                try {
                    const parsed = JSON.parse(response);
                    return parsed.treatmentDates || [];
                } catch (e) {
                    console.log(`Error parsing JSON for chunk ${i}:`, e);
                    return [];
                }
            } catch (e) {
                console.log(`Error processing chunk ${i}:`, e);
                return [];
            }
        });
    
        // Wait for all chunks to complete
        const allTreatmentDates = await Promise.all(chunkPromises);
        
        // Flatten the array of arrays
        let treatmentDates = allTreatmentDates.flat();
        
        // Deduplicate by date
        const uniqueDatesMap = new Map();
        treatmentDates.forEach(item => {
            if (uniqueDatesMap.has(item.date)) {
                // If the date already exists, merge the data
                const existingItem = uniqueDatesMap.get(item.date);
                
                // Merge treatment descriptions
                if (item.treatmentDescription && item.treatmentDescription.trim() !== "") {
                    if (existingItem.treatmentDescription && existingItem.treatmentDescription.trim() !== "") {
                        existingItem.treatmentDescription += `, ${item.treatmentDescription}`;
                    } else {
                        existingItem.treatmentDescription = item.treatmentDescription;
                    }
                }
                
                // Keep more detailed procedures information
                if (item.procedures && (!existingItem.procedures || 
                    (item.procedures.length > existingItem.procedures.length))) {
                    existingItem.procedures = item.procedures;
                }
                
                // Keep surgeon information if available
                if (item.Surgeon && (!existingItem.Surgeon || 
                    existingItem.Surgeon === "Unknown" || 
                    existingItem.Surgeon.trim() === "")) {
                    existingItem.Surgeon = item.Surgeon;
                }
                
                // Keep the earliest page number
                if (item.pageNumber && (!existingItem.pageNumber || 
                    item.pageNumber < existingItem.pageNumber)) {
                    existingItem.pageNumber = item.pageNumber;
                }
            } else {
                // If it's a new date, add it to the Map
                uniqueDatesMap.set(item.date, { ...item });
            }
        });
        
        // Convert the Map back to an array and sort
        treatmentDates = Array.from(uniqueDatesMap.values());
        treatmentDates = treatmentDates.sort((a, b) => {
            // Handle date comparison more safely
            try {
                return new Date(a.date) - new Date(b.date);
            } catch (e) {
                return 0; // Default to no change in order if date parsing fails
            }
        });
        
        // Process objective findings from the complete text
        const objectFindings = await procesObjectiveFindings(
            chunkedFileText[0] + " Extracted information: " + JSON.stringify({treatmentDates}), 
            caseId, 
            userId, 
            domainName
        );
    
        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                diagnosis,
                objectFindings,
                medicalTypeName
            });
        } else {
            // If document applies to a previous provider, combine treatmentDates objects and deduplicate
            let lastProviderTreatmentDates = providers.at(-1).treatmentDates;
            treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates];
            
            const uniqueDatesMap = new Map();
            treatmentDates.forEach(item => {
                if (uniqueDatesMap.has(item.date)) {
                    // If the date already exists, merge the data
                    const existingItem = uniqueDatesMap.get(item.date);
                    
                    // Merge treatment descriptions
                    if (item.treatmentDescription && item.treatmentDescription.trim() !== "") {
                        if (existingItem.treatmentDescription && existingItem.treatmentDescription.trim() !== "") {
                            existingItem.treatmentDescription += `, ${item.treatmentDescription}`;
                        } else {
                            existingItem.treatmentDescription = item.treatmentDescription;
                        }
                    }
                    
                    // Keep more detailed procedures information
                    if (item.procedures && (!existingItem.procedures || 
                        (item.procedures.length > existingItem.procedures.length))) {
                        existingItem.procedures = item.procedures;
                    }
                    
                    // Keep surgeon information if available
                    if (item.Surgeon && (!existingItem.Surgeon || 
                        existingItem.Surgeon === "Unknown" || 
                        existingItem.Surgeon.trim() === "")) {
                        existingItem.Surgeon = item.Surgeon;
                    }
                    
                    // Keep the earliest page number
                    if (item.pageNumber && (!existingItem.pageNumber || 
                        item.pageNumber < existingItem.pageNumber)) {
                        existingItem.pageNumber = item.pageNumber;
                    }
                } else {
                    // If it's a new date, add it to the Map
                    uniqueDatesMap.set(item.date, { ...item });
                }
            });
            
            // Convert the Map back to an array and sort
            treatmentDates = Array.from(uniqueDatesMap.values());
            providers.at(-1).treatmentDates = treatmentDates.sort((a, b) => {
                try {
                    return new Date(a.date) - new Date(b.date);
                } catch (e) {
                    return 0;
                }
            });
        }
        console.log("Done with Surgery Center reports");
    }


    if (medicalTypeName === "ER") {
        console.log(content.length)
        
        // Process main ER record and supplementary data in parallel
        const [
            mainERResults, 
            imagingData, 
            physicalExaminationData, 
            planRecommendation
        ] = await Promise.all([
            // Process main ER record chunks in parallel
            (async () => {
                const erTreatmentSummaryPrompt = `Give me an JSON object as the reponse of this text completion API.Structure of the object should be like {
                    "treatmentDates": [
                        {
                            "admittedDate": "MM/DD/YYYY",
                            "dischargedDate": "MM/DD/YYYY",
                            "chiefComplaint": "",
                            "impression": "",
                            "historyOfPresentIllness": "",
                            "pastMedicalHistory": "",
                            "pastSurgicalHistory": "",
                            "planRecommendation": [],
                            "diagnoses": [],
                            "pageNumber": N
                        }
                    ]
                }.
                
                You are a medical analysis assistant parsing medical records of a patient and formatting information into JSON objects.
                Here is the next page of the medical record:
                
                {CHUNKED_FILE_TEXT}
                
                Notes for the response :
    
                1.It is a ER record file text of a patient.Please Extract Admitted and decharged date from ER Report.
                2.Please extract the Chief Complaint: from the ER report. Do not add Chief complaint Quote it should only be Chief Complaint if available.
                3.Please extract the Impression / ED Plan from the ER report and make short paragraph out of it. 
                4.Please extract the History of Present Illness form the ER report. 
                5.Please extract the Past Medcial History from the ER report. 
                6.Please extract the Past Surgical History from the ER rport.
                9.Please provide Diagnoses of patient and diagnoses findings should be in points dot not include any kind of ICD Codes. Do not include an intro or explanation, only include diagnoses contained in the medical record.
                10.Please provide detailed summary of ER report.
                11. Include the page number in each object in treatmentDates, if you are updating an exisitng object use the earliest page number of the treatment date.
                12. Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information. 
                13. DO NOT REMOVE EXISTING DATA FROM THE treatmentDates ARRAY, ONLY UPDATE EXISTING OBJECTS OR ADD ADDITIONAL OBJECTS
                14. MAKE SURE THE JSON OUTPUT INCLUDES ALL PREVIOUS DATA IN ADDITION TO NEW DATA
                Please provide Only JSON data. Give me the output without any additional text or explanation.
                `;
                
                // Process all chunks in parallel
                const chunkPromises = chunkedFileText.map(async (chunkedText) => {
                    const currentPrompt = erTreatmentSummaryPrompt.replace("{CHUNKED_FILE_TEXT}", chunkedText);
                    const response = await processAi({content: currentPrompt, jsonValidator: true, thinking: true});
                    try {
                        // Parse the JSON response and extract the treatmentDates array
                        return JSON.parse(response).treatmentDates || [];
                    } catch (e) {
                        console.error("Error parsing ER response:", e);
                        return [];
                    }
                });
                
                // Wait for all promises to resolve and flatten the results array
                return (await Promise.all(chunkPromises)).flat();
            })(),
            
            // Process imaging details in parallel
            getImagingDetails(chunkedFileText, caseId, userId, domainName),
            
            // Process physical examination data in parallel
            getSystemAndPhysicalExamData(chunkedFileText, caseId, userId, domainName),
            
            // Process plan and recommendation data in parallel
            getPlanAndRecommendationData(chunkedFileText, caseId, userId, domainName)
        ]);
        
        console.log("Extracted data from ER chunks in parallel");
        
        // Combine the main ER results
        const combineMainERPrompt = `You are a medical data processor combining ER record extraction results.
        The input is an array of treatment date objects extracted from different chunks of the same medical record.
        Each object contains information about an ER visit.
        
        Your task:
        1. Remove duplicate entries based on the admittedDate field
        2. For entries with the same admittedDate, merge their information
        3. Sort the final array by admittedDate
        4. Return a JSON object with a single treatmentDates array containing all unique entries
        
        Input treatment date objects: ${JSON.stringify(mainERResults)}
        Please provide only a JSON object with this structure:
        {
          "treatmentDates": [
            {
              "admittedDate": "MM/DD/YYYY",
              "dischargedDate": "MM/DD/YYYY",
              "chiefComplaint": "",
              "impression": "",
              "historyOfPresentIllness": "",
              "pastMedicalHistory": "",
              "pastSurgicalHistory": "",
              "planRecommendation": [],
              "diagnoses": [],
              "pageNumber": N
            },
            ...
          ]
        }`;
        
        const combinedMainER = await processAi({content: combineMainERPrompt, jsonValidator: true, thinking: true});
        let treatmentDates = JSON.parse(combinedMainER).treatmentDates;
        
        console.log("Combined ER treatment dates");
        
        // Final deduplication and sorting
        const uniqueDatesMap = new Map();
        treatmentDates.forEach(item => {
            if (!uniqueDatesMap.has(item.admittedDate)) {
                uniqueDatesMap.set(item.admittedDate, { ...item });
            }
        });
        treatmentDates = Array.from(uniqueDatesMap.values());
        treatmentDates = treatmentDates.sort((a, b) => a.admittedDate - b.admittedDate);
        
        // Add the provider to the providers array
        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                medicalTypeName,
                imagingData,
                physicalExaminationData,
                planRecommendation
            });
        } else {
            // If document applies to a previous provider, combine data
            let lastProviderTreatmentDates = providers.at(-1).treatmentDates;
            treatmentDates = [...lastProviderTreatmentDates, ...treatmentDates];
            
            // Deduplicate again
            const uniqueDatesMap = new Map();
            treatmentDates.forEach(item => {
                if (!uniqueDatesMap.has(item.admittedDate)) {
                    uniqueDatesMap.set(item.admittedDate, { ...item });
                }
            });
            treatmentDates = Array.from(uniqueDatesMap.values());
            
            // Update the provider
            providers.at(-1).treatmentDates = treatmentDates.sort((a, b) => a.admittedDate - b.admittedDate);
        }
    }



    if (medicalTypeName === "Hospital") {
        // Define separate data types to extract in parallel
        let extractedData = {
            hospitalStays: [],
            chiefComplaints: [],
            systemReviews: [],
            treatmentDetails: [],
            diagnoses: [],
            planRecommendations: []
        };
    
        const extractionPrompts = {
            "hospitalStays": `Extract all hospital admission and discharge dates from the record. Format dates as MM/DD/YYYY. Include page numbers where dates appear.`,
            "chiefComplaints": `Extract all chief complaints from the hospital record. Connect each with its associated admission date if possible.`,
            "systemReviews": `Extract all review of systems and physical examination details from the record. Include date and page number references.`,
            "treatmentDetails": `Extract all detailed treatment summaries for medical visits within the hospital stay, including type of visit, primary complaint, and date of each recorded treatment.`,
            "diagnoses": `Extract all diagnoses mentioned in the hospital record. Include relevant dates if available.`,
            "planRecommendations": `Extract all plans and recommendations mentioned in the record. Include relevant dates if available.`
        };
    
        const sectionExtractionPrompt = `You are a medical analysis assistant parsing hospital records of a patient and formatting information section by section.
            Here is the next set of pages of the medical record:
            
            {CHUNKED_FILE_TEXT}
    
            For this stage of analysis we are concerned with extracting information related to {SECTION_TO_EXTRACT}.
            Use the following instructions to extract data related to the record:
            Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information.
            {SECTION_INSTRUCTIONS}
        `;
    
        const findCaseById = await CaseModelTable.findById(caseId);
        if (!findCaseById) {
            console.log("couldn't find case by ID");
            return;
        }
    
        // Process all extraction types in parallel
        const keyPromises = Object.keys(extractionPrompts).map(async (key) => {
            // Process all chunks for this key in parallel
            const chunkPromises = chunkedFileText.map(async (chunkedText, index) => {
                let currentPrompt = sectionExtractionPrompt
                    .replace("{CHUNKED_FILE_TEXT}", chunkedText)
                    .replace("{SECTION_TO_EXTRACT}", key)
                    .replace("{SECTION_INSTRUCTIONS}", extractionPrompts[key]);
    
                return await processAi({content: currentPrompt});
            });
    
            // Wait for all chunks of this key to complete
            const chunkResults = await Promise.all(chunkPromises);
            return { key, data: chunkResults };
        });
    
        // Wait for all extraction types to complete
        const results = await Promise.all(keyPromises);
    
        // Organize results back into extractedData structure
        results.forEach(({ key, data }) => {
            extractedData[key] = data;
        });
    
        // Helper functions to process the extracted data into proper format
        async function getHospitalStays(extractedData) {
            const prompt = `Extract and combine all hospital admission and discharge dates from these notes.
                These notes are from overlapping text chunks, so remove duplicate entries.
                Format each stay as an object with admittedDate and dischargeDate in MM/DD/YYYY format, and pageNumber.
                Return an array of these objects sorted by admission date.
                Data: ${JSON.stringify(extractedData, null, 2)}
                
                Only output a JSON parsable array of objects.
            `;
            
            const response = await processAi({content: prompt, jsonValidator: true});
            return JSON.parse(response);
        }
    
        async function getChiefComplaints(extractedData) {
            const prompt = `Extract and associate chief complaints with each hospital stay from these notes.
                Identify the chief complaint for each unique hospital admission.
                These notes are from overlapping text chunks, so remove duplicate entries.
                For each admission date, provide the associated chief complaint.
                Data: ${JSON.stringify(extractedData, null, 2)}
                
                Only output a JSON parsable object mapping admission dates to chief complaints.
            `;
            
            const response = await processAi({content: prompt, jsonValidator: true});
            return JSON.parse(response);
        }
    
        async function getTreatmentSummaries(extractedData) {
            const prompt = `Create detailed treatment summaries from these hospital record notes.
                For each hospital admission, organize all treatments, procedures, and visits chronologically.
                Each treatment should include date, type of visit, primary complaint, review of system, diagnosis, and recommendations.
                Remove duplicate entries and organize by admission date.
                Structure as per the hospital schema with nested treatmentSummary arrays.
                Data: 
                Hospital Stays: ${JSON.stringify(extractedData.hospitalStays, null, 2)}
                System Reviews: ${JSON.stringify(extractedData.systemReviews, null, 2)}
                Treatment Details: ${JSON.stringify(extractedData.treatmentDetails, null, 2)}
                Diagnoses: ${JSON.stringify(extractedData.diagnoses, null, 2)}
                Plan Recommendations: ${JSON.stringify(extractedData.planRecommendations, null, 2)}
                
                Only output a JSON parsable object mapping admission dates to treatment summary arrays.
            `;
            
            const response = await processAi({content: prompt, jsonValidator: true});
            return JSON.parse(response);
        }
    
        // Construct the final hospital record object
        async function constructHospitalRecord() {
            const hospitalStays = await getHospitalStays(extractedData.hospitalStays);
            const chiefComplaints = await getChiefComplaints(extractedData.chiefComplaints);
            const treatmentSummaries = await getTreatmentSummaries(extractedData);
            
            // Combine all information into the final structure
            const treatmentDates = hospitalStays.map(stay => {
                return {
                    admittedDate: stay.admittedDate,
                    dischargeDate: stay.dischargeDate,
                    chiefComplaint: chiefComplaints[stay.admittedDate] || "",
                    pageNumber: stay.pageNumber,
                    treatmentSummary: treatmentSummaries[stay.admittedDate] || []
                };
            });
            
            return treatmentDates;
        }
    
        // Get the final structured data
        let treatmentDates = await constructHospitalRecord();
        
        // Deduplicate based on admitted date
        const uniqueDatesMap = new Map();
        treatmentDates.forEach(item => {
            if (!uniqueDatesMap.has(item.admittedDate)) {
                uniqueDatesMap.set(item.admittedDate, { ...item });
            }
        });
        
        // Convert to array and sort
        treatmentDates = Array.from(uniqueDatesMap.values());
        treatmentDates = treatmentDates.sort((a, b) => {
            // Use a simple string comparison if needed
            const dateA = new Date(a.admittedDate.split('/').reverse().join('-'));
            const dateB = new Date(b.admittedDate.split('/').reverse().join('-'));
            return dateA - dateB;
        });
    
        // Handle provider integration
        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                medicalTypeName
            });
        } else {
            // If document applies to a previous provider, merge with existing data
            let lastProviderTreatmentDates = providers.at(-1).treatmentDates;
            
            // Use LLM to intelligently merge the treatment dates
            const mergePrompt = `Combine these two sets of hospital treatment dates into one unified set.
                First set: ${JSON.stringify(lastProviderTreatmentDates, null, 2)}
                Second set: ${JSON.stringify(treatmentDates, null, 2)}
                
                Merge any entries with the same admission date intelligently, preserving all information.
                Only output a JSON parsable array of the combined treatment dates.
            `;
            
            const mergedResponse = await processAi({content: mergePrompt, thinking: true, jsonValidator: true});
            const mergedTreatmentDates = JSON.parse(mergedResponse);
            
            // Update the provider's treatment dates with the merged result
            providers.at(-1).treatmentDates = mergedTreatmentDates.sort((a, b) => {
                const dateA = new Date(a.admittedDate.split('/').reverse().join('-'));
                const dateB = new Date(b.admittedDate.split('/').reverse().join('-'));
                return dateA - dateB;
            });
        }
    }


    if (medicalTypeName === "Consultation Reports") {

        let extractedData = {
            diagnoses: [],
            causation: [],
            historyOfInjury: [],
            pastMedicalHistory: [],
            pastSurgicalHistory: [],
            imagingData: [],
            treatmentSummary: []
        };

        const extractionPrompts = {
            "diagnoses": `Extract all information related to the primary diagnoses of the patient in the medical record`,
            "causation": `Look for the keyword 'causation' and extract all related information from the consultation report. Make sure to use language present in the consultation report. If not causation section is found, do not take any notes.`,
            "historyOfInjury": `Analyze the consultation report, look for historyOfInjury, and provide detailed information. Exclude Interval History from the summary`,
            "pastMedicalHistory": `Summerize "Past Medical History" from the Consultation Reports.`,
            "pastSurgicalHistory": `Summerize "Past Surgical History" from the Consultation Reports.`,
            "imagingData": `Extract date wise in-depth details of the type of scan done, including the "radiology name" and "impressions" from CT scans, X-rays, or MRIs containing the keywords "CT scan," "X-ray," or "MRI."
        List impressions and exclude the procedure provider, window settings, or findings unrelated to CT scans, X-rays, or MRIs.
        Identify the type of scan conducted.
        If there is a radiology name but no associated impressions, do not include that entry.
        Only extract the impressions from the relevant imaging scans. Do not include other findings with the impressions.`,
            "treatmentSummary": `Extract each unique date from the records and provide a detailed description of the events of that date.
        Do not include the initial accident or injury, or other medical provider treatments alluded to in the primary medical record.
        Make sure to include the Date, page number, any relevant plan/discussion sections, and any relevant physical examniations in the extracted details.
        Extract data but do not use any personal information of the patient, such as name, age, etc. Do not use any patient's name in the records; instead, use the word 'patient'.
        Extract date-wise physical examinations of the patient. Ensure that all findings are positive, removing any negative and normal findings. Avoid duplicate entries.
        Extract the date-wise plan/discussion of the patient. All findings should be in bullet points. 
        Include the page number in each object in treatmentDates, if you are updating an exisitng object use the earliest page number of the treatment date.
        Extract a few detailed sentences describing the current complaints and treatment for each date. "Patient reported ..."
        Only include the detailed treatment dates described in the record from the medical provider. Do not include the initial accident or injury, or other medical provider treatments alluded to in the primary medical record.
        Do not include dates mentioned in past medical histories, past surgical histories, or history of injury sections, these will be analyzed in separate sections.
        `}

        const treatmentSummaryPrompt = `You are a medical analysis assistant parsing medical records of a patient and formatting information section by section.
        Here is the next set of pages of the medical record:
        
        {CHUNKED_FILE_TEXT}

        For this stage of analysis we are concerned with extracting information related to {SECTION_TO_EXTRACT}.
        Use the following instructions to extract data related to the record:
        Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information.
        {SECTION_INSTRUCTIONS}
        `

        let response = "Empty, please create a new object";
        const findCaseById = await CaseModelTable.findById(caseId);

        if (!findCaseById) {
            console.log("couldn't find case by ID");
            return;
        }

        // Process all keys in parallel
        const keyPromises = Object.keys(extractionPrompts).map(async (key) => {
            //console.log("Processing information for: ", key);

            // Process all chunks for this key in parallel
            const chunkPromises = chunkedFileText.map(async (chunkedText, index) => {
                let currentProviderTreatmentSummaryText = treatmentSummaryPrompt
                    .replace("{CHUNKED_FILE_TEXT}", chunkedText)
                    .replace("{SECTION_TO_EXTRACT}", key)
                    .replace("{SECTION_INSTRUCTIONS}", extractionPrompts[key]);

                //console.log(`Processing chunk ${index} for ${key}...`);
                return await processAi({content: currentProviderTreatmentSummaryText});
            });

            // Wait for all chunks of this key to complete
            const chunkResults = await Promise.all(chunkPromises);
            return { key, data: chunkResults };
        });

        // Wait for all keys to complete
        const results = await Promise.all(keyPromises);

        // Organize results back into extractedData structure
        results.forEach(({ key, data }) => {
            extractedData[key] = data;
        });

        async function getDiagnoses(extractedData) {
            const diagnosesPrompt = `Take these diagnoses notes from a medical record and present them as a list.
            These notes are from slightly overlapping text chunks, remove duplicate entries and combine identical entries.
            Only include the diagnoses, no other details. Use complete sentences.
            Do not output an intro or explanation, only output a JSON parsable list like so:
            ["diagnosis 1", "diagnosis 2", ...]
            Data: ${JSON.stringify(extractedData, null, 2)}
            `;

            const response = await processAi({content: diagnosesPrompt, jsonValidator: true});
            return JSON.parse(response);
        }

        async function getCausation(extractedData) {
            const causationPrompt = `Take these causations notes from a medical record and generate a single causation statement.
            These notes are from slightly overlapping text chunks, remove duplicate entries and combine identical entries. 
            Do not include language about no causation found. If only some of the notes find a causation, just include the found causations and discard the notes about none being found.
            Remove "History of injury" and accident dates.
            Ensure unique entries. Return 'NA' if none found. Use complete sentences.
            Do not output an intro or explanation, only output a JSON parsable list of length 1 like so:
            ["entire causation"]
            Data: ${JSON.stringify(extractedData, null, 2)}
            `;

            const response = await processAi({content: causationPrompt, jsonValidator: true});
            console.log("causation response is: ", response)
            return JSON.parse(response);
        }

        async function getHistoryOfInjury(extractedData) {
            const historyPrompt = `Provide a short summary of injury history from these notes of a medical record.
            These notes are from slightly overlapping text chunks, remove duplicate entries and combine identical entries.
            Exclude Interval History. Return [" "] if none found. Use complete sentences.
            Do not output an intro or explanation, only output a JSON parsable list of length 1 like so:
            ["entire historyOfInjury"]
            Data: ${JSON.stringify(extractedData, null, 2)}
            `;

            const response = await processAi({content: historyPrompt, jsonValidator: true});
            return JSON.parse(response);
        }

        async function getMedicalHistory(extractedData) {
            const medHistoryPrompt = `Summarize these Past Medical History notes from a medical record.
            These notes are from slightly overlapping text chunks, remove duplicate entries and combine identical entries.
            Do not output an intro or explanation, only output a JSON parsable list like so:
            ["Medical history 1", "medical history 2", ...]
            If no data is found output an empty array []
            Data: ${JSON.stringify(extractedData, null, 2)}
            `;

            const response = await processAi({content: medHistoryPrompt, jsonValidator: true});
            return JSON.parse(response);
        }

        async function getSurgicalHistory(extractedData) {
            const medHistoryPrompt = `Summarize Past Surgical History.
            These notes are from slightly overlapping text chunks, remove duplicate entries and combine identical entries.
            Do not output an intro or explanation, only output a JSON parsable list like so:
            ["Surgical history 1", "Surgical history 2", ...]
            If no data is found output an empty array []
            Data: ${JSON.stringify(extractedData, null, 2)}
            `;

            const response = await processAi({content: medHistoryPrompt, jsonValidator: true});
            return JSON.parse(response);
        }

        async function getImagingData(extractedData) {
            const imagingPrompt = `Extract date wise in-depth details of the type of scan done, including the "radiology name" and "impressions" from CT scans, X-rays, or MRIs containing the keywords "CT scan," "X-ray," or "MRI." Insert the area imaged in "imagingName." Do not include any duplicate imaging entries.
            List impressions in bullet points under "imagingImpressions." Do not include any duplicate imaging impressions from the ER.
            Exclude the procedure provider, window settings, or findings unrelated to CT scans, X-rays, or MRIs.
            If there are no relevant findings, return "No findings." Do not include other details.
            Identify the type of scan conducted and insert the scan type into "scanType."
            Only include one "imagingName" entry at a time; do not combine multiple names into one entry.
            If there are no related CT scans, X-rays, or MRIs, leave those array fields blank rather than adding unwanted data.
            If there is a radiology name but no associated impressions, do not include that entry.
            Only extract the impressions from the relevant imaging scans. Do not include other findings with the impressions.
            Remove any duplicate CT scan, X-ray, or MRI entries to ensure each imaging entry is unique..
            And format them into a JSON parsable list of objects like so: 
            [
                {
                    "imagingName": "Scan name should be here",
                    "scanType": "Type of Scan",
                    "imagingImpression": [
                        "impression should insert here"
                    ],
                    "duplicate": ""
                },
                ...
            ]
            
            Data: ${JSON.stringify(extractedData, null, 2)}
            Only output the list in JSON parsable form, the schema must exactly match the example above. DO NOT ADD OR CREATE ANY IMAGING RESULTS OR OTHER IMAGING KEYS
            `;

            const response = await processAi({content: imagingPrompt, jsonValidator: true});
            return JSON.parse(response);
        }

        async function getTreatmentSummary(extractedData) {
            const treatmentPrompt = `Extract treatment details from the following medical record notes.
            These notes are from slightly overlapping text chunks, remove duplicate entries and combine identical entries.
            Format each identified date into it's own object including:
            - Date (MM/DD/YYYY)
            - Page number
            - Treatment description (exclude personal information)
            - Physical examination (positive findings only, max 100 words)
            - Plan/discussion in bullet points
            Extract data but do not use any personal information of the patient, such as name, age, etc. Do not use any patient's name in the records; instead, use the word 'patient'.
            Extract date-wise physical examinations of the patient and store them in the Physical Examination array. Ensure that all findings are positive, removing any negative and normal findings. Avoid duplicate entries, and ensure each entry does not exceed 100 words.
            Extract the date-wise plan/discussion of the patient and store it in the PlanDiscussion array. All findings should be in bullet points. 
            Extract a treatment description and the current complaints of the patient and store them in the treatmentDescription, these frequently start with "patient reported ..."
            Include the page number in each object in treatmentDates, if you are updating an exisitng object use the earliest page number of the treatment date
            Only extract information from actual medical record text, do not extract treatment dates from medical bills or billing information.
            And format them into a JSON parsable list of objects like so:
            [
                { "date": "MM/DD/YYYY", "pageNumber": N, "treatmentDescription": "", "physicalExamination": [], "PlanDiscussion": []},
                ...
            ]
            
            Make sure to include all explicit treatment dates from the record in the final JSON parsable list of objects, ignore things like treatments, surgeries, and imaging from other providers and the accident itself.
            Only include the detailed treatment dates described in the record from the medical provider. Do not include the initial accident or injury, or other medical provider treatments alluded to in the primary medical record.
            Do not include dates mentioned in past medical histories, past surgical histories, or history of injury sections, these will be analyzed in separate sections.
            Make sure to extract a treatmentDescription, physialExamination, and PlanDiscussion for each object in the list.
            Data extracted from record: ${JSON.stringify(extractedData, null, 2)}
            Only output the list in JSON parsable form, the schema must exactly match the example above. DO NOT ADD OR CREATE ANY TREATMENT DESCRIPTION OR TREATMENT SUMMARY KEYS
            `;

            const response = await processAi({content: treatmentPrompt, jsonValidator: true});
            return JSON.parse(response);
        }

        // Construct the final object
        async function constructStructuredData(extractedData) {
            const newTreatmentDate = {
                diagnoses: await getDiagnoses(extractedData.diagnoses),
                causation: await getCausation(extractedData.causation),
                historyOfInjury: await getHistoryOfInjury(extractedData.historyOfInjury),
                imagingData: await getImagingData(extractedData.imagingData),
                treatmentSummary: await getTreatmentSummary(extractedData.treatmentSummary)
            };

            // Add optional fields if they exist
            const medicalHistory = await getMedicalHistory(extractedData.medicalHistory);
            if (medicalHistory.length > 0) {
                newTreatmentDate.pastMedicalHistory = medicalHistory;
            }

            const surgicalHistory = await getSurgicalHistory(extractedData.surgicalHistory);
            if (surgicalHistory.length > 0) {
                newTreatmentDate.pastSurgicalHistory = surgicalHistory;
            }

            // Combine with existing data
            return {
                treatmentDates: [newTreatmentDate]
            };
        }

        // Use the function
        //console.log("Unstructured extracted infomration from consultation reports: ", JSON.stringify(extractedData, null, 2))
        const structuredResponse = await constructStructuredData(extractedData);


        //console.log("Structured extracted infomration from consultation reports: ", JSON.stringify(structuredResponse, null, 2))
        let treatmentDates = structuredResponse.treatmentDates;

        //explicitly get unique dates, shouldn't be necessary
        if (providerName !== lastProviderName) {
            providers.push({
                name: providerName,
                treatmentDates,
                medicalTypeName
            });
        } else {
            //Temporary fix, need to merge extracted objects while preserving data extracted from the same date in different chunks
            //If document applies to a previous provider, we must combine treatmentDates objects and deduplicate dates while preserving information
            let lastProviderTreatmentDates = providers.at(-1).treatmentDates;
            const treatmentPrompt = `Combine these two treatmentDates objects into a single object.
            Objects may contain overlapping information, remove duplication information and combine identical information.

            Data extracted from record:
            ${JSON.stringify(treatmentDates, null, 2)}

            Data from existing records:
            ${JSON.stringify(lastProviderTreatmentDates, null, 2)}

            Do not include and intro or explanation, only output a JSON Parsable object with the following schema:
            {
                "treatmentDates": [
                    {
                        "diagnoses":[],
                        "causation":[],
                        "historyOfInjury":[],
                        "pastMedicalHistory": [],
                        "pastSurgicalHistory": [],
                        "imagingData": [
                            {
                                "imagingName": "",
                                "scanType": "",
                                "imagingImpression": [
                                    ""
                                ],
                                "duplicate": ""
                            }
                        ],
                        treatmentSummary: [
                            { "date": "", "pageNumber": N, "treatmentDescription": "", "physicalExamination": [], "PlanDiscussion": []}
                        ]
                    }
                ]
            }

            The diagnoses, cuasation, historyOfInjury, pastMedicalHistory, pastSurgicalHistory, imagingData, imagingImpression, physicalExamination, and PlanDiscussion keys should all be arrays


`;
            let combined_treatmentdates = await processAi({content: treatmentPrompt, jsonValidator: true})
            treatmentDates = JSON.parse(combined_treatmentdates).treatmentDates
            console.log("Combined information from consultation reports: ", JSON.stringify(treatmentDates, null, 2))
            //we should better combine dates from separate documents representing the same provider
            providers.at(-1).treatmentDates = treatmentDates
        }

    }

    return providers;
}


//This function is for testing porpose only
const testFunction = async () => {
    try {
        const text = chatGpt.data;
        await getMedicalProviderNames(text);
    } catch (error) {
        //  throw error;
    }
}

module.exports = {
    processandGenerateMedicalRecordsChatGptService,
    ProcessMedicalIcalIcdCodes,
    testFunction
}