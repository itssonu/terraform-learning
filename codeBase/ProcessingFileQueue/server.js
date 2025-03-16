const express = require('express');
const bodyParser = require('body-parser')
require('dotenv').config();
const fileUpload = require("express-fileupload");
const db = require('./src/db/dbConnection');
require('web-streams-polyfill');
const { processMedicalFileQueue, processMedicalBillFileQueue, processandGeneratePoliceReport, processPreMedicalFileQueue, getFileTextAndImage } = require('./ProcessingFileService/ProcessingFileQueueService');
const { policeReportChatGptProcessor } = require('./ProcessingFileService/ProcessingPoilceChatGptService');
const { processmedicalBillChatGptProcessor } = require('./ProcessingFileService/ProcessMedicalBillChatGptService');
const { saveChatGptData } = require('./ProcessingFileService/SaveChatGptResponse');
const { processeandGenerateDemandLetter } = require('./ProcessingFileService/ProcesseandGenerateDemandLetter');
const { generateMedicalTreatment, generatePreMedicalTreatment } = require('./ProcessingFileService/keyMedicalTreatmentSummary');
const { processandGenerateMedicalRecordsChatGptService, testFunction } = require('./ProcessingFileService/ProcessandGenerateMedicalRecordsChatGptService');
const socketHandlerModule = require('./ProcessingFileService/ProcessSocketService')
const app = express();
const { Server } = require('socket.io');
const { processFilesTotalRequest, processAi } = require('./ProcessingFileService/ChatGptPdfProcessor');
const { chatGpt, localStoreObj } = require('./Contant');
const mongoose = require("mongoose");
const server = require('http').createServer(app)
const CaseSchema = require('./src/db/models/Case');
const ErrorSchema = require('./src/db/models/ErrorLog')
const path = require('path');
const Jimp = require("jimp");
const { saveErrorLog } = require("./ProcessingFileService/SaveChatGptResponse");
const CompaniesSchema = require('./src/db/models/Companies');
const { s3Client } = require('./src/utils/aws/client');
const cors = require('cors');
const axios = require('axios');
const { isAuth } = require('./src/middelware/isAuth');
const { createAndSaveSetttlementReportWord } = require('./ProcessingFileService/wordService');
const { CASE_TYPE_DEMANDS, DEMAND_TYPE } = require('./src/utils/enum');
const { processLiabilityFiles } = require('./ProcessingFileService/processLiabilityFiles');
const DefaultThirdPartyPolicyLimitDemandSchema = require('./src/db/models/DefaultThirdPartyPolicyLimitDemand');
const DemandTemplateSchema = require('./src/db/models/DemandTemplateSchema');
const { DEMAND } = require('./src/utils/enum');
const ThirdPartyNonEconomicPolicyLimitSchema = require('./src/db/models/ThirdPartyNonEconomicPolicyLimit');
const UIMNonPolicyLimitDemandSchema = require('./src/db/models/UIMNonPolicyLimitDemand');
const UIMPolicyLimitDemandSchema = require('./src/db/models/UIMPolicyLimitDemand');
const UMPLDTemplate = require('./src/db/models/UMPLDTemplate');
const UMNPLDTemplate = require('./src/db/models/UMNPLDTemplate');
const SimplifiedTPPLDTemplate = require('./src/db/models/SimplifiedTPPLDTemplate');
const SimplifiedUIMPLDTemplate = require('./src/db/models/SimplifiedUIMPLDTemplate');
const SimplifiedUMPLDTemplate = require('./src/db/models/SimplifiedUMPLDTemplate');
const SettingSchema = require('./src/db/models/SettingSchema');
const CaseData = require('./src/db/models/Case')
const { getDBName } = require('./src/utils/helper');
const createMedicalChronology = require('./ProcessingFileService/medicalChronology');
const { AsyncLocalStorage } = require('async_hooks');
const { initLocalStorevalue, setLocalStorevalue, getLocalStorevalue } = require('./src/utils/localStore');

app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 100000 })); // Support encoded bodies
app.use(bodyParser.json({
    limit: "100mb",
    type: ["application/x-www-form-urlencoded", "application/json"], // Support json encoded bodies
}));
app.use(
    fileUpload({
        tempFileDir: "/tmp",
        useTempFiles: true,
        createParentPath: true
    })
);

// Array of allowed origins
const allowedOrigins = [process.env.BASE_URL, "https://" + process.env.BASE_URL, "https://www." + process.env.BASE_URL];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    optionSuccessStatus: 200,
};
app.options('/create', cors(corsOptions))
app.options('/PreProcessMedicalRecords', cors(corsOptions))



const socketIo = new Server(server,
    {
        cors: {
            origin: allowedOrigins,
            credentials: true
        }
    })
const socketService = new socketHandlerModule(socketIo);

function HandleCaseLoadingCalc(id, userId, domainName,isGenerateSummary) {
    this.caseId = id;
    this.userId = userId;
    this.domainName = domainName;
    this.maxValues = {
        policeReport: 20,
        medicalRecords: 20,
        medicalBills: 10,
        preMedicalRecords: 20,
        demandLetter: 29,
    };

    this.intervals = {
        policeReport: null,
        medicalRecords: null,
        medicalBills: null,
        preMedicalRecords: null,
        demandLetter: null
    };

    this.recordCounts = {
        policeReport: 0,
        medicalRecords: 0,
        medicalBills: 0,
        preMedicalRecords: 0,
        demandLetter: 0
    };

    this.isGenerateSummary = isGenerateSummary;

    this.timerCalc = {
        medicalRecords : {
            totalFiles : 0,
            filesCount : 0,
            totalPages : 0,
        },
        preMedicalRecords : {
            totalFiles : 0,
            filesCount : 0,
            totalPages : 0,
        }
    }

    this.updateTimer = function(fileType,pagesNumber){
        this.timerCalc[fileType].filesCount += 1;
        this.timerCalc[fileType].totalPages += pagesNumber;
        if(this.timerCalc[fileType].filesCount >= this.timerCalc[fileType].totalFiles){
            const timer = this.timerCalc[fileType].totalPages * 1000;
            this.startLoading(fileType,timer);
        }
    }

    this.updatePercent = function (progressKey,isDemandComplete=false) {
        const totalLoading = isDemandComplete ? 100 : Object.values(this.recordCounts).reduce((acc, val) => acc + val, 0);
        if(this.isGenerateSummary){
            const data = {
                caseId: this.caseId,
                medicalSummaryLoading: totalLoading
            };
            console.log("updatePercent",data);
            socketService.generateSummaryLoadingUpdate(this.userId, data);
        }else{
            const data ={
                caseLoadingPercentage: totalLoading
            }
            if(progressKey){
                data[`${progressKey}_progress`] = "Successful";
            }
            console.log("updatePercent",data);
            socketService.caseLoadingUpdate(this.userId,this.caseId, this.domainName, data);
        }
    };

    this.startLoading = function (key,timer=10000) {
        if (this.recordCounts[key] >= this.maxValues[key]) {
            this.stopLoading(key);
            return;
        }

        this.intervals[key] = setInterval(() => {
            if (this.recordCounts[key] >= this.maxValues[key]) {
                this.stopLoading(key);
                return;
            }
            this.recordCounts[key] += 1;
            this.updatePercent();
        }, timer);
    };

    this.stopLoading = function (key) {
        if (this.intervals[key]) {
            clearInterval(this.intervals[key]);
            this.intervals[key] = null;
        }
        this.recordCounts[key] = this.maxValues[key];
        this.updatePercent(key);
    };

    this.policeReportLoading = function () {
        this.startLoading("policeReport");
    };
    this.medicalReportLoading = function () {
        this.startLoading("medicalRecords");
    };

    this.medicalBillLoading = function () {
        this.startLoading("medicalBills");
    };

    this.preMedicalReportLoading = function () {
        this.startLoading("preMedicalRecords");
    };
    this.demandLetterLoading = function () {
        this.startLoading("demandLetter");
    };

    // Use this to check and fix if percentage is over 100
    this.completeProcessing = function() {
        if(this.loadingType === "generateSummary"){
            this.updatePercent(null,true);
        }else{
            this.updatePercent("demandLetter",true);
        }
        this.killLoader();
    };

    this.killLoader = function () {
        Object.keys(this.intervals).forEach(key => {
            clearInterval(this.intervals[key]);
            this.intervals[key] = null;
        });
    };
}

