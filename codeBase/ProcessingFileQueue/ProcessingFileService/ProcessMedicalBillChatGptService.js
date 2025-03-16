const { processAi } = require("./ChatGptPdfProcessor");

const processmedicalBillChatGptProcessor = async (content, updatedCompleteRequest, socketService, caseId, userId, medicalProviderNames, count, medicalProviderBillCount, domainName, medicalBillwithProviderName, combinedObject) => {
    try {
        const medicalBillResponse = await getMedicalBillAmountWithMedicalProviderName(content, updatedCompleteRequest, socketService, caseId, userId, medicalProviderNames, count, medicalProviderBillCount, domainName, medicalBillwithProviderName, combinedObject)
        count = count + 1
        if (count === medicalProviderBillCount) {
            combinedObject = [];
            medicalBillwithProviderName = []
        }

        return {
            medicalBillResponse,
            // completedRequests
        };
    } catch (e) {
        console.log(e)
        const errorCode = 500
        const errorDescription = e.message
        await saveErrorLog(caseId, userId, errorCode, errorDescription, domainName);
    }
}

const splitStringIntoChunks = (string, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < string.length; i += chunkSize) {
        chunks.push(string.substring(i, i + chunkSize));
    }
    return chunks;
}

const getMedicalBillAmountWithMedicalProviderName = async (content, updatedCompleteRequest, socketService, caseId, userId, medicalProviderNames, count, medicalProviderBillCount, domainName, medicalBillwithProviderName, combinedObject) => {
    console.log(content.length);
    const ocrTextLimit = 50000;
    const chunkedFileText = splitStringIntoChunks(content, ocrTextLimit);
    let providerName = medicalProviderNames[count];
    let lastProviderName = medicalBillwithProviderName.length ? medicalBillwithProviderName.at(-1).name : '';

    const medicalBillPrompt = `Give me an JSON object as the reponse of this text completion API. Structure of the object should be like {

        medicalBillResp:[
            {totalBillAmount: "", date: "MM/DD/YY" }
        ]

    }. 
    
    Medical record text to extract bill entries from is: {CHUNKED_FILE_TEXT} 
    
    Notes for the response:-
    1. Extract total charges from medical billing data. Total charges should reflect the cumulative amount without adding individual amounts for each date.    
    2. Remove the currency sign from the totalBillAmount field.
    3. If there are multiple Service facility location information entries, use only one name.
    4. Provide the API response as an array of objects in JavaScript.
    5. Ensure that the date of the bill for each medical test is extracted and presented in the 'MM/DD/YY' format.
    6. Extract all total charges/Total Charges from the bills, ensuring that they are represented as whole numbers; decimal values or additional digits after the decimal point are allowed.
    7. Do not itemize the charges based on dates; instead, provide the total amount of the bill.
    8. Do not add balance due amount.
    9. Only extract bill information from actual medical bills found within the text, ignore bill infomration mentioned within medical record information such as estmiated cost of treatment, future medical expenses, etc. 
    10. Ignore future medical expenses, cost estimates, and other unrelated costs within the wider medical record, these should NOT be included in the output
    11. just return JSON object nothing else

    Please provide Only JSON data. Give me the output without any additional text or explanation.
    `;

    // Process each chunk in parallel
    const processChunk = async (chunkedText, index) => {
        chunkedText = chunkedText.replaceAll(',', ' ');
        const currentProviderTreatmentSummaryText = medicalBillPrompt.replace("CHUNKED_FILE_TEXT", chunkedText);
        try {
            const response = await processAi({content: currentProviderTreatmentSummaryText, jsonValidator: true, thinking: true});
            console.log(`Processed chunk ${index}`);
            
            if (response) {
                try {
                    let medialBillResp = response.split(',');
                    const parsedObject = JSON.parse(medialBillResp);
                    
                    // Add provider name to each entry
                    return parsedObject.medicalBillResp.map(values => {
                        return { ...values, medicalProviderName: providerName };
                    });
                } catch (error) {
                    console.log(`Error parsing response for chunk ${index}:`, error);
                    return [];
                }
            }
            return [];
        } catch (error) {
            console.log(`Error processing chunk ${index}:`, error);
            return [];
        }
    };

    // Create an array of promises for all chunks
    const chunkPromises = chunkedFileText.map((chunk, index) => processChunk(chunk, index));
    
    // Wait for all chunks to be processed
    const results = await Promise.all(chunkPromises);
    
    // Flatten the results array
    const processedData = results.flat();
    
    // Update combinedObject with the flattened results
    combinedObject = [...combinedObject, ...processedData];

    // Handle the provider name logic
    if (providerName !== lastProviderName) {
        medicalBillwithProviderName.push({
            name: providerName,
            combinedObject
        });
    } else {
        const lastProviderTreatmentDates = medicalBillwithProviderName.at(-1).combinedObject;
        medicalBillwithProviderName.at(-1).combinedObject = [...lastProviderTreatmentDates, ...combinedObject];
    }

    return combinedObject;
};





module.exports = {
    processmedicalBillChatGptProcessor,
}