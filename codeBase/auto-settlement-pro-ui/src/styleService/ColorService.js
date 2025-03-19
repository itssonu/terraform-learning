class ColorService {
    static medicalBillProgress = (medicalBillProgress) => {

        if (medicalBillProgress) {
            let extracted = medicalBillProgress[0] === "Extracted" ? medicalBillProgress[0] : medicalBillProgress
            let uploading = medicalBillProgress[0] === "Uploading" ? medicalBillProgress[0] : medicalBillProgress
            let generating = medicalBillProgress[0] === "Generating" ? medicalBillProgress[0] : medicalBillProgress
            switch (medicalBillProgress) {
                case generating:
                    if (medicalBillProgress < 50) {
                        return 'black'
                    } else if (medicalBillProgress > 50) {
                        return 'white'
                    } else {
                        return 'white'
                    }
                case 'Successful':
                    return 'white'
                case uploading:
                    return 'white'
                case extracted:
                    return 'white'
                default:
                    if (medicalBillProgress[0] < 1) {
                        return 'black'
                    }
                    if (medicalBillProgress[0] > 50) {
                        return 'white'
                    }
            }
        }
    }
    static policeReportProgress = (policeReportProgress) => {
         
        if (policeReportProgress) {
            let policeProgressBar = policeReportProgress[0] === "Extracted" ? policeReportProgress[0] : policeReportProgress
            let policeUploadingBar = policeReportProgress[0] === "Uploading" ? policeReportProgress[0] : policeReportProgress
            let policeGeneratingBar = policeReportProgress[0] === "Generating" ? policeReportProgress[0] : policeReportProgress

            switch (policeReportProgress) {
                case policeGeneratingBar:
                    if (policeReportProgress < 50) {
                        return 'black'
                    } else if (policeReportProgress > 50) {
                        return 'white'
                    } else {
                        return 'white'
                    }
                case 'Successful':
                    return 'white'
                case policeProgressBar:
                    return 'white'
                case policeUploadingBar:
                    return 'white'
                default:

                    if (policeReportProgress < 50) {
                        return 'black'
                    }
                    if (policeReportProgress > 50) {
                        return 'white'
                    }
                    return 'black';
            }

        }
    }

    static progress = (progress) => {
        if (progress) {
            let extracted = progress[0] === "Extracted" ? progress[0] : progress
            let uploading = progress[0] === "Uploading" ? progress[0] : progress
            let generating = progress[0] === "Generating" ? progress[0] : progress
            switch (progress) {
                case generating:
                    if (progress < 50) {
                        return 'black'
                    } else if (progress > 40) {
                        return 'white'
                    } else {
                        return 'white'
                    }
                case 'Successful':
                    return 'white'
                case uploading:
                    return 'white'
                case 'Refining':
                    return 'white'
                case extracted:
                    return 'white'
                case 'Generating Record':
                    return 'white'
                default:
                    if (progress < 50) {
                        return 'black'
                    }
                    if (progress > 40) {
                        return 'white'
                    }
                    return 'black';
            }

        }
    }

    static preMedicalProgress = (progress) => {
        if (progress) {
            let extracted = progress[0] === "Extracted" ? progress[0] : progress
            let uploading = progress[0] === "Uploading" ? progress[0] : progress
            let generating = progress[0] === "Generating" ? progress[0] : progress
            switch (progress) {
                case generating:
                    if (progress < 50) {
                        return 'black'
                    } else if (progress > 40) {
                        return 'white'
                    } else {
                        return 'white'
                    }
                case 'Successful':
                    return 'white'
                case uploading:
                    return 'white'
                case 'Refining':
                    return 'white'
                case extracted:
                    return 'white'
                case 'Generating Record':
                    return 'white'
                default:
                    if (progress < 50) {
                        return 'black'
                    }
                    if (progress > 40) {
                        return 'white'
                    }
                    return 'black';
            }

        }
    }

    static demandLetterProgress = (demandLetterProgress) => {
        if (demandLetterProgress) {

            switch (demandLetterProgress) {
                case 'Generating Letter':
                    return 'white'
                case 'Successful':
                    return 'white'
                case 'Extracted':
                    return 'white'
                case 50:
                    return 'white'
                case 'Sucessfull':
                    return 'white'
                case 'Generating Files':
                    return 'white'
                default:
                    if (demandLetterProgress > 50) {
                        return 'white'
                    }
                    return 'black';
            }
        }


    }
}

export default ColorService;