const eventAgenda = async (job, domainName) => {

    const isEditedCase = job?.isEditedCase

    let arrayPoliceFiles = job?.policeReportData
    let medicalRecordsData = job?.medicalRecordsData
    let medicalBillData = job?.medicalBillData
    let preMedicalRecordData = job?.preMedicalRecordsPdfData
    let liability = job?.liability
    let caseModel = job?.caseModel
    let userId = job?.userId
    let detailsInputPayload = job?.detailsInputPayload
    let { damage, medicalProviders,painAndSuffering } = detailsInputPayload
    let caseModelId = job?.caseModel?._id
    let incidentReportFile = job?.incidentReportFile || null;
    let expertSafetyReport = job?.expertSafetyReport || null;
    let witnessStatementFile = job?.witnessStatementFile || null;

    try {

        const masterDB = mongoose.connection.useDb('master');
        const Companies = masterDB.model("Companies", CompaniesSchema);
        const DbConnect = mongoose.connection.useDb(domainName);
        const CaseModal = DbConnect.model("cases", CaseSchema);

        try {
            const caseLoadingCalc = new HandleCaseLoadingCalc(caseModel._id, userId,domainName);
            setLocalStorevalue(localStoreObj.caseLoadingObj,caseLoadingCalc);
            console.log(`Case creation ${caseModel?._id} by user ${userId} with domain name ${domainName}`)
            const promise1 = ProcessPoliceFile(arrayPoliceFiles, caseModel, userId, liability, domainName);
            const promise2 = processMedicalFile(medicalRecordsData, caseModel, userId, liability, medicalProviders, domainName) // Pass caseModel here
            const promise3 = processPreMedicalFile(preMedicalRecordData, caseModel, userId, liability, medicalProviders, domainName)
            const promise4 = processLiabilityFiles({ incidentReportFile, expertSafetyReport, witnessStatementFile }, userId, liability, caseModel, domainName)

            await Promise.all([promise1, promise2, promise3, promise4]);

            await socketService.medicalRecordsProgress("Successful", caseModel?._id, userId, domainName);
            await socketService.preMedicalRecordsProgress("Successful", caseModel?._id, userId, domainName);

            await generateDemand(caseModel, liability, medicalProviders, damage, userId, domainName);

            //deducting cases from subscription plan of the company
            if (!isEditedCase) {
                await Companies.deductDemands(`${domainName}.demandpro.law`)
            }
            caseLoadingCalc.completeProcessing();
        }
        catch (err) {
            console.log('GOT Error in queue', err)
        }

    } catch (error) {
        console.log(error)
        let caseModelId = job?.caseModel?._id
        //done(error); // Mark the job as failed if an error occurs
        // Handle the error

        const errorCode = 500
        const errorDescription = error.message
        await saveErrorLog(caseModelId, userId, errorCode, errorDescription, domainName);
        // Mark the job as failed
        //job.fail(error);
        //  return Promise.reject(error);
    }
}

const ProcessPoliceFile = async (arrayPoliceFiles, caseModel, userId, liability, domainName) => {
    try {
        const caseLoadingCalc = getLocalStorevalue(localStoreObj.caseLoadingObj);
        caseLoadingCalc.policeReportLoading(); // start Police loading
        if (arrayPoliceFiles?.length === 0 && !liability?.description) {
            caseLoadingCalc.stopLoading("policeReport");
        }
        let fileTextArr = [];
        if (liability?.description) {
            fileTextArr = [liability?.description];
        } else {
            fileTextArr = await processandGeneratePoliceReport(arrayPoliceFiles, caseModel?._id, userId, socketService, liability, domainName); 
        }
        let aiResponseArr = [];
        for (const fileText of fileTextArr) {
            try {
                let policeReportSummary = await policeReportChatGptProcessor(fileText, liability, caseModel?._id, userId, domainName)
                aiResponseArr.push(policeReportSummary)
            }
            catch (err) {
                console.log(err)
                const errorCode = 500
                const errorDescription = err.message
                await saveErrorLog(caseModel?._id, userId, errorCode, errorDescription, domainName);
            }

        }
        let policeReportRecord = {
            policeReportChatGptResponse: aiResponseArr
        }
        await saveChatGptData(policeReportRecord, caseModel, domainName);
        caseLoadingCalc.stopLoading("policeReport");
        // await socketService.policeReportProgress("Successful", caseModel?._id, userId, domainName)
    }
    catch (err) {
        console.log(err)
        const errorCode = 500
        const errorDescription = err.message
        await saveErrorLog(caseModel?._id, userId, errorCode, errorDescription, domainName);
    }
}

const getVisitDatesFromMedicalRecords = async (medicalRecordText) => {
    try {

        const prompt = `Extract the date of the patient's hospital visit from the following medical record. Focus on identifying dates associated with hospital visits, examinations, or treatments from the text provided:
[text]. Return the date in the format 'MM/DD/YYYY'. If no relevant date is found, return an empty string (''). Only provide the date in the 'MM/DD/YYYY' format, and ensure that an empty string is returned if no visit date is identified.
`

        const promises = medicalRecordText.map(async (chunk) => {
            const content = prompt.replace('[text]', chunk);
            return await processAi({content: content});
        });

        const results = await Promise.all(promises);
        
        return results.filter(date => date && date.trim() !== '');

    } catch (e) {
        console.log(e)
    }

}


const processPreMedicalFile = async (arrayMedicalFiles, caseModel, userId, liability, injury, domainName) => {
    try {
        const caseLoadingCalc = getLocalStorevalue(localStoreObj.caseLoadingObj);
        caseLoadingCalc.timerCalc.preMedicalRecords.totalFiles = arrayMedicalFiles.length;
        const { extractedPdfTextArray: processPreMedicalFileextractedPdfText, providerNames: preMedicalProviderNames, medicalTypes: medicalType } = await getFileTextAndImage(arrayMedicalFiles, caseModel?._id, userId, socketService, "preMedicalRecordsProgress", liability, domainName, "preMedicalRecordsExhibitDirectoryPath");

        // Consolidate texts by provider
        const providerTextMap = new Map();
        processPreMedicalFileextractedPdfText.forEach((text, index) => {
            const providerName = preMedicalProviderNames[index];
            if (providerTextMap.has(providerName)) {
                providerTextMap.set(providerName, {
                    text: [...providerTextMap.get(providerName).text, ...text],
                    type: medicalType[index]
                });
            } else {
                providerTextMap.set(providerName, {
                    text: [...text],
                    type: medicalType[index]
                });
            }
        });

        // Convert the map to arrays
        const consolidatedTexts = [];
        const consolidatedProviders = [];
        const consolidatedTypes = [];

        providerTextMap.forEach((value, providerName) => {
            consolidatedTexts.push(value.text);
            consolidatedProviders.push(providerName);
            consolidatedTypes.push(value.type);
        });

        const medicalVisitsDatesPromise = consolidatedTexts.map(async (text) => {
            return await getVisitDatesFromMedicalRecords(text)
        })

        // Process all providers in parallel
        let providerPromises = consolidatedTexts.map(async (text, index) => {
            const providerName = consolidatedProviders[index];
            const medicalTypeName = consolidatedTypes[index];
            const pageCountBeforeCurrentProvider = consolidatedTexts
                .slice(0, index)
                .reduce((sum, texts) => sum + texts.length, 0);

            // Create a local providers array for this provider
            let localProviders = [];
            
            // Process this provider's text
            const { mediCalResponse } = await processandGenerateMedicalRecordsChatGptService(
                text,
                0, // updatedCompleteRequest - not needed when processing in parallel
                socketService,
                caseModel?._id,
                userId,
                injury,
                0, // count - not needed when processing in parallel
                caseModel,
                [providerName], // Pass just this provider name
                1, // Only processing one provider
                [medicalTypeName], // Pass just this provider type
                domainName,
                localProviders,
                pageCountBeforeCurrentProvider
            );

            // Return the processed provider data
            return {
                providerName,
                medicalTypeName,
                providerData: mediCalResponse[0] // The first (and only) element of the response
            };
        });

        // Wait for all providers to be processed
        const [nestedVisitDates] = await Promise.all([Promise.all(medicalVisitsDatesPromise), providerPromises]);

        const allVisitDates = [...new Set(nestedVisitDates.flat().filter(date => date))];
        await saveChatGptData({ preMedicalVisitDates: allVisitDates }, caseModel, domainName);

        // Wait for all providers to be processed
        const processedProviders = await Promise.all(providerPromises);
        
        // Merge providers based on their types
        const mergedProviders = mergeProvidersByType(processedProviders);
        
        // Save the merged providers data
        await saveChatGptData({ preMedicalRecords: [mergedProviders] }, caseModel, domainName);
        
        // Generate medical treatment paragraphs
        const keyMedicalTreatmentParagraphs = mergedProviders.length > 0 
            ? await generatePreMedicalTreatment(caseModel?._id, domainName, consolidatedTexts) 
            : "";
        
        await saveChatGptData({ preMedicalRecordsParagraphs: keyMedicalTreatmentParagraphs }, caseModel, domainName);
        await socketService.preMedicalRecordsProgress("Successful", caseModel?._id, userId, domainName);

        caseLoadingCalc.stopLoading("preMedicalRecords");

    } catch (error) {
        console.log(error);
        const errorCode = 500;
        const errorDescription = error.message;
        await saveErrorLog(caseModel?._id, userId, errorCode, errorDescription, domainName);
    }
};


