const { chatGpt } = require('../Contant');
const { processAi } = require('./ChatGptPdfProcessor');
const { saveChatGptData, saveErrorLog } = require('./SaveChatGptResponse');
const { lifeExpectancyTable, femaleLifeExpectancyTable } = require('./lifeExpectancy');
const InvoiceService = require('../src/utils/invoiceService');
const fs = require('fs');
const { sendInvoiceMail } = require('../src/utils/mailService');
const CaseSchema = require('../src/db/models/Case');
const { default: mongoose } = require('mongoose');
const { createAndSaveSetttlementReportWord } = require('./wordService');
const UserSchema = require('../src/db/models/User');
const CompaniesSchema = require('../src/db/models/Companies');
const { DEMAND_TYPE, CASE_TYPE, CASE_TYPE_DEMANDS, DEMAND } = require('../src/utils/enum');
const createMedicalChronology = require('./medicalChronology');

const processeandGenerateDemandLetter = async (liability, injury, damage, caseModel, policeReportSummary, painAndSuffering, socketService, caseId, userId, domainName, findCaseModel, isEditedCase) => {
    try {
        console.log("Creating Demand Letter for Case:", caseId)
        let liabilityAnalysisResponse = "";
        let injuryAnalysisResponse = "";
        let lossofIncomeResponse = "";
        // let conclusionResponse = "";
        let nonEconomicalDamageReponse = ""
        // const promptInput = getPromptInput({ liability, injury, damage, medicalBillData })
        // const ageExpectancy = getLifeExpectancy(injury.age, injury.gender)
        const liabilityAnalysisRefinedPrompt = chatGpt.promptSpecifications.liabilityAnalysis.replace(/U\.S\.A/g, findCaseModel?.detailsInput?.caseInfo?.stateOfIncident)
        const liabilityAnalysisPrompt = `Summary of accident :-${liability.description}` + `${findCaseModel?.detailsInput?.caseInfo?.dateOfIncident}` + liabilityAnalysisRefinedPrompt;
        const injuryAnalysisPrompt = `Write a short paragraph Injuries analysis of patient, Using given information :-` + `${injury.injuredBodyPartsWithPainLevel}`
        const nonEconomicalDamagePrompt = `Write a short paragraph Non-economical loss of patient,Using given information :- ${injury.impactOfInjuries}`

        let painAndSufferingPromt = (painAndSuffering?.descriptionText || painAndSuffering?.selectedPainPoints) ? chatGpt.promptSpecifications.painAndSufferingPrePrompt + `
        The client has experienced negative impacts following an accident.

        Using the provided set of negative impacts and descriptions, please generate multiple detailed paragraphs focusing on "Pain and Suffering" for a liability demand letter. Do not include headings or bullet points.
        Use the example as a rough guideline, the struture does not have to match but the detail, tone, and length should be similar
        Use gender-specific pronouns based on the client's gender (${painAndSuffering?.gender}). 
        Write in formal legal terminology from a third-person perspective.
        Avoid repetitive statements.
        Do not include an introduction or explanation, only return the actual pain and suffering paragraphs.
        There is a static introduction included in all demands, do not include the introduction in your response.

        STATIC INTRODUCTION: Under California law, the jury will be instructed to compensate our client for what could be decades of past and future non-economic damages in the form of past and future physical pain, mental suffering, loss of enjoyment of life, disfigurement, physical impairment, inconvenience, grief, anxiety, humiliation, indignity, embarrassment, and emotional distress suffered due to this accident. CACI 3905A; Capelouto v. Kaiser Foundation Hospitals (1972) 7 Cal. 3d 889, 892-893. As the foregoing medical summary has outlined, The client has most certainly experienced many [if not all] of these non-economic damages in a painfully significant and life-altering way.
        CLIENT NAME: ${findCaseModel?.detailsInput?.caseInfo?.clientName || ""}
        NEGATIVE IMPACTS: ${painAndSuffering?.selectedPainPoints || ""}
        DESCRIPTIONS: ${painAndSuffering?.descriptionText || ""}` : "";

        //console.log("pain and suffering prompt is: ", painAndSufferingPromt)

        let count = 0;
        count = count + 1;
        await socketService.completionDemandLetter(count, caseModel?._id, userId, domainName)
        const liabilityAnalysisPromptResponsePromise = await processAi({content: liabilityAnalysisPrompt})
        count = count + 1;
        await socketService.completionDemandLetter(count, caseModel?._id, userId, domainName)
        const injuryAnalysisPromptResponsePromise = await processAi({content: injuryAnalysisPrompt})
        // const nonEconomicalDamagePromptResponsePromise = await processAi(nonEconomicalDamagePrompt)
        count = count + 1;
        await socketService.completionDemandLetter(count, caseModel?._id, userId, domainName)
        count = count + 1;
        await socketService.completionDemandLetter(count, caseModel?._id, userId, domainName)
        const painAndSufferingPromtRes = painAndSufferingPromt ? await processAi({content: painAndSufferingPromt}) : "";

        await Promise.all([liabilityAnalysisPromptResponsePromise, injuryAnalysisPromptResponsePromise,
            painAndSufferingPromtRes
        ]).then(async (resp) => {
            liabilityAnalysisResponse = policeReportSummary ? policeReportSummary : liabilityAnalysisPromptResponsePromise;
            injuryAnalysisResponse = injuryAnalysisPromptResponsePromise;
            nonEconomicalDamageReponse = ""
            const painAndSufferingReport = painAndSufferingPromtRes ? painAndSufferingPromtRes : "";
            let paramsObject = {
                isDemandLetterGenerated: true,
                liabilityAnalysisReport: { liabilityAnalysisResponse }, injuryAnalysisReport: { injuryAnalysisResponse },
                nonEconomicalDamageAnalysis: { nonEconomicalDamageReponse },
                painAndSufferingReport
            }
            console.log('caseid to remove', caseId)
            await saveChatGptData(paramsObject, caseModel, domainName)
        })

        const eligibleDemands = CASE_TYPE_DEMANDS[caseModel?.detailsInput?.caseInfo?.caseType ?? CASE_TYPE.AUTO_ACCIDENT]
        const demandArr = eligibleDemands?.map(async (value) => {
            try {
                let S3DocxPath;
                if (value === DEMAND.Medical_Chronology) {
                    S3DocxPath = createMedicalChronology(domainName, caseModel?._id, DEMAND_TYPE[value]);
                } else {
                    S3DocxPath = createAndSaveSetttlementReportWord(domainName, caseModel?._id, DEMAND_TYPE[value]);
                }
                return S3DocxPath
            } catch (error) {
                console.log("Error in word service ", error)
                throw error;
            }
        });

        await Promise.all(demandArr)

        if (!isEditedCase) {

            const DbConnect = mongoose.connection.useDb(domainName);
            const caseDbModel = DbConnect.model("cases", CaseSchema);
            const caseInfo = await caseDbModel.findById(caseModel?._id).select("s3UniqueId userId").lean();

            const userDbModel = DbConnect.model("users", UserSchema);
            const userData = await userDbModel.findById(caseInfo.userId).lean();
            const masterDbConnect = mongoose.connection.useDb('master');
            const companyDbModel = masterDbConnect.model("Companies", CompaniesSchema);
            const companyData = await companyDbModel.findOne({ domainName: userData?.domainName });



            const hasMonthlySubscription = companyData?.subscription?.demandsPerMonth > 0;
            const hasRemainingDemands = companyData?.subscription?.remainingDemand > 0;

            let demandPrice = (hasMonthlySubscription && hasRemainingDemands)
                ? companyData?.subscription?.monthlyPrice / companyData?.subscription?.demandsPerMonth
                : companyData?.subscription?.costPerAdditionalDemand;
            let address = companyData?.companyAddress
            let companyName = companyData?.companyName

            const pdfPath = await InvoiceService(userId, caseModel?._id, liability.caseName, caseModel.createdOn, caseInfo?.s3UniqueId, demandPrice, domainName, companyName, address)

            await caseDbModel.findOneAndUpdate({ _id: caseModel?._id }, { invoiceFilePath: pdfPath }).lean();
            const mail = companyData?.accountantemail;
            let sendInvoiceMailRes = await sendInvoiceMail(mail, pdfPath);
            await socketService.invoiceMailRes(userId,
                {
                    success: Boolean(sendInvoiceMailRes),
                    email: mail,
                }
            );
        }

        return true
    } catch (e) {
        console.log(e)
        const errorCode = 500
        const errorDescription = e.message
        await saveErrorLog(caseId, userId, errorCode, errorDescription, domainName);
        await socketService.caseUpdates(userId, { caseId: caseModel?._id, isCaseGeneratedSccessfuly: false })
    }
}
const getPromptInput = ({ liability, injury, damage, mergedExtractedPdfText, medicalBillData }) => {

    // const billAmount = medicalBillData?.map(values => values?.totalBillAmount.replace('$', ''));
    const billAmount = medicalBillData?.map((values) => values?.totalBillAmount)
    // medicalBillData.map((values) => { values.map((data) => console.log(data.totalBillAmount)) })
    let medicalBillAmount = billAmount?.length > 1 ? billAmount?.reduce((acc, currentValue) => acc + parseFloat(currentValue), 0) : billAmount;

    const conclusionPrompt = damage.WorkHoursMissed === "" && damage.hourlyIncomeRate === "" && damage.typeofWork === "" ?
        `List of total number of medical bills :- ${parseInt(medicalBillAmount)}`
        : `List of total number of medical bills :- ${parseInt(medicalBillAmount)}
    List all time you missed from work as a result of the accident or your medical treatment :- ${damage.WorkHoursMissed}
    Type of work :- ${damage.typeofWork}
    List your employer, type of work, and your hourly income rate :- ${damage.hourlyIncomeRate}
    In conclusion first add ${parseInt(damage.WorkHoursMissed) * parseInt(damage.hourlyIncomeRate) * 4} and the total hourly income with mdical bill.`

    return `Name of victim :- ${liability.name}
    Name of faulty driver :- ${liability.faulterName}
    Date of accident :- ${liability.date}
    State in which accident occured :- ${liability.state}
    Summary of accident :- ${liability.description}
    Injured body parts of victim :- ${injury.injuredBodyPartsWithPainLevel}
    Life of victim during three months after the injuries and pain of accident :-${injury.impactOnLife} 
    Write a short paragraph economical loss of patient, User given information :- ${injury.impactOfInjuries}
    How victim life continues to be negatively affected by pain and injuries from this accident :- ${injury.impactOfInjuries} 
    write a conclusion using this information :- ${conclusionPrompt}
    `;
}
const getLifeExpectancy = (age, gender) => {
    let data;
    if (gender === "Male") {

        for (const entry of lifeExpectancyTable) {

            const ageRange = entry["Age Range"];

            const [startAge, endAge] = ageRange.split('-').map(Number);
            if (startAge <= age && age <= endAge) {

                console.log(entry["Expectation of life at age x"])

                data = entry["Expectation of life at age x"];

                return entry["Expectation of life at age x"];

            }

        }

    } else {

        for (const entry of femaleLifeExpectancyTable) {

            const ageRange = entry["Age Range"];

            const [startAge, endAge] = ageRange.split('-').map(Number);
            if (startAge <= age && age <= endAge) {

                console.log(entry["Expectation of life at age x"])

                data = entry["Expectation of life at age x"];

                return entry["Expectation of life at age x"];

            }

        }

    }

    return data
}



//

// ${''}${''} ${''} ${nonEconomicalDamagePromptResponsePromise.data.choices[0].message.content}

// ${''}${''} ${''} ${injuryAnalysisPromptResponsePromise.data.choices[0].message.content}

module.exports = {
    processeandGenerateDemandLetter
}