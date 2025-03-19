class TextPositonService {

    static progress = (progress) => {
        if (progress) {

            let medicalRecordProgressBar = progress[0] === "Extracted" ? progress[0] : progress
            let medicalRecordsUploadingBar = progress[0] === "Uploading" ? progress[0] : progress
            let medicalGeneratingBar = progress[0] === "Generating" ? progress[0] : progress
            let refiningStage = progress[0] === "Refining" ? progress[0] : progress;

            switch (progress[0]) {
                case medicalGeneratingBar:
                    return '-65px'
                case 'Successful':
                    return '-40px'
                case refiningStage:
                    return '-56px'
                case medicalRecordsUploadingBar:
                    return '-40px'
                case medicalRecordProgressBar:
                    return '-40px'
                default:
                    if (progress[0] < 50) {
                        return '-15px'
                    }
                    if (progress[0] > 50) {
                        return '-60px'
                    }
            }
        }

    }

    static preMedicalprogress = (progress) => {
        if (progress) {

            let medicalRecordProgressBar = progress[0] === "Extracted" ? progress[0] : progress
            let medicalRecordsUploadingBar = progress[0] === "Uploading" ? progress[0] : progress
            let medicalGeneratingBar = progress[0] === "Generating" ? progress[0] : progress
            let refiningStage = progress[0] === "Refining" ? progress[0] : progress;

            switch (progress[0]) {
                case medicalGeneratingBar:
                    return '-65px'
                case 'Successful':
                    return '-40px'
                case refiningStage:
                    return '-56px'
                case medicalRecordsUploadingBar:
                    return '-40px'
                case medicalRecordProgressBar:
                    return '-40px'
                default:
                    if (progress[0] < 50) {
                        return '-15px'
                    }
                    if (progress[0] > 50) {
                        return '-60px'
                    }
            }
        }

    }

    static demandLetterProgress = (demandLetterProgress) => {
        if (demandLetterProgress) {
            switch (demandLetterProgress) {
                case 'Generating Record':
                    return '-70px'
                case 'Successful':
                    return '-40px'
                case 'Uploading':
                    return '-40px'
                case 'Extracted':
                    return '-40px'
                case 'Generating Files':
                    return '-55px'
                default:
                    if (demandLetterProgress < 50) {
                        return '-15px'
                    }
                    if (demandLetterProgress > 50) {
                        return '-60px'
                    }
            }
        }

    }

    static policeReportProgress = (policeReportProgress) => {
        if (policeReportProgress) {
            let policeProgressBar = policeReportProgress[0] === "Extracted" ? policeReportProgress[0] : policeReportProgress
            let policeUploadingBar = policeReportProgress[0] === "Uploading" ? policeReportProgress[0] : policeReportProgress
            let policeGeneratingBar = policeReportProgress[0] === "Generating" ? policeReportProgress[0] : policeReportProgress
            switch (policeReportProgress[0]) {
                case policeGeneratingBar:
                    return '-66px'
                case 'Successful':
                    return '-40px'
                case policeUploadingBar:
                    return '-40px'
                case policeProgressBar:
                    return '-40px'
                default:
                    if (policeReportProgress[0] < 50) {
                        return '-15px'
                    }
                    if (policeReportProgress[0] > 50) {
                        return '-60px'
                    }
            }
        }
    }

    static medicalBillProgress = (medicalBillProgress) => {
        if (medicalBillProgress) {

            let medicalBillProgressBar = medicalBillProgress[0] === "Extracted" ? medicalBillProgress[0] : medicalBillProgress
            let medicalBillsUploadingBar = medicalBillProgress[0] === "Uploading" ? medicalBillProgress[0] : medicalBillProgress
            let medicalBillGeneratingBar = medicalBillProgress[0] === "Generating" ? medicalBillProgress[0] : medicalBillProgress

            switch (medicalBillProgress[0]) {
                case medicalBillGeneratingBar:
                    return '-65px'
                case 'Successful':
                    return '-40px'
                case medicalBillsUploadingBar:
                    return '-40px'
                case medicalBillProgressBar:
                    return '-40px'
                default:
                    if (medicalBillProgress[0] < 50) {
                        return '-15px'
                    }
                    if (medicalBillProgress[0] > 50) {
                        return '-60px'
                    }
            }
        }
    }
}

export default TextPositonService;