const processMedicalFile = async (arrayMedicalFiles, caseModel, userId, liability, injury, domainName) => {
    try {
        const caseLoadingCalc = getLocalStorevalue(localStoreObj.caseLoadingObj);
        caseLoadingCalc.timerCalc.medicalRecords.totalFiles = arrayMedicalFiles.length;
        const { extractedPdfTextArray: processMedicalFileextractedPdfText, providerNames: medicalProviderNames, medicalTypes: medicalType } = await getFileTextAndImage(arrayMedicalFiles, caseModel?._id, userId, socketService, "medicalRecordsProgress", liability, domainName, "medicalRecordsExhibitDirectoryPath");

        // Consolidate texts by provider
        const providerTextMap = new Map();
        processMedicalFileextractedPdfText.forEach((text, index) => {
            const providerName = medicalProviderNames[index];
            if (providerTextMap.has(providerName)) {
                providerTextMap.set(providerName, {
                    text: [...providerTextMap.get(providerName).text, ...text],
                    type: medicalType[index]
                });
            } else {
                providerTextMap.set(providerName, {
                    text: [...text],
                    type: medicalType[index]
                });
            }
        });

        // Convert the map to arrays
        const consolidatedTexts = [];
        const consolidatedProviders = [];
        const consolidatedTypes = [];

        providerTextMap.forEach((value, providerName) => {
            consolidatedTexts.push(value.text);
            consolidatedProviders.push(providerName);
            consolidatedTypes.push(value.type);
        });

        const medicalVisitsDatesPromise = consolidatedTexts.map(async (text) => {
            return await getVisitDatesFromMedicalRecords(text)
        })

        // Process all providers in parallel
        let providerPromises = consolidatedTexts.map(async (text, index) => {
            const providerName = consolidatedProviders[index];
            const medicalTypeName = consolidatedTypes[index];
            const pageCountBeforeCurrentProvider = consolidatedTexts
                .slice(0, index)
                .reduce((sum, texts) => sum + texts.length, 0);

            // Create a local providers array for this provider
            let localProviders = [];
            
            // Process this provider's text
            const { mediCalResponse } = await processandGenerateMedicalRecordsChatGptService(
                text,
                0, // updatedCompleteRequest - not needed when processing in parallel
                socketService,
                caseModel?._id,
                userId,
                injury,
                0, // count - not needed when processing in parallel
                caseModel,
                [providerName], // Pass just this provider name
                1, // Only processing one provider
                [medicalTypeName], // Pass just this provider type
                domainName,
                localProviders,
                pageCountBeforeCurrentProvider
            );

            // Return the processed provider data
            return {
                providerName,
                medicalTypeName,
                providerData: mediCalResponse[0] // The first (and only) element of the response
            };
        });

        let billPromise = processMedicalBillFile(arrayMedicalFiles, caseModel, userId, liability, domainName, processMedicalFileextractedPdfText, medicalProviderNames, caseLoadingCalc);

        const [nestedVisitDates] = await Promise.all([Promise.all(medicalVisitsDatesPromise), Promise.all(providerPromises), billPromise]);

        const allVisitDates = [...new Set(nestedVisitDates.flat().filter(date => date))];
        await saveChatGptData({ visitDates: allVisitDates }, caseModel, domainName);

        // Wait for all providers to be processed
        const processedProviders = await Promise.all(providerPromises);
        
        // Merge providers based on their types
        const mergedProviders = mergeProvidersByType(processedProviders);
        
        // Save the merged providers data
        await saveChatGptData({ medicalRecords: [mergedProviders] }, caseModel, domainName);
        
        // Generate medical treatment paragraphs
        const keyMedicalTreatmentParagraphs = mergedProviders.length > 0 
            ? await generateMedicalTreatment(caseModel?._id, domainName, consolidatedTexts) 
            : "";
        
        await saveChatGptData({ medicalRecordsParagraphs: keyMedicalTreatmentParagraphs }, caseModel, domainName);
        await socketService.medicalRecordsProgress("Successful", caseModel?._id, userId, domainName);

        caseLoadingCalc.stopLoading("medicalRecords");
        
        // Process medical bill files
        // await processMedicalBillFile(arrayMedicalFiles, caseModel, userId, liability, domainName, processMedicalFileextractedPdfText, medicalProviderNames, caseLoadingCalc);

    } catch (error) {
        console.log(error);
        const errorCode = 500;
        const errorDescription = error.message;
        await saveErrorLog(caseModel?._id, userId, errorCode, errorDescription, domainName);
    }
};

// Helper function to merge providers based on their types
const mergeProvidersByType = (processedProviders) => {
    // Group providers by name
    const providerGroups = {};
    
    processedProviders.forEach(({ providerName, medicalTypeName, providerData }) => {
        if (!providerGroups[providerName]) {
            providerGroups[providerName] = [];
        }
        providerGroups[providerName].push({ medicalTypeName, providerData });
    });
    
    // Merge providers within each group
    const mergedProviders = [];
    
    Object.entries(providerGroups).forEach(([providerName, providers]) => {
        if (providers.length === 1) {
            // If there's only one provider with this name, add it directly
            mergedProviders.push(providers[0].providerData);
        } else {
            // If there are multiple providers with the same name, merge them based on type
            const mergedProvider = providers.reduce((merged, current) => {
                const { medicalTypeName, providerData } = current;
                
                // If this is the first provider being merged, use it as the base
                if (!merged) return providerData;
                
                // Merge based on medical type
                switch (medicalTypeName) {
                    case "All Other Medical Records":
                        // Merge treatment dates with deduplication
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            const uniqueDatesMap = new Map();
                            
                            [...merged.treatmentDates, ...providerData.treatmentDates].forEach(item => {
                                if (uniqueDatesMap.has(item.date)) {
                                    const existingItem = uniqueDatesMap.get(item.date);
                                    existingItem.treatmentDescription += `, ${item.treatmentDescription}`;
                                } else {
                                    uniqueDatesMap.set(item.date, { ...item });
                                }
                            });
                            
                            merged.treatmentDates = Array.from(uniqueDatesMap.values())
                                .sort((a, b) => new Date(a.date) - new Date(b.date));
                        }
                        
                        // Merge diagnosis if available
                        if (providerData.diagnosis) {
                            merged.diagnosis = merged.diagnosis 
                                ? [...merged.diagnosis, ...providerData.diagnosis] 
                                : providerData.diagnosis;
                        }
                        
                        // Merge objectFindings if available
                        if (providerData.objectFindings) {
                            merged.objectFindings = merged.objectFindings 
                                ? `${merged.objectFindings} ${providerData.objectFindings}` 
                                : providerData.objectFindings;
                        }
                        break;
                        
                    case "MRI Other Imaging":
                        // Simply append treatment dates and sort
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            merged.treatmentDates = [...merged.treatmentDates, ...providerData.treatmentDates]
                                .sort((a, b) => new Date(a.date) - new Date(b.date));
                        }
                        break;
                        
                    case "Surgery Center Reports":
                        // Merge treatment dates with deduplication
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            const uniqueDatesMap = new Map();
                            
                            [...merged.treatmentDates, ...providerData.treatmentDates].forEach(item => {
                                if (uniqueDatesMap.has(item.date)) {
                                    const existingItem = uniqueDatesMap.get(item.date);
                                    existingItem.treatmentDescription += `, ${item.treatmentDescription}`;
                                } else {
                                    uniqueDatesMap.set(item.date, { ...item });
                                }
                            });
                            
                            merged.treatmentDates = Array.from(uniqueDatesMap.values())
                                .sort((a, b) => new Date(a.date) - new Date(b.date));
                        }
                        break;
                        
                    case "ER":
                        // Merge by admitted date
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            const uniqueDatesMap = new Map();
                            
                            [...merged.treatmentDates, ...providerData.treatmentDates].forEach(item => {
                                if (!uniqueDatesMap.has(item.admittedDate)) {
                                    uniqueDatesMap.set(item.admittedDate, { ...item });
                                }
                            });
                            
                            merged.treatmentDates = Array.from(uniqueDatesMap.values())
                                .sort((a, b) => new Date(a.admittedDate) - new Date(b.admittedDate));
                        }
                        
                        // Merge imaging data if available
                        if (providerData.imagingData) {
                            merged.imagingData = merged.imagingData 
                                ? [...merged.imagingData, ...providerData.imagingData] 
                                : providerData.imagingData;
                        }
                        
                        // Merge physical examination data if available
                        if (providerData.physicalExaminationData) {
                            merged.physicalExaminationData = merged.physicalExaminationData 
                                ? [...merged.physicalExaminationData, ...providerData.physicalExaminationData] 
                                : providerData.physicalExaminationData;
                        }
                        
                        // Merge plan recommendation if available
                        if (providerData.planRecommendation) {
                            merged.planRecommendation = merged.planRecommendation 
                                ? [...merged.planRecommendation, ...providerData.planRecommendation] 
                                : providerData.planRecommendation;
                        }
                        break;
                        
                    case "Hospital":
                        // Merge by admitted date
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            const uniqueDatesMap = new Map();
                            
                            [...merged.treatmentDates, ...providerData.treatmentDates].forEach(item => {
                                if (!uniqueDatesMap.has(item.admittedDate)) {
                                    uniqueDatesMap.set(item.admittedDate, { ...item });
                                }
                            });
                            
                            merged.treatmentDates = Array.from(uniqueDatesMap.values())
                                .sort((a, b) => new Date(a.admittedDate) - new Date(b.admittedDate));
                        }
                        break;
                        
                    case "Consultation Reports":
                        // For consultation reports, we need a more complex merge
                        // This would ideally use an LLM to merge the data properly
                        // For now, we'll just combine the arrays
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            // Since consultation reports have a complex structure,
                            // we'll just append them and let downstream processing handle it
                            merged.treatmentDates = [...merged.treatmentDates, ...providerData.treatmentDates];
                        }
                        break;
                        
                    default:
                        // For unknown types, just append the data
                        if (merged.treatmentDates && providerData.treatmentDates) {
                            merged.treatmentDates = [...merged.treatmentDates, ...providerData.treatmentDates];
                        }
                }
                
                return merged;
            }, null);
            
            mergedProviders.push(mergedProvider);
        }
    });
    
    return mergedProviders;
};

