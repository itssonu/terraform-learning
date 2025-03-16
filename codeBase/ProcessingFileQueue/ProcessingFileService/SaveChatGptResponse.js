const DbConnection = require('../server');
const CaseSchema = require('../src/db/models/Case')
const errorLogSchema = require('../src/db/models/ErrorLog')
const db = require('../src/db/dbConnection');
const mongoose = require("mongoose");
const { getLocalStorevalue } = require('../src/utils/localStore');
const { localStoreObj } = require('../Contant');


async function withRetry(fn, maxRetries = 3, initialDelay = 100) {
    let retries = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            retries++;
            if (retries >= maxRetries) {
                console.error(`Failed after ${maxRetries} retries:`, error);
                throw error;
            }
            
            // Exponential backoff
            const delay = initialDelay * Math.pow(2, retries);
            console.log(`Retry ${retries}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

const saveChatGptData = async (chatGptObject, caseModel, domainName) => {
    console.log("inside saveChatGPTData call");
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);
    const ErrorModelTable = DbConnect.model("errorlog", errorLogSchema);

    try {
        // Prepare update fields for atomic operation
        const updateFields = {};
        Object.entries(chatGptObject).forEach(([key, value]) => {
            updateFields[`result.${key}`] = value;
        });

        // Perform atomic update with retry logic
        const updatedCase = await withRetry(() => 
            CaseModelTable.findByIdAndUpdate(
                caseModel._id,
                { $set: updateFields },
                { new: true, runValidators: true }
            )
        );

        if (!updatedCase) {
            console.log(`Case not found for update: ${caseModel._id}`);
            return null;
        }

        // Check for errors and update status if needed
        const errorCount = await ErrorModelTable.countDocuments({ caseId: caseModel._id });
        if (errorCount === 0) {
            await withRetry(() => 
                CaseModelTable.findByIdAndUpdate(
                    caseModel._id,
                    { 
                        $set: {
                            isCaseGeneratedSccessfuly: true,
                            istimetaken: new Date().toISOString()
                        }
                    },
                    { new: true }
                )
            );
        }

        return updatedCase;
    }
    catch (err) {
        console.error("Error in saveChatGptData:", err);
        return null;
    }
};

const saveChatGptProgress = async (chatGptProgressObject, id, domainName) => {
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);
    
    try {
        // Prepare update fields for atomic operation
        const updateFields = {};
        Object.entries(chatGptProgressObject).forEach(([key, value]) => {
            updateFields[`resultProgress.${key}`] = value;
        });
        
        // Atomic update with retry
        const updatedCase = await withRetry(() => 
            CaseModelTable.findByIdAndUpdate(
                id,
                { $set: updateFields },
                { new: true, runValidators: true }
            )
        );

        if (!updatedCase) {
            console.log(`Case not found for progress update: ${id}`);
            return null;
        }

        return updatedCase;
    } catch (error) {
        console.error("Error in saveChatGptProgress:", error);
        return null;
    }
};

const saveErrorLog = async (caseId, userId, errorCode, errorDescrition, domainName) => {
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModelTable = DbConnect.model("cases", CaseSchema);
    const ErrorModelTable = DbConnect.model("errorlog", errorLogSchema);

    try {
        // Create the error log with retry
        const errorlog = await withRetry(() => 
            ErrorModelTable.create({ 
                userId, 
                createDate: new Date().toISOString(), 
                caseId, 
                errorCode, 
                errorDescrition 
            })
        );

        // Atomic update with retry
        await withRetry(() => 
            CaseModelTable.findByIdAndUpdate(
                caseId,
                { 
                    $set: {
                        isCaseGeneratedSccessfuly: false, 
                        istimetaken: new Date().toISOString()
                    }
                },
                { new: true }
            )
        );
        const caseLoadingCalc = getLocalStorevalue(localStoreObj.caseLoadingObj);
        caseLoadingCalc.killLoader();
        return errorlog;
    } catch (error) {
        console.error("Error in saveErrorLog:", error);
        return null;
    }
};

module.exports = {
    saveChatGptData,
    saveChatGptProgress,
    saveErrorLog
}