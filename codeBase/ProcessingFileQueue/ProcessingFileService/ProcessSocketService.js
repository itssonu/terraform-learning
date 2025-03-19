const { saveChatGptProgress } = require("./SaveChatGptResponse");

class SocketHandlerModule {
    constructor(io) {
        this.io = io;
        this.user_id = null; // Initialize user_id to null
        io.on('connection', async (socket) => {
            this.user_id = socket.handshake.query.id;
            console.log('socket connected')
            socket.join(`user_${this.user_id}`)
            socket.on('disconnect', () => {
                console.log('A user disconnected');
            });
        });

    }

    async policeReportProgress(text, id, user_id, domainName) {
        if (text === "libalityDescription") {
            let caseModel = await saveChatGptProgress({ isPoliceFileProcessing: 1 }, id, domainName)
            await this.caseUpdates(user_id, { resultProgress: caseModel.resultProgress, caseId: caseModel._id })
        }
        else {
            let caseModel = await saveChatGptProgress({ policeReport_Progress: text }, id, domainName)
            await this.caseUpdates(user_id, { resultProgress: caseModel?.resultProgress, caseId: caseModel._id })
        }
    }
    async medicalBillProgress(text, id, user_id, domainName) {
        let caseModel = await saveChatGptProgress({ medicalBills_progress: text }, id, domainName)
        await this.caseUpdates(user_id, { resultProgress: caseModel.resultProgress, caseId: caseModel._id })
    }

    async medicalRecordsProgress(text, id, user_id, domainName) {
        let caseModel = await saveChatGptProgress({ medicalRecords_progress: text }, id, domainName)
        await this.caseUpdates(user_id, { resultProgress: caseModel.resultProgress, caseId: caseModel._id })
    }
    async preMedicalRecordsProgress(text, id, user_id, domainName) {

        let caseModel = await saveChatGptProgress({ preMedicalRecords_progress: text }, id, domainName)
        await this.caseUpdates(user_id, { resultProgress: caseModel.resultProgress, caseId: caseModel._id })


    }

    async caseLoadingUpdate(userId, caseId, domainName,data) {
        saveChatGptProgress( data , caseId, domainName);
        await this.caseUpdates(userId, { resultProgress:data, caseId  })
    }

    async generateSummaryLoadingUpdate(userId,data) {
        this.io.to(`user_${userId}`).emit('generateSummaryLoading', data)
    }

    async completionDemandLetter(count, id, user_id, domainName) {
        const total_Request = 4;
        let percentage = (count / total_Request) * 100;
        percentage = percentage === 100 ? 'Generating Files' : percentage
        let caseModel = await saveChatGptProgress({ demandLetter_progress: count === "Successful" ? "Successful" : percentage }, id, domainName)
        await this.caseUpdates(user_id, { resultProgress: caseModel.resultProgress, isCaseGeneratedSccessfuly: caseModel?.isCaseGeneratedSccessfuly, isCaseEdited: caseModel?.isCaseEdited, caseId: caseModel._id })
    }

    async toaster(user_id, { message, success }) {
        this.io.to(`user_${user_id}`).emit('toaster', { message, success })
    }

    async invoiceMailRes(user_id, data) {
        const success = !!data.success
        const message = success ? `Mail Successfully sent to ${data.email}` : ' Mail did not sent'
        await this.toaster(user_id, { success, message })
    }

    async caseUpdates(user_id, data) {
        this.io.to(`user_${user_id}`).emit('caseUpdates', data)
    }

    async medicalBillProgress(text, id, user_id, domainName) {
        let caseModel = await saveChatGptProgress({ medicalBills_progress: text }, id, domainName)
        await this.caseUpdates(user_id, { resultProgress: caseModel.resultProgress, caseId: caseModel._id })
    }

    async preProcessRecord(user_id, sendObj) {
        this.io.to(`user_${user_id}`).emit('preProcessRecordResult', sendObj)
    }
}

module.exports = SocketHandlerModule;