const removeDuplicateDates = (data) => {
    const uniqueDates = {};
    const result = [];
    data = data.flat()
    for (const item of data) {
        const key = `${item.date}_${item.totalBillAmount}`;

        if (!uniqueDates[key]) {
            result.push(item);
            uniqueDates[key] = true;
        }
    }

    return result;
};

const generateDemand = async (caseModel, liability, injury, damage, userId, domainName) => {
    const caseLoadingCalc = getLocalStorevalue(localStoreObj.caseLoadingObj);
    caseLoadingCalc.demandLetterLoading()
    const db = mongoose.connection.useDb(domainName);
    const CaseModal = db.model("cases", CaseSchema);
    const findcaseModel = await CaseModal.findById(caseModel._id);
    const isDemandDraftGenerated = await processeandGenerateDemandLetter(liability, injury, damage, caseModel, findcaseModel?.result?.policeReportChatGptResponse, findcaseModel?.detailsInput?.painAndSuffering, socketService, caseModel?._id, userId, domainName, findcaseModel);
    if (isDemandDraftGenerated) {
        await socketService.completionDemandLetter('Successful', caseModel?._id, userId, domainName);
        caseLoadingCalc.stopLoading("demandLetter");
    } else {
        await socketService.toaster(userId, { success: false, message: 'Error in generating demand draft' });
    }
}


const processMedicalBillFile = async (arrayMedicalFiles, caseModel, userId, liability, domainName, processMedicalBillFileextractedPdfText, medicalProviderNames, caseLoadingCalc) => {
    try {
        caseLoadingCalc.medicalBillLoading();
        let medicalBillChatGptResponse = [];
        let chunkSize = chatGpt.chunkSize;
        let totalRequests = 0;
        
        // Calculate total requests (keeping this sequential as it's likely fast)
        for await (const iterator of processMedicalBillFileextractedPdfText) {
            totalRequests += await processFilesTotalRequest(chunkSize, iterator.join().replace(/\s+/g, ' ').trim());
        }
        
        let medicalProviderBillCount = 0;
        let medicalBillwithProviderName = [];
        let combinedObject = [];
        
        if (arrayMedicalFiles) {
            medicalProviderBillCount = medicalProviderNames.length;
        }

        // Process each medical provider concurrently
        const processMedicalProvider = async (iterator, index) => {
            try {
                const { medicalBillResponse } = await processmedicalBillChatGptProcessor(
                    iterator.join(''), 
                    0, // Using 0 as we're not tracking completedRequests in parallel version
                    socketService, 
                    caseModel?._id, 
                    userId, 
                    medicalProviderNames, 
                    index, 
                    medicalProviderBillCount, 
                    domainName, 
                    medicalBillwithProviderName, 
                    combinedObject
                );
                
                let billData = [];
                let flattenedResponse = [];
                
                // Flatten the nested array if needed
                if (medicalBillResponse && Array.isArray(medicalBillResponse)) {
                    if (medicalBillResponse.some(item => Array.isArray(item))) {
                        medicalBillResponse.forEach(innerArray => {
                            if (Array.isArray(innerArray)) {
                                innerArray.forEach(element => {
                                    flattenedResponse.push(element);
                                });
                            } else {
                                flattenedResponse.push(innerArray);
                            }
                        });
                    } else {
                        flattenedResponse = medicalBillResponse;
                    }
                }
                
                billData.push(flattenedResponse);
                const filteredMedicalBillResp = removeDuplicateDates(billData);
                
                return filteredMedicalBillResp;
            } catch (err) {
                console.log(`Error processing medical provider ${index}:`, err);
                const errorCode = 500;
                const errorDescription = err.message;
                await saveErrorLog(caseModel?._id, userId, errorCode, errorDescription, domainName);
                return [];
            }
        };

        // Create an array of promises for each medical provider
        const processingPromises = processMedicalBillFileextractedPdfText.map((iterator, index) => 
            processMedicalProvider(iterator, index)
        );
        
        // Wait for all medical providers to be processed
        const results = await Promise.all(processingPromises);
        
        // Collect all results
        medicalBillChatGptResponse = results;
        
        // Save the processed data
        let medicalBillRecords = {
            medicalBillRecords: medicalBillChatGptResponse.flat()
        };
        
        await saveChatGptData(medicalBillRecords, caseModel, domainName);
        await socketService.medicalBillProgress("Successful", caseModel?._id, userId, domainName);
        caseLoadingCalc.stopLoading("medicalBills");
        
    } catch (error) {
        console.log(error);
        const errorCode = 500;
        const errorDescription = error.message;
        await saveErrorLog(caseModel?._id, userId, errorCode, errorDescription, domainName);
    }
};

app.post('/GetErrorLog', async (req, res) => {
    const DbConnect = mongoose.connection.useDb(req.body.domainName);
    try {
        // Disconnect from the current MongoDB connection
        const Error = DbConnect.model("errorlog", ErrorSchema);
        const caseId = req.body.caseId;
        const errorlogs = await Error.find({ caseId });
        const mappedErrorLogs = errorlogs.map((values) => values.toObject());
        res.json(mappedErrorLogs);

    } catch (err) {
        console.error(err);
    }
});


app.post('/DeleteCase', async (req, res) => {
    console.log("req.body", req.body);

    const DbConnect = mongoose.connection.useDb(req.body.domainName);
    const CaseModel = DbConnect.model("cases", CaseSchema);

    try {
        const caseId = new mongoose.Types.ObjectId(req.body.caseId);  // Correct instantiation

        const findCaseById = await CaseModel.findById(caseId);

        if (findCaseById) {
            const deleteS3Files = async (params) => {
                try {
                    const data = await s3Client.listObjectsV2(params).promise();
                    if (data.Contents.length === 0) return;

                    const deletePromises = data.Contents.map(obj => {
                        const deleteParams = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: obj.Key
                        };
                        return s3Client.deleteObject(deleteParams).promise().then(() => {
                            console.log('Object deleted successfully:', obj.Key);
                        }).catch(err => {
                            console.error('Error deleting object:', err);
                        });
                    });

                    await Promise.all(deletePromises);
                } catch (err) {
                    console.error('Error listing objects:', err);
                }
            };

            const params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Prefix: `${req.body.domainName}/${findCaseById.userId}/${caseId}/`
            };

            await deleteS3Files(params);

            if (findCaseById.s3UniqueId) {
                const params2 = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Prefix: `${req.body.domainName}/${findCaseById.userId}/${findCaseById.s3UniqueId}/`
                };
                await deleteS3Files(params2);
            }

            // Delete the case from MongoDB
            await CaseModel.findByIdAndDelete(caseId);
        }

        res.status(200).send('Record Deleted Successfully');
    } catch (e) {
        console.log(e);
        res.status(400).send({ error: e.message });
    }
});

