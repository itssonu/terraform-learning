const { CASE_TYPE } = require("../src/utils/enum");
const { processAi } = require("./ChatGptPdfProcessor");
const { getTextAndExhibit } = require("./ProcessingPdfServices");
const { saveErrorLog, saveChatGptData } = require("./SaveChatGptResponse");

const getLLMResult = async (prompt, fileText, liability, caseId, userId, domainName) => {
    try {
        const maxTokensSize = 90000
        let combinedObject = [];
        for (let i = 0; i < fileText.length; i += maxTokensSize) {
            const textChunk = fileText.substr(i, maxTokensSize); // Get text according size
            let conncatString = `${prompt} ${textChunk}`;
            let responseData = await processAi({content: conncatString});
            combinedObject.push(responseData)
        }
        return combinedObject.join('').replace(/P-1/g, liability?.name).replace(/P-2/g, liability?.faulterName)
    } catch (e) {
        console.log(e)
        const errorCode = 500
        const errorDescription = e.message
        await saveErrorLog(caseId, userId, errorCode, errorDescription, domainName);
    }
}



const processFile = async (prompt, FileArr, userId, liability, caseModel, domainName, exhibitKey) => {
    const caseId = caseModel._id;
    try {
        let fileTextArr = [];
        for (const reportFile of FileArr) {
            const fileText = await getTextAndExhibit(reportFile, liability, exhibitKey, caseId, domainName);
            const filterText = fileText.replace(/\s+/g, ' ').trim(); // Remove white space
            fileTextArr.push(filterText);
        }
        let llmResultArr = [];
        for (const fileText of fileTextArr) {
            try {
                let llmResult = await getLLMResult(prompt, fileText, liability, caseId, userId, domainName)
                llmResultArr.push(llmResult)
            }
            catch (err) {
                console.log(err)
                const errorCode = 500
                const errorDescription = err.message
                await saveErrorLog(caseId, userId, errorCode, errorDescription, domainName);
            }
        }
        return llmResultArr;
    } catch (error) {
        console.log("Witness Report error", error)
        await saveErrorLog(caseId, userId, 500, error.message, domainName);
    }
};

