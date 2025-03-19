
const { processAi } = require('./ChatGptPdfProcessor')

const getClientName = (userData) => {
    const genderPrefix = userData?.painAndSuffering?.gender === "Male" ? "Mr." : "Ms.";
    const lastName = userData?.caseInfo?.clientName?.trim().split(" ").at(-1);
    return `${genderPrefix} ${lastName}`;
};

const splitStringIntoChunks = (string, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < string.length; i += chunkSize) {
        chunks.push(string.substring(i, i + chunkSize));
    }
    return chunks;
}

const getRawExecutiveSummary = (userData, medicalRecord) => {
    try {
        const clientName = getClientName(userData)
        const reportData = JSON.stringify(medicalRecord)

        return `The patient's name is: ${clientName} 
        Here are there medical records
        ${reportData}`
    } catch (e) {
        throw e
    }
}

const getRawSummaries = ({ medicalRecords, userData }) => {
    const rawSummaryData = []

    for (const medicalRecord of medicalRecords) {
        const executiveSummary =  getRawExecutiveSummary(userData, medicalRecord)
        rawSummaryData.push(executiveSummary)
    }

    return rawSummaryData
}

const getProcessedExecutiveSummary = async (content) => {
    try {
        let processedExecutiveSummary = [];
        const chunkSize = 70000
        const chunkedText = splitStringIntoChunks(content, chunkSize)

        for (let i = 0; i < chunkedText.length; i++) {
            const prompt = `Write a 3 paragraph executive summary of the following medical information so that a lawyer can quickly review the most relevant information: ${chunkedText[i]}. Please give Summary only, do NOT provide any title or other information. If no information is included in the summaries just return "No medical records were provided". ONLY INCLUDE THE SUMMARY ITSELF, DO NOT CREATE OR ADD AN ADDITIONAL INTRO.`;

            const reponse = await processAi({content: prompt})
            processedExecutiveSummary.push(reponse)
        }

        const combinePrompt = `Take the following executive summaries of various medical records and combine them into a 2-3 paragraph summary of the medical records so that a personal injury plaintiff's lawyer can quickly review the most relevant information. Summaries: ${processedExecutiveSummary}. 
        Please give the 2-3 paragraph executive summary text only, do NOT include any title or other information.
        If no information is included in the summaries just return "No medical records were provided."
        ONLY INCLUDE THE SUMMARY ITSELF, DO NOT CREATE OR ADD AN ADDITIONAL INTRO.`;
        const combinedresponse = await processAi({content: combinePrompt})
        return combinedresponse;
    } catch (e) {
        console.log(e)
    }
}

const getSummary = async ({ medicalRecords, userData }) => {
    let rawSummaryData = [];
    const medicalRecordsData = medicalRecords.flat();
    if (medicalRecordsData.length > 0) {
        rawSummaryData = getRawSummaries({ medicalRecords: medicalRecordsData, userData });
    }


    let processedSummaryData = [];
    for (const rawSummary of rawSummaryData) {
        processedSummaryData.push(getProcessedExecutiveSummary(rawSummary));
    }
    processedSummaryData = await Promise.all(processedSummaryData);


    const combinePrompt = `Read the following medical records and combine them into a single 2-3 paragraph summary of the medical records so that a lawyer can quickly review the most relevant information. 
    Summaries: ${processedSummaryData.join(' ')}
    Make sure to include at least 2 paragraphs of summary.
    If no information is included in the summaries just return "No medical records were provided."
    ONLY INCLUDE THE SUMMARY ITSELF, DO NOT CREATE OR ADD AN ADDITIONAL INTRO.`;
    const summary = await processAi({content: combinePrompt});

    return summary;
}

module.exports = {
    getSummary
}