app.post('/create', cors(corsOptions), isAuth,initLocalStorevalue, async (req, res) => {
    try {
        const { dbName, authId } = req.user
        const { s3UniqueId, policeReport, accidentScenesPhotos, selectedAccidentScenesPhotos: selectedAccidentFiles, bodyInjuryFiles, selectedBodyInjuryFiles, medicalRecordsPdf, preMedicalRecordsPdf, medicalBillsfile, incidentReportFile, expertSafetyReport, witnessStatementFile, incidentImageFiles, selectedIncidentImageFiles: selectedIncidentImages, productPhotos, selectedProductPhotos } = req.body;

        const caseId = ((req.body?.caseId === 'undefined') || (req.body?.caseId === '')) ? '' : req.body?.caseId;

        const db = mongoose.connection.useDb(dbName);
        const Case = db.model("cases", CaseSchema);

        const liability = req.body.liability === 'undefined' ? {} : JSON.parse(req.body.liability);
        const medicalProviders = req.body.medicalProviders === 'undefined' ? {} : JSON.parse(req.body.medicalProviders);
        const damage = req.body.damage === 'undefined' ? {} : JSON.parse(req.body.damage);
        const caseInfo = req.body.caseInfo === 'undefined' ? {} : JSON.parse(req.body.caseInfo);
        const painAndSuffering = req.body.painAndSuffering === 'undefined' ? {} : JSON.parse(req.body.painAndSuffering);

        const detailsInput = {
            liability,
            medicalProviders,
            damage,
            caseInfo,
            painAndSuffering
        };

        const isMedicalBillUploading = medicalBillsfile ? true : false;

        const caseData = {
            detailsInput,
            isMedicalBillProcessing: isMedicalBillUploading,
            isCaseNeedtoShow: true,
            userId: authId,
            s3UniqueId: s3UniqueId ? s3UniqueId : '',
            ...(damage.processCase ? {
                resultProgress: {
                    policeReport_Progress: policeReport ? 'Uploading' : 'Successful',
                    medicalRecords_progress: '',
                    preMedicalRecords_progress: '',
                    medicalBills_progress: '',
                    demandLetter_progress: ''
                }
            } : {}),
            result: {
                ...(accidentScenesPhotos && { accidentPhotoRecords: JSON.parse(accidentScenesPhotos) }),
                ...(selectedAccidentFiles && { selectedAccidentFiles: JSON.parse(selectedAccidentFiles) }),
                ...(bodyInjuryFiles && { bodyInjuryFiles: JSON.parse(bodyInjuryFiles) }),
                ...(selectedBodyInjuryFiles && { selectedBodyInjuryFiles: JSON.parse(selectedBodyInjuryFiles) }),
                ...(incidentReportFile && { incidentReportFile: JSON.parse(incidentReportFile) }),
                ...(expertSafetyReport && { expertSafetyReport: JSON.parse(expertSafetyReport) }),
                ...(witnessStatementFile && { witnessStatementFile: JSON.parse(witnessStatementFile) }),
                ...(incidentImageFiles && { incidentImageFiles: JSON.parse(incidentImageFiles) }),
                ...(selectedIncidentImages && { selectedIncidentImageFiles: JSON.parse(selectedIncidentImages) }),
                ...(productPhotos && { productPhotos: JSON.parse(productPhotos) }),
                ...(selectedProductPhotos && { selectedProductPhotos: JSON.parse(selectedProductPhotos) }),
                ...((damage.processCase && !!caseId) && {
                    medicalRecords: [],
                    visitDates: [],
                    preMedicalRecords: [],
                    preMedicalVisitDates: [],
                }
                )
            }
        };
        if (damage.processCase) {
            caseData.isDraftCase = false
            caseData.isPreProcessRecordLoading = false
        }
        let caseModel;

        if (caseId) {

            caseModel = await Case.findByIdAndUpdate(
                caseId,
                {
                    ...caseData,
                    isCaseGeneratedSccessfuly : null,
                    ...(damage.processCase ?{ 
                        resultProgress: {
                            ...caseData?.resultProgress,
                            medicalRecords_progress: '',
                            preMedicalRecords_progress: '',
                            medicalBills_progress: '',
                            demandLetter_progress: ''
                        }
                     } : {}),
                    updatedOn: new Date().toISOString()
                },
                { new: true }
            );

            if (!caseModel) {
                return res.status(404).json({ message: "Case not found", success: false });
            }

        } else {

            caseModel = new Case({
                ...caseData,
                isDraftCase : damage.processCase ? false : true,
                createdOn: new Date().toISOString(),
                updatedOn: new Date().toISOString(),
                isCaseEdited: false
            });

            await caseModel.save();
        }

        const payload = {
            caseModel: JSON.stringify(caseModel),
            userId: authId,
            liability: JSON.stringify(liability),
            detailsInputPayload: JSON.stringify(detailsInput),
            domainName: dbName,
            isEditedCase: !!caseId // if caseid present means it is edited case
        }

        if (policeReport) { payload.policeReport = policeReport }
        if (medicalRecordsPdf) { payload.medicalRecordsPdf = medicalRecordsPdf }
        if (preMedicalRecordsPdf) { payload.preMedicalRecordsPdf = preMedicalRecordsPdf }
        if (medicalBillsfile) { payload.medicalBillsfile = medicalBillsfile }
        if (incidentReportFile) { payload.incidentReportFile = incidentReportFile }
        if (expertSafetyReport) { payload.expertSafetyReport = expertSafetyReport }
        if (witnessStatementFile) { payload.witnessStatementFile = witnessStatementFile }

        if (damage.processCase) {
            processCaseFiles(payload).then(() => {
                console.log('File processing completed');
            }).catch((err) => {
                console.error('File processing failed:', err);
            })
        }

        return res.status(201).json({ message: "Case Created successfully", success: true, caseId: caseId })

    }
    catch (err) {
        console.log(err);
        res.status(400).send({ error: err.message });
    }
});

app.post('/test', cors(corsOptions), async (req, res) => {
    try {
        createAndSaveSetttlementReportWord('sonu', '67a4b88ad88675186787935e', { key: 'thirdPartyPolicyLimit', text: 'Third Party Policy Limit Demand', value: DEMAND.TP_PLD })
        return res.status(201).json({ message: "successfully", success: true })

    }
    catch (e) {
        console.log(e);
        res.status(400).send({ error: e.message });
    }
});

const processCaseFiles = async ({
    caseModel,
    userId,
    liability,
    detailsInputPayload,
    domainName,
    policeReport,
    medicalRecordsPdf,
    preMedicalRecordsPdf,
    medicalBillsfile,
    incidentReportFile,
    expertSafetyReport,
    witnessStatementFile,
    isEditedCase
}) => {

    caseModel = JSON.parse(caseModel);
    liability = liability ? JSON.parse(liability) : [];
    policeReport = policeReport ? JSON.parse(policeReport) : [];
    medicalRecordsPdf = medicalRecordsPdf ? JSON.parse(medicalRecordsPdf) : [];
    preMedicalRecordsPdf = preMedicalRecordsPdf ? JSON.parse(preMedicalRecordsPdf) : [];
    medicalBillsfile = medicalBillsfile ? JSON.parse(medicalBillsfile) : [];
    detailsInputPayload = detailsInputPayload ? JSON.parse(detailsInputPayload) : [];
    incidentReportFile = incidentReportFile ? JSON.parse(incidentReportFile) : null;
    expertSafetyReport = expertSafetyReport ? JSON.parse(expertSafetyReport) : null;
    witnessStatementFile = witnessStatementFile ? JSON.parse(witnessStatementFile) : null;

    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModel = DbConnect.model("cases", CaseSchema);
    const caseData = await CaseModel.findById(caseModel?._id).lean();

    const accidentPhotoRecords = caseData?.result?.accidentPhotoRecords || [];
    const bodyInjuryFiles = caseData?.result?.bodyInjuryFiles || [];
    const concatedArr = [...accidentPhotoRecords, ...bodyInjuryFiles];

    if (concatedArr?.length > 0) {
        const promiseList = [];
        for (const s3Url of concatedArr) {
            if (path.extname(s3Url) === '.jpg' || path.extname(s3Url) === '.jpeg') {
                const promise = new Promise(async (resolve, reject) => {
                    try {
                        const downloadParams = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: s3Url,
                        };
                        const data = await s3Client.getObject(downloadParams).promise();
                        const image = await Jimp.read(data.Body)
                        const mimeType = data.ContentType === 'application/octet-stream' 
                            ? image.getMIME() // Get MIME type from the actual image data
                            : data.ContentType;
                        const fileBuffer = await image.getBufferAsync(mimeType);

                        const uploadParams = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: s3Url, // The key of the file to overwrite
                            Body: fileBuffer,
                            Metadata: data.Metadata
                        };
                        const s3uploadRes = await s3Client.upload(uploadParams).promise();
                        resolve(s3uploadRes)
                    }
                    catch (err) {
                        console.error('Error processing file Conversion:', err);
                        reject(err)
                    };
                })
                promiseList.push(promise)
            }
        }
        try {
            const results = await Promise.all(promiseList);
            //console.log('All files processed successfully:', results);
        } catch (err) {
            console.error('Error in processing files:', err);
        }
    }

    let job = {
        policeReportData: policeReport,
        medicalRecordsData: medicalRecordsPdf,
        preMedicalRecordsPdfData: preMedicalRecordsPdf,
        medicalBillData: medicalBillsfile,
        caseModel,
        userId,
        liability,
        detailsInputPayload,
        incidentReportFile,
        expertSafetyReport,
        witnessStatementFile,
        isEditedCase
    }
    //console.log("event agenda call with job data:")
    // console.log(job)
    await eventAgenda(job, domainName);
}