exports.processLiabilityFiles = async (fileObject, userId, liability, caseModel, domainName) => {

    const damage = caseModel?.detailsInput?.damage;
    const userData = caseModel?.detailsInput || "";
    const caseType = userData?.caseInfo?.caseType || "";
    const incidentText = liability?.incidentText || "";
    const dangerousConditions = liability?.dangerousConditions || "";
    const stateFactsNotice = liability?.stateFactsNotice || "";
    const factsFailureClaim = liability?.factsFailureClaim || "";
    const factsConsumerExpectation = liability?.factsConsumerExpectation || "";
    const factsRipkBenefit = liability?.factsRipkBenefit || "";
    const factsManufacturingDefect = liability?.factsManufacturingDefect || "";

    const incidentReportFile = fileObject?.incidentReportFile || null;
    const witnessStatementFile = fileObject?.witnessStatementFile || null;
    const expertSafetyReport = fileObject?.expertSafetyReport || null;
    const lossOfEarningsFiles = damage?.lossOfEarningsReport || null;
    const medicalExpensesFiles = damage?.medicalExpensesReport || null;

    if (caseType === CASE_TYPE.TRIP_AND_FALL || caseType === CASE_TYPE.SLIP_AND_FALL || caseType === CASE_TYPE.PREMISE_LIABILITY) {
        const dataArr = [
            {
                exhibitKey: "incidentExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: incidentReportFile
            },
            {
                exhibitKey: "witnessExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: witnessStatementFile
            },
            {
                exhibitKey: "expertReportExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: expertSafetyReport
            }
        ]

        const processFileArr = dataArr.map((element) => {
            if (!element.file) return "";
            return processFile(element.prompt, element.file, userId, liability, caseModel, domainName, element.exhibitKey);
        });

        const [incidentReportLLMReult, witnessStatementFileLLMResult, expertSafetyReportLLMResult] = await Promise.all(processFileArr);
        const LLMFactsOfIncidentPrompt = `Here is an existing "Facts of the Incident" section from a demand letter regarding a motorcycle crash, none of the facts contained witihn this passage are relevant to the following task only pay attention to styling, word choice, and level of detail:
        
        Client was driving the motorcycle on Sunset Boulevard, west of
        Greenfield Avenue, in Los Angeles. The street was dry and visibility was clear. Client was
        wearing a DOT compliant helmet with other personal protective equipment covering her body.
        While traveling with the flow of traffic and below the posted speed limit, she crested a hill with a
        sweeping leftward turn. She recognized traffic was slowing in front of her. She squeezed her
        front brake lever to slow then stop the motorcycle, but the motorcycle did not respond. As a
        direct and proximate result of her inability to brake her motorcycle, and despite best efforts, she
        was forced to lay down her bike. Her body only came to rest after violently striking the rearbumper of a Prius stopped in a line of cars.

        Used to following pieces of text to create a "Facts of the Incident" section of a new demand letter, disregard any case facts from the above passage and only use the folloiwng set of case information to create the new section.
        Case information: ${incidentText} ${incidentReportLLMReult} ${JSON.stringify(userData, null, 2)}

        
        Write the section for a demand letter that will be reviewed by multiple lawyers.
        This LLM response will be included directly in the demand letter, only generate the relevant section.
         Now, write the "Facts of the Incident" section. Remember:
            - Do not include a heading or title
            - Present the facts in a clear, chronological order
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;
        const LLMDangerousConditionPrompt = `Used to following pieces of text to create a "Dangerous Conditions" section of a demand letter.
        Case information: ${dangerousConditions} ${witnessStatementFileLLMResult} ${expertSafetyReportLLMResult}
        This LLM response will be included directly in the demand letter, only generate the relevant section.
        Now, write the "Dangerous Conditions" section. Remember:
            - Do not include a heading or title
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;
        const LLMACNoticePrompt = `Used to following pieces of text to create a "Actual or Constructive Notice" section of a demand letter.
        Case information: ${stateFactsNotice} ${witnessStatementFileLLMResult} ${expertSafetyReportLLMResult}
        This LLM response will be included directly in the demand letter, only generate the relevant section.
        Now, write the "Actual Constructive Notice" section. Remember:
            - Do not include a heading or title
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;

        const [LLMFactsOfIncident, LLMDangerousCondition, LLMACNotice] = await Promise.all([
            LLMFactsOfIncidentPrompt.trim() ? processAi({content: LLMFactsOfIncidentPrompt}) : "",
            LLMDangerousConditionPrompt.trim() ? processAi({content: LLMDangerousConditionPrompt}) : "",
            LLMACNoticePrompt.trim() ? processAi({content: LLMACNoticePrompt}) : "",
        ]);

        let obj = {
            LLMFactsOfIncident,
            LLMDangerousCondition,
            LLMACNotice
        }
        await saveChatGptData(obj, caseModel, domainName);
    }
    else if (caseType === CASE_TYPE.DOG_BITE) {
        const dataArr = [
            {
                exhibitKey: "incidentExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: incidentReportFile
            },
            {
                exhibitKey: "witnessExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: witnessStatementFile
            }
        ]

        const processFileArr = dataArr.map((element) => {
            if (!element.file) return "";
            return processFile(element.prompt, element.file, userId, liability, caseModel, domainName, element.exhibitKey);
        });

        const [incidentReportLLMReult, witnessStatementFileLLMResult] = await Promise.all(processFileArr);
        const LLMFactsOfIncidentPrompt = `Here is an existing "Facts of the Incident" section from a demand letter regarding a motorcycle crash, none of the facts contained witihn this passage are relevant to the following task only pay attention to styling, word choice, and level of detail:
        
        Client was driving the motorcycle on Sunset Boulevard, west of
Greenfield Avenue, in Los Angeles. The street was dry and visibility was clear. Client was
wearing a DOT compliant helmet with other personal protective equipment covering her body.
While traveling with the flow of traffic and below the posted speed limit, she crested a hill with a
sweeping leftward turn. She recognized traffic was slowing in front of her. She squeezed her
front brake lever to slow then stop the motorcycle, but the motorcycle did not respond. As a
direct and proximate result of her inability to brake her motorcycle, and despite best efforts, she
was forced to lay down her bike. Her body only came to rest after violently striking the rearbumper of a Prius stopped in a line of cars.

        Used to following pieces of text to create a "Facts of the Incident" section of a new demand letter, disregard any case facts from the above passage and only use the folloiwng set of case information to create the new section.
        Case information: ${incidentText} ${incidentReportLLMReult} ${witnessStatementFileLLMResult} ${JSON.stringify(userData, null, 2)}

        Write the section for a demand letter that will be reviewed by multiple lawyers.
        This LLM response will be included directly in the demand letter, only generate the relevant section.
         Now, write the "Facts of the Incident" section. Remember:
            - Do not include a heading or title
            - Present the facts in a clear, chronological order
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;

        const [LLMFactsOfIncident] = await Promise.all([
            LLMFactsOfIncidentPrompt.trim() ? processAi({content: LLMFactsOfIncidentPrompt}) : "",
        ]);

        let obj = {
            LLMFactsOfIncident
        }
        await saveChatGptData(obj, caseModel, domainName);
    }
    else if (caseType === CASE_TYPE.PRODUCT_LIABILITY) {
        const dataArr = [
            {
                exhibitKey: "incidentExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: incidentReportFile
            },
            {
                exhibitKey: "witnessExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: witnessStatementFile
            },
            {
                exhibitKey: "expertReportExhibitDirectoryPath",
                prompt: `Read the following File and combine them into a single 3-5 paragraph summary of the File so that a lawyer can quickly review the most relevant information.`,
                file: expertSafetyReport
            }
        ]

        const processFileArr = dataArr.map((element) => {
            if (!element.file) return "";
            return processFile(element.prompt, element.file, userId, liability, caseModel, domainName, element.exhibitKey);
        });

        const [incidentReportLLMReult, witnessStatementFileLLMResult, expertSafetyReportLLMResult] = await Promise.all(processFileArr);

        const LLMFactsOfIncidentPrompt = `Here is an existing "Facts of the Incident" section from a demand letter regarding a motorcycle crash, none of the facts contained witihn this passage are relevant to the following task only pay attention to styling, word choice, and level of detail:
        
        Client was driving the motorcycle on Sunset Boulevard, west of
Greenfield Avenue, in Los Angeles. The street was dry and visibility was clear. Client was
wearing a DOT compliant helmet with other personal protective equipment covering her body.
While traveling with the flow of traffic and below the posted speed limit, she crested a hill with a
sweeping leftward turn. She recognized traffic was slowing in front of her. She squeezed her
front brake lever to slow then stop the motorcycle, but the motorcycle did not respond. As a
direct and proximate result of her inability to brake her motorcycle, and despite best efforts, she
was forced to lay down her bike. Her body only came to rest after violently striking the rearbumper of a Prius stopped in a line of cars.

        Used to following pieces of text to create a "Facts of the Incident" section of a new demand letter, disregard any case facts from the above passage and only use the folloiwng set of case information to create the new section.
        Case information: ${incidentText} ${incidentReportLLMReult} ${JSON.stringify(userData, null, 2)}
        
        Write the section for a demand letter that will be reviewed by multiple lawyers.
        This LLM response will be included directly in the demand letter, only generate the relevant section.
         Now, write the "Facts of the Incident" section. Remember:
            - Do not include a heading or title
            - Present the facts in a clear, chronological order
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;
        const LLMAdequateWarningPrompt = `Used to following pieces of text to create a "Adequate Warning" section of a product liability demand letter.
        Case information: ${factsFailureClaim} ${witnessStatementFileLLMResult} ${expertSafetyReportLLMResult}
        This LLM response will be included directly in the demand letter, only generate the relevant section.
        Now, write the "Adequate Warning" section. Remember:
            - Do not include a heading or title
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;
        const LLMConsumerExpectationPrompt = `Used to following pieces of text to create a "Consumer Expectation" section of a product liability demand letter.
        Case information: ${factsConsumerExpectation} ${witnessStatementFileLLMResult} ${expertSafetyReportLLMResult}
        This LLM response will be included directly in the demand letter, only generate the relevant section.
        Now, write the "Consumer Expectations" section. Remember:
            - Do not include a heading or title
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;
        const LLMRiskBenefitPrompt = `Used to following pieces of text to create a "Risk Benefit" section of a product liability demand letter.
        Case information: ${factsRipkBenefit} ${witnessStatementFileLLMResult} ${expertSafetyReportLLMResult}
        This LLM response will be included directly in the demand letter, only generate the relevant section.
        Now, write the "Risk Benefit" section. Remember:
            - Do not include a heading or title
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;
        const LLMManufacturingDefectPrompt = `Used to following pieces of text to create a "Manufacturing Defect" section of a product liability demand letter.
        Case information: ${factsManufacturingDefect} ${witnessStatementFileLLMResult} ${expertSafetyReportLLMResult}
        This LLM response will be included directly in the demand letter, only generate the relevant section.
        Now, write the "Manufacturing Defect" section. Remember:
            - Do not include a heading or title
            - Use professional language appropriate for a legal document
            - Include relevant details that support the case
            - Be objective and avoid speculation or subjective statements
            - Ensure the narrative flows logically and is easy to follow
            - Do not add any analysis, explanations, or additional information beyond the facts provided
        `;

        const [LLMFactsOfIncident, LLMAdequateWarning, LLMConsumerExpectation, LLMRiskBenefit, LLMManufacturingDefect] = await Promise.all([
            LLMFactsOfIncidentPrompt.trim() ? processAi({content: LLMFactsOfIncidentPrompt}) : "",
            LLMAdequateWarningPrompt.trim() ? processAi({content: LLMAdequateWarningPrompt}) : "",
            LLMConsumerExpectationPrompt.trim() ? processAi({content: LLMConsumerExpectationPrompt}) : "",
            LLMRiskBenefitPrompt.trim() ? processAi({content: LLMRiskBenefitPrompt}) : "",
            LLMManufacturingDefectPrompt.trim() ? processAi({content: LLMManufacturingDefectPrompt}) : "",
        ]);

        let obj = {
            LLMFactsOfIncident,
            LLMAdequateWarning,
            LLMConsumerExpectation,
            LLMRiskBenefit,
            LLMManufacturingDefect
        }
        await saveChatGptData(obj, caseModel, domainName);
    }

    if(lossOfEarningsFiles){
        const prompt = `Write a short summary for loss of income for patient based on given information :- ${damage.hourlyIncomeRate} ${damage.WorkHoursMissed} ${damage.typeofWork}`;
        const onlyS3pathArr = lossOfEarningsFiles.map((elem)=>{
            return elem.s3UrlPath;
        });
        const  llmResult =  await processFile(prompt, onlyS3pathArr, userId, liability, caseModel, domainName, "lossOfEarningsExhibitPaths");
        await saveChatGptData({lossOfIncomeAnalysis : llmResult}, caseModel, domainName)
    }

    if(medicalExpensesFiles){
        const prompt = `Write a short summary for loss of income for patient based on given information :- ${damage.hourlyIncomeRate} ${damage.WorkHoursMissed} ${damage.typeofWork}`;
        const onlyS3pathArr = medicalExpensesFiles.map((elem)=>{
            return elem.s3UrlPath;
        });
        const  llmResult =  await processFile(prompt, onlyS3pathArr, userId, liability, caseModel, domainName, "medicalExpensesExhibitPaths");
        await saveChatGptData({medicalExpensesLLM : llmResult}, caseModel, domainName)
    }

}