const { processAi } = require("./ChatGptPdfProcessor");
const { saveErrorLog } = require("./SaveChatGptResponse");

const processingExpenseChatGptProcessor = async (fileText, liability, caseId, userId, domainName, filesCount) => {
    try {
        let combinedObject = [];

        const prompt = `Give me a JSON object as the response of this text completion API. 
    Structure of the object should be like:
    {
        "medicalExpenseBillResp": [
            { "totalBillAmount": "" }
        ]
    }
    Notes for the response:
    1. Extract total charges from medical billing data. Total charges should reflect the cumulative amount without adding individual amounts for each date.    
    2. Remove the currency sign from the totalBillAmount field.
    3. Provide the API response as an array of objects in JavaScript.
    4. Do not itemize the charges based on dates; instead, provide the total amount of the bill.
    5. Just return JSON object, nothing else.
    6. Only provide the total amount, nothing else.
    Please provide only JSON data. Give me the output without any additional text or explanation.`;

        const processChunk = async (chunkedText, index) => {
            chunkedText = chunkedText.replaceAll(',', ' ');
            const conncatString = `${prompt} ${chunkedText}`;
            try {
                const response = await processAi({ content: conncatString, jsonValidator: true });
                console.log(`Processed chunk ${index} for Bills`);

                if (response) {
                    try {
                        const parsedObject = JSON.parse(response);

                        if (parsedObject.medicalExpenseBillResp && Array.isArray(parsedObject.medicalExpenseBillResp)) {
                            return parsedObject.medicalExpenseBillResp.map(entry => ({
                                totalBillAmount: entry.totalBillAmount
                            }));
                        }
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

        // Ensure fileText is chunked properly (assuming chunkedFileText is an array of text chunks)
        const chunkedFileText = [fileText]; // Update this logic to chunk the file if necessary

        // Process all chunks in parallel
        const results = await Promise.all(chunkedFileText.map(processChunk));

        // Flatten the results to a single array of objects
        const processedData = results.flat();
        combinedObject = [...combinedObject, ...processedData];

        return combinedObject; // Returns properly formatted data
    } catch (e) {
        console.log(e);
        const errorCode = 500;
        const errorDescription = e.message;
        await saveErrorLog(caseId, userId, errorCode, errorDescription, domainName);
        return [];
    }
};


module.exports = {
    processingExpenseChatGptProcessor
}