app.post('/health', async (req, res) => {
    try {
        res.status(200).send('healthy');
    } catch (err) {
        console.log(err)
    }
});

app.post('/PreProcessMedicalRecords', cors(corsOptions), isAuth,initLocalStorevalue, async (req, res) => {
    const { dbName, authId } = req.user
    let { caseId = false, injury, s3UniqueId, medicalRecordsPdf, preMedicalRecordsPdf} = req.body;
    
    const liability = req.body.liability === 'undefined' ? {} : JSON.parse(req.body.liability);
    const medicalProviders = req.body.medicalProviders === 'undefined' ? {} : JSON.parse(req.body.medicalProviders);
    const damage = req.body.damage === 'undefined' ? {} : JSON.parse(req.body.damage);
    const caseInfo = req.body.caseInfo === 'undefined' ? {} : JSON.parse(req.body.caseInfo);
    const painAndSuffering = req.body.painAndSuffering === 'undefined' ? {} : JSON.parse(req.body.painAndSuffering);

    

    try {
        const db = mongoose.connection.useDb(dbName);
        const Case = db.model("cases", CaseSchema);
        const detailsInput = {
            liability,
            medicalProviders,
            damage,
            caseInfo,
            painAndSuffering
        };
        let caseModel = null;
        if (caseId && caseId !== 'undefined') {
            caseModel = await Case.findByIdAndUpdate(caseId,
                {
                    detailsInput,
                    updatedOn: new Date().toISOString(),
                    isPreProcessRecordLoading: true,
                    result: {}
                },
                { new: true }
            );
        } else {

            caseModel = new Case({
                detailsInput,
                createdOn: new Date().toISOString(),
                userId: authId,
                isDraftCase: true,
                s3UniqueId: s3UniqueId,
                isPreProcessRecordLoading: true,
                result: {}
            });

            await caseModel.save();
        }

        const payload = {
            caseModel: JSON.stringify(caseModel),
            userId: authId,
            domainName: dbName,
        }

        const caseLoadingCalc = new HandleCaseLoadingCalc(caseModel._id, authId, dbName,true);        
        caseLoadingCalc.maxValues = {
            policeReport: 0,
            medicalRecords: 30,
            medicalBills: 19,
            preMedicalRecords: 49,
            demandLetter: 0,
        }
        setLocalStorevalue(localStoreObj.caseLoadingObj,caseLoadingCalc);

        if (medicalRecordsPdf) { payload.medicalRecordsPdf = medicalRecordsPdf ? JSON.parse(medicalRecordsPdf) : [] }else{
            caseLoadingCalc.stopLoading("medicalRecords");
        }
        if (preMedicalRecordsPdf) { payload.preMedicalRecordsPdf = preMedicalRecordsPdf ? JSON.parse(preMedicalRecordsPdf) : [] }else{
            caseLoadingCalc.stopLoading("preMedicalRecords");
        }

        const medicalPromise = medicalRecordsPdf ? processMedicalFile(payload.medicalRecordsPdf, caseModel, authId, liability, injury, dbName) : "";
        const preMedicalPromise = preMedicalRecordsPdf ? processPreMedicalFile(payload.preMedicalRecordsPdf, caseModel, authId, liability, injury, dbName) : "";

        Promise.all([medicalPromise, preMedicalPromise]).then(async () => {
            const resp = await Case.findByIdAndUpdate(caseModel._id, { isPreProcessRecordLoading: false }, { new: true }).select("isPreProcessRecordLoading detailsInput.injury result.medicalRecords result.preMedicalRecords result.medicalBillRecords");
            const sendObj = { caseId: caseModel._id, isPreProcessRecordLoading: false, injury: resp?.detailsInput?.injury, medicalRecords: resp.result?.medicalRecords?.flat(), preMedicalRecords: resp.result?.preMedicalRecords?.flat(), medicalBillRecords: resp.result?.medicalBillRecords }
            caseLoadingCalc.completeProcessing();
            await socketService.preProcessRecord(authId, sendObj);
        }).catch((err) => {
            console.error('File processing failed:', err);
        });

        return res.status(201).json({ success: true, caseId: caseModel._id });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false });
    }

})
app.post('/migrate-template-builder', async (req, res) => {
    try {
        const { preCompletedDBs = [] } = req.body;
        let results = {
            successfulDBs: [],
            failedDBs: []
        };

        const masterDb = mongoose.connection.useDb('master');
        const Company = masterDb.model('companies', CompaniesSchema);
        const companies = await Company.find({}, { domainName: 1 }).lean();

        for (const company of companies) {
            const dbName = getDBName({ domainName: company.domainName });
            const db = mongoose.connection.useDb(dbName);
            const DemandTemplate = db.model('demandtemplates', DemandTemplateSchema);
            const Setting = db.model('settings', SettingSchema);
            
            // Skip if database was already successfully migrated
            if (preCompletedDBs.includes(dbName)) {
                console.log(`Skipping previously completed database: ${dbName}`);
                results.successfulDBs.push(dbName);
                continue;
            }

            try {
                console.log(`\n=== Starting migration for database: ${dbName} ===`);

                // Helper function to check and insert documents
                const checkAndInsertDocument = async (data) => {
                    if (!data.state) return false; // Skip if state is empty
                    
                    // Check if document already exists
                    const existingDoc = await DemandTemplate.findOne({
                        state: data.state,
                        caseType: data.caseType,
                        demandType: data.demandType
                    });
                    
                    // Insert if it doesn't exist
                    if (!existingDoc) {
                        await DemandTemplate.create(data);
                        return true; // Document was inserted
                    }
                    
                    return false; // Document already existed
                };

                const migrations = [
                    {
                        name: 'settings',
                        execute: async () => {
                            // Check if settings already exist
                            const existingSettings = await Setting.findOne({ isDefault: true });
                            let inserted = 0;
                            
                            if (!existingSettings) {
                                const caltemplateModel = db.model('templates', DefaultThirdPartyPolicyLimitDemandSchema);
                                const caltppld = await caltemplateModel.findOne({ state: 'California' }).lean();
                                const data = [{
                                    template: {
                                        firmName: caltppld?.firmName || '',
                                        firmAddress: caltppld?.firmAddress || '',
                                        attorneyName: caltppld?.attorneyName || '',
                                        attorneyEmail: caltppld?.attorneyEmail || '',
                                        companyLogo: caltppld?.companyLogo || '',
                                        billedAmountHeading: caltppld?.billedAmountHeading || false,
                                        fontFamily: caltppld?.fontFamily || '',
                                    },
                                    isDefault: true
                                }];
                                await Setting.insertMany(data);
                                inserted = 1;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'TP_PLD',
                        execute: async () => {
                            const Model = db.model('templates', DefaultThirdPartyPolicyLimitDemandSchema);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.state,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'TP_PLD',
                                    liabilityTitle: doc.liabilityTitle || '',
                                    liabilityDescription: doc.liabilityDescription || '',
                                    priorMedicalRecordTitle: doc.priorMedicalRecordTitle || '',
                                    priorMedicalRecordDescription: doc.priorMedicalRecordDescription || '',
                                    introductionTitle: doc.introductionTitle || '',
                                    introductionDescription: doc.introductionDescription || '',
                                    nonEconomicDamageTitle: doc.nonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.nonEconomicDamageDescription || '',
                                    lossOfIncomeTitle: doc.lossOfIncomeTitle || '',
                                    lossOfIncomeDescription: doc.lossOfIncomeDescription || '',
                                    settlementDemandTitle: doc.settlementDemandTitle || '',
                                    settlementDemandDescription: doc.settlementDemandDescription || '',
                                    badFaithExposerTitle: doc.badFaithExposerTitle || '',
                                    badFaithExposerDescription: doc.badFaithExposerDescription || '',
                                    termOfSettlementTitle: doc.termOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.termOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'TP_N_PLD',
                        execute: async () => {
                            const Model = db.model('thirdpartynoneconomicpolicylimittemplates', ThirdPartyNonEconomicPolicyLimitSchema);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.tpnpstate,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: DEMAND.TP_N_PLD,
                                    liabilityTitle: doc.tpnpliabilityTitle || '',
                                    liabilityDescription: doc.tpnpliabilityDescription || '',
                                    priorMedicalRecordTitle: doc.tpnppriorMedicalRecordTitle || '',
                                    priorMedicalRecordDescription: doc.tpnppriorMedicalRecordDescription || '',
                                    introductionTitle: doc.tpnpintroductionTitle || '',
                                    introductionDescription: doc.tpnpintroductionDescription || '',
                                    nonEconomicDamageTitle: doc.tpnpnonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.tpnpnonEconomicDamageDescription || '',
                                    lossOfIncomeTitle: doc.tpnplossOfIncomeTitle || '',
                                    lossOfIncomeDescription: doc.tpnplossOfIncomeDescription || '',
                                    settlementDemandTitle: doc.tpnpsettlementDemandTitle || '',
                                    settlementDemandDescription: doc.tpnpsettlementDemandDescription || '',
                                    termOfSettlementTitle: doc.tpnptermOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.tpnptermOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'UIM_PLD',
                        execute: async () => {
                            const Model = db.model('uimpolicylimitdemandtemplates', UIMPolicyLimitDemandSchema);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.uimpstate,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'UIM_PLD',
                                    liabilityTitle: doc.uimpliabilityTitle || '',
                                    liabilityDescription: doc.uimpliabilityDescription || '',
                                    priorMedicalRecordTitle: doc.uimppriorMedicalRecordTitle || '',
                                    priorMedicalRecordDescription: doc.uimppriorMedicalRecordDescription || '',
                                    introductionTitle: doc.uimpintroductionTitle || '',
                                    introductionDescription: doc.uimpintroductionDescription || '',
                                    nonEconomicDamageTitle: doc.uimpnonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.uimpnonEconomicDamageDescription || '',
                                    lossOfIncomeTitle: doc.uimplossOfIncomeTitle || '',
                                    lossOfIncomeDescription: doc.uimplossOfIncomeDescription || '',
                                    settlementDemandTitle: doc.uimpsettlementDemandTitle || '',
                                    settlementDemandDescription: doc.uimpsettlementDemandDescription || '',
                                    termOfSettlementTitle: doc.uimptermOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.uimptermOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'UIM_N_PLD',
                        execute: async () => {
                            const Model = db.model('uimnonpolicylimitdemandtemplates', UIMNonPolicyLimitDemandSchema);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.uimnpstate,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'UIM_N_PLD',
                                    liabilityTitle: doc.uimnpliabilityTitle || '',
                                    liabilityDescription: doc.uimnpliabilityDescription || '',
                                    priorMedicalRecordTitle: doc.uimnppriorMedicalRecordTitle || '',
                                    priorMedicalRecordDescription: doc.uimnppriorMedicalRecordDescription || '',
                                    introductionTitle: doc.uimnpintroductionTitle || '',
                                    introductionDescription: doc.uimnpintroductionDescription || '',
                                    nonEconomicDamageTitle: doc.uimnpnonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.uimnpnonEconomicDamageDescription || '',
                                    lossOfIncomeTitle: doc.uimnplossOfIncomeTitle || '',
                                    lossOfIncomeDescription: doc.uimnplossOfIncomeDescription || '',
                                    settlementDemandTitle: doc.uimnpsettlementDemandTitle || '',
                                    settlementDemandDescription: doc.uimnpsettlementDemandDescription || '',
                                    termOfSettlementTitle: doc.uimnptermOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.uimnptermOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'UM_PLD',
                        execute: async () => {
                            const Model = db.model('umpldtemplates', UMPLDTemplate);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.state,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'UM_PLD',
                                    liabilityTitle: doc.liabilityTitle || '',
                                    liabilityDescription: doc.liabilityDescription || '',
                                    priorMedicalRecordTitle: doc.priorMedicalRecordTitle || '',
                                    priorMedicalRecordDescription: doc.priorMedicalRecordDescription || '',
                                    introductionTitle: doc.introductionTitle || '',
                                    introductionDescription: doc.introductionDescription || '',
                                    nonEconomicDamageTitle: doc.nonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.nonEconomicDamageDescription || '',
                                    lossOfIncomeTitle: doc.lossOfIncomeTitle || '',
                                    lossOfIncomeDescription: doc.lossOfIncomeDescription || '',
                                    settlementDemandTitle: doc.settlementDemandTitle || '',
                                    settlementDemandDescription: doc.settlementDemandDescription || '',
                                    termOfSettlementTitle: doc.termOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.termOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'UM_N_PLD',
                        execute: async () => {
                            const Model = db.model('umnpldtemplates', UMNPLDTemplate);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.state,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'UM_N_PLD',
                                    liabilityTitle: doc.liabilityTitle || '',
                                    liabilityDescription: doc.liabilityDescription || '',
                                    priorMedicalRecordTitle: doc.priorMedicalRecordTitle || '',
                                    priorMedicalRecordDescription: doc.priorMedicalRecordDescription || '',
                                    introductionTitle: doc.introductionTitle || '',
                                    introductionDescription: doc.introductionDescription || '',
                                    nonEconomicDamageTitle: doc.nonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.nonEconomicDamageDescription || '',
                                    lossOfIncomeTitle: doc.lossOfIncomeTitle || '',
                                    lossOfIncomeDescription: doc.lossOfIncomeDescription || '',
                                    settlementDemandTitle: doc.settlementDemandTitle || '',
                                    settlementDemandDescription: doc.settlementDemandDescription || '',
                                    termOfSettlementTitle: doc.termOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.termOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'Simplified_TP_PLD',
                        execute: async () => {
                            const Model = db.model('simplifiedtppldtemplates', SimplifiedTPPLDTemplate);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.state,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'Simplified_TP_PLD',
                                    liabilityTitle: doc.liabilityTitle || '',
                                    liabilityDescription: doc.liabilityDescription || '',
                                    introductionTitle: doc.introductionTitle || '',
                                    introductionDescription: doc.introductionDescription || '',
                                    nonEconomicDamageTitle: doc.nonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.nonEconomicDamageDescription || '',
                                    settlementDemandTitle: doc.settlementDemandTitle || '',
                                    settlementDemandDescription: doc.settlementDemandDescription || '',
                                    termOfSettlementTitle: doc.termOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.termOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'Simplified_UIM_PLD',
                        execute: async () => {
                            const Model = db.model('simplifieduimpldtemplates', SimplifiedUIMPLDTemplate);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.state,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'Simplified_UIM_PLD',
                                    liabilityTitle: doc.liabilityTitle || '',
                                    liabilityDescription: doc.liabilityDescription || '',
                                    introductionTitle: doc.introductionTitle || '',
                                    introductionDescription: doc.introductionDescription || '',
                                    nonEconomicDamageTitle: doc.nonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.nonEconomicDamageDescription || '',
                                    settlementDemandTitle: doc.settlementDemandTitle || '',
                                    settlementDemandDescription: doc.settlementDemandDescription || '',
                                    termOfSettlementTitle: doc.termOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.termOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    },
                    {
                        name: 'Simplified_UM_PLD',
                        execute: async () => {
                            const Model = db.model('simplifiedumpldtemplates', SimplifiedUMPLDTemplate);
                            const docs = await Model.find({});
                            let inserted = 0;
                            
                            for (const doc of docs) {
                                const wasInserted = await checkAndInsertDocument({
                                    state: doc.state,
                                    caseType: 'AUTO_ACCIDENT',
                                    demandType: 'Simplified_UM_PLD',
                                    liabilityTitle: doc.liabilityTitle || '',
                                    liabilityDescription: doc.liabilityDescription || '',
                                    introductionTitle: doc.introductionTitle || '',
                                    introductionDescription: doc.introductionDescription || '',
                                    nonEconomicDamageTitle: doc.nonEconomicDamageTitle || '',
                                    nonEconomicDamageDescription: doc.nonEconomicDamageDescription || '',
                                    settlementDemandTitle: doc.settlementDemandTitle || '',
                                    settlementDemandDescription: doc.settlementDemandDescription || '',
                                    termOfSettlementTitle: doc.termOfSettlementTitle || '',
                                    termOfSettlementDescription: doc.termOfSettlementDescription || ''
                                });
                                
                                if (wasInserted) inserted++;
                            }
                            
                            return { inserted };
                        }
                    }
                ];

                // Execute all migrations and collect results
                const migrationResults = [];
                for (const migration of migrations) {
                    console.log(`Executing migration: ${migration.name} for ${dbName}`);
                    const result = await migration.execute();
                    migrationResults.push({
                        name: migration.name,
                        inserted: result.inserted
                    });
                    console.log(`Completed ${migration.name}: ${result.inserted} documents inserted`);
                }

                // If all migrations successful, add to successful DBs
                results.successfulDBs.push({
                    dbName,
                    migrationResults
                });
                console.log(`Successfully completed all migrations for ${dbName}`);

            } catch (error) {
                console.error(`Error processing database ${dbName}:`, error);
                results.failedDBs.push({
                    dbName,
                    error: error.message
                });
            }
        }

        // Prepare response
        const response = {
            success: results.failedDBs.length === 0,
            message: results.failedDBs.length === 0
                ? 'All database migrations completed successfully'
                : 'Some database migrations failed',
            successfulDBs: results.successfulDBs,
            failedDBs: results.failedDBs,
            summary: {
                total: companies.length,
                successful: results.successfulDBs.length,
                failed: results.failedDBs.length
            }
        };

        res.status(200).json(response);

    } catch (err) {
        console.error('Fatal error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'Fatal error occurred during migration process'
        });
    }
});

app.post('/migrate-cases', async (req, res) => {
    try {
        const { migrationStatus = {} } = req.body;
        let results = {
            successfulDBs: [],
            failedDBs: [],
            migrationStatus: { ...migrationStatus } // Maintain existing migration status
        };

        const masterDb = mongoose.connection.useDb('master');
        const Company = masterDb.model('companies', CompaniesSchema);
        const companies = await Company.find({}, { domainName: 1 }).lean();

        for (const company of companies) {
            const dbName = getDBName({ domainName: company.domainName });
            const db = mongoose.connection.useDb(dbName);

            // Initialize migration status for this database if it doesn't exist
            if (!results.migrationStatus[dbName]) {
                results.migrationStatus[dbName] = {};
            }

            try {
                console.log(`\n=== Starting case migration for database: ${dbName} ===`);

                const Case = db.model('cases', CaseSchema);
                const cases = await Case.find({}).lean();

                let migratedCount = 0;
                let failedCases = [];

                for (const oldCase of cases) {
                    const caseId = oldCase._id.toString();

                    // Skip if case was already successfully migrated
                    if (results.migrationStatus[dbName][caseId]) {
                        console.log(`Skipping previously migrated case ${caseId} in ${dbName}`);
                        migratedCount++;
                        continue;
                    }

                    if (oldCase?.detailsInput?.hasOwnProperty("caseInfo")) {
                        console.log(`case ${caseId} in ${dbName} is already in the new format`);
                        migratedCount++;
                        continue;
                    }
                    
                    try {
                        const backup = {
                            detailsInput: JSON.parse(JSON.stringify(oldCase?.detailsInput || {}))
                        };

                        const newDetailsInput = transformCaseDetails(oldCase?.detailsInput || {});

                        // Update the case with new schema
                        await Case.findByIdAndUpdate(
                            oldCase._id,
                            {
                                $set: {
                                    detailsInput: newDetailsInput,
                                    backup
                                }
                            },
                            { new: true }
                        );

                        // Mark case as successfully migrated
                        results.migrationStatus[dbName][caseId] = true;
                        migratedCount++;
                        console.log(`Successfully migrated case ${caseId} in ${dbName}`);

                    } catch (caseError) {
                        console.error(`Failed to migrate case ${caseId} in ${dbName}:`, caseError);
                        results.migrationStatus[dbName][caseId] = false;
                        failedCases.push({
                            caseId,
                            error: caseError.message
                        });
                    }
                }

                // Add database to results
                if (failedCases.length === 0) {
                    results.successfulDBs.push({
                        dbName,
                        totalCases: cases.length,
                        migratedCases: migratedCount
                    });
                } else {
                    results.failedDBs.push({
                        dbName,
                        totalCases: cases.length,
                        migratedCases: migratedCount,
                        failedCases
                    });
                }

            } catch (dbError) {
                console.error(`Error processing database ${dbName}:`, dbError);
                results.failedDBs.push({
                    dbName,
                    error: dbError.message
                });
            }
        }

        // Prepare response
        const response = {
            success: results.failedDBs.length === 0,
            message: results.failedDBs.length === 0
                ? 'All case migrations completed successfully'
                : 'Some case migrations failed',
            successfulDBs: results.successfulDBs,
            failedDBs: results.failedDBs,
            migrationStatus: results.migrationStatus, // Include migration status in response
            summary: {
                totalDatabases: companies.length,
                successfulDatabases: results.successfulDBs.length,
                failedDatabases: results.failedDBs.length
            }
        };

        res.status(200).json(response);

    } catch (err) {
        console.error('Fatal error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'Fatal error occurred during case migration process'
        });
    }
});

// Function to transform old case details to new schema
function transformCaseDetails(oldDetailsInput) {
    const {
        liability: oldLiability,
        injury: oldInjury,
        damage,
    } = oldDetailsInput;

    const oldDamage = damage?.hasOwnProperty("values") ? damage.values : damage

    return {

        caseInfo: {
            clientName: oldLiability?.name || '',
            ssn: oldLiability?.ssn || '',
            clientState: oldLiability?.state,
            clientZip: oldLiability?.name,
            caseName: oldLiability?.caseName,
            caseType: oldLiability?.caseType || 'AUTO_ACCIDENT',
            multiPlaintiff: oldLiability?.multiPlaintiff || 'Individual',
            dateOfIncident: oldLiability?.date,
            stateOfIncident: oldLiability?.state || 'California',
            defendantName: oldLiability?.faulterName,
        },

        liability: {
            description: oldLiability?.description || '',
            policeReport: oldLiability?.policeReport || {},
            incidentReportFile: oldLiability?.incidentReportFile || {},
            witnessStatementFile: oldLiability?.witnessStatementFile || {},
            expertSafetyReport: oldLiability?.expertSafetyReport || {},
            accidentScenes: oldLiability?.accidentScenes || {},
            incidentText: oldLiability?.incidentText || '',
            dangerousConditions: oldLiability?.dangerousConditions || '',
            stateFactsNotice: oldLiability?.stateFactsNotice || '',
            factsFailureClaim: oldLiability?.factsFailureClaim || '',
            factsManufacturingDefect: oldLiability?.factsManufacturingDefect || '',
            factsConsumerExpectation: oldLiability?.factsConsumerExpectation || '',
            factsRiskBenefit: oldLiability?.factsRiskBenefit || '',
            accidentSceneFiles: oldLiability?.accidentSceneFiles || {},
            incidentReportImageFiles: oldLiability?.incidentReportImageFiles || {},
            productImageFiles: oldLiability?.productImageFiles || {},
            factsRipkBenefit: oldLiability?.factsRipkBenefit || '',

        },

        medicalProviders: {
            postAccident: (oldInjury?.postAccident || []).map(provider => ({
                providerName: provider?.providerName,
                medicalRecords: [...provider?.medicalRecords || [], ...provider?.medicalBills || []] || []
            })),
            preAccident: (oldInjury?.preAccident || []).map(provider => ({
                providerName: provider?.providerName,
                medicalRecords: [...provider?.medicalRecords || [], ...provider?.medicalBills || []] || []
            }))
        },

        damage: {
            WorkHoursMissed: oldDamage?.WorkHoursMissed || '',
            hourlyIncomeRate: oldDamage?.hourlyIncomeRate || '',
            typeofWork: oldDamage?.typeofWork || '',
            processCase: oldDamage?.processCase || false
        },

        painAndSuffering: {
            monthlyamount: oldDamage?.monthlyamount || '',
            annualamount: oldDamage?.annualamount || '',
            gender: oldDamage?.gender || '',
            age: oldDamage?.age || 0,
            selectedPainPoints: oldDamage?.selectedPainPoints || [],
            descriptionText: oldDamage?.painPointsBrief || ''
        }
    };
}

server.listen(5000, () => {
    db.initDb();
    console.log('server started at 5000')
});
