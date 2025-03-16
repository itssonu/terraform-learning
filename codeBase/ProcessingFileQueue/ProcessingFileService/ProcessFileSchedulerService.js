// async function scheduleMedicalFiles(filesReport, caseId, userId, socketService) {
//     const schedulingPromises = [];

//     // await socketService.medicalRecordsProgress('Generating Record', caseId)
//     for (const iterator of filesReport) {
//         const schedulingPromise = new Promise((resolve, reject) => {
//             const fileName = iterator?.name.split('_')[0]
//             const providerName = iterator?.name
//             iterator.mv(`/tmp/ProcessingCaseFile/${userId}/${caseId}/Medical_Records/${fileName}`, async (err) => {
//                 if (err) {
//                     reject('Error occurred while moving the files.');
//                 }
//                 const filePath = `/tmp/MedicalFiles/${fileName}`;
//                 // Schedule the file for processing

//                 resolve({
//                     filePath: filePath,
//                     fileName: fileName,
//                     medicalProviderName: providerName
//                 });
//             });
//         });

//         schedulingPromises.push(schedulingPromise);
//     }
//     return await Promise.all(schedulingPromises)
// }

// async function schedulePreMedicalFiles(filesReport, caseId, userId) {
//     const schedulingPromises = [];

//     // await socketService.medicalRecordsProgress('Generating Record', caseId)
//     for (const iterator of filesReport) {
//         const schedulingPromise = new Promise((resolve, reject) => {
//             const fileName = iterator?.name.split('_')[0]
//             const providerName = iterator?.name
//             iterator.mv(`/tmp/ProcessingCaseFile/${userId}/${caseId}/PreMedical_Records/${fileName}`, async (err) => {
//                 if (err) {
//                     reject('Error occurred while moving the files.');
//                 }
//                 const filePath = `/tmp/PreMedicalFiles/${fileName}`;
//                 // Schedule the file for processing

//                 resolve({
//                     filePath: filePath,
//                     fileName: fileName,
//                     medicalProviderName: providerName
//                 });
//             });
//         });

//         schedulingPromises.push(schedulingPromise);
//     }
//     return await Promise.all(schedulingPromises)
// }

// async function scheduleAccentPhotoFiles(filesReport, caseId, userId) {
//     const schedulingPromises = [];
//     for (const iterator of filesReport) {
//         const schedulingPromise = new Promise((resolve, reject) => {
//             console.log(iterator, 'iterator')
//             iterator.mv(`/tmp/ProcessingCaseFile/${userId}/${caseId}/accidentPhotos/${iterator.name}`, async (err) => {
//                 if (err) {
//                     reject('Error occurred while moving the files.');
//                 }
//                 const filePath = `/tmp/accidentPhotos/${iterator?.name}`;
//                 // Schedule the file for processing

//                 resolve({
//                     filePath: filePath,
//                     fileName: iterator?.name
//                 });
//             });
//         });

//         schedulingPromises.push(schedulingPromise);
//     }
//     return await Promise.all(schedulingPromises)
// }

// async function scheduleinjuryPhotoFiles(filesReport, caseId, userId) {
//     const schedulingPromises = [];

//     for (const iterator of filesReport) {
//         const schedulingPromise = new Promise((resolve, reject) => {
//             iterator.mv(`/tmp/ProcessingCaseFile/${userId}/${caseId}/InjuryPhotos/${iterator.name}`, async (err) => {
//                 if (err) {
//                     reject('Error occurred while moving the files.');
//                 }
//                 const filePath = `/tmp/InjuryPhotos/${iterator?.name}`;
//                 // Schedule the file for processing

//                 resolve({
//                     filePath: filePath,
//                     fileName: iterator?.name
//                 });
//             });
//         });

//         schedulingPromises.push(schedulingPromise);
//     }
//     return await Promise.all(schedulingPromises)
// }
// async function scheduleMedicalBillFiles(filesReport, caseId, userId, socketService) {
//     const schedulingPromises = [];
//     // await socketService.medicalBillProgress('Generating Bills', caseId)
//     for (const iterator of filesReport) {
//         const schedulingPromise = new Promise((resolve, reject) => {
//             iterator.mv(`/tmp/ProcessingCaseFile/${userId}/${caseId}/MedicalBill_Records/${iterator.name}`, async (err) => {
//                 if (err) {
//                     reject('Error occurred while moving the files.');
//                 }
//                 const filePath = `/tmp/MedicalFilesBill/${iterator?.name}`;
//                 // Schedule the file for processing

//                 resolve({
//                     filePath: filePath,
//                     fileName: iterator?.name
//                 });
//             });
//         });

//         schedulingPromises.push(schedulingPromise);
//     }
//     return await Promise.all(schedulingPromises)
// }

// async function schedulePoliceReportFiles(filesReport, caseId, userId, socketService) {
//     // console.log(socketService, 'socketService')
//     const schedulingPromises = [];
//     //    await socketService.policeReportProgress('Generating Record',caseId)
//     for (const iterator of filesReport) {
//         const schedulingPromise = new Promise((resolve, reject) => {
//             iterator.mv(`/tmp/ProcessingCaseFile/${userId}/${caseId}/Police_Records/${iterator.name}`, async (err) => {
//                 if (err) {
//                     reject('Error occurred while moving the files.');
//                 }
//                 const filePath = `/tmp/PoliceReport/${iterator?.name}`;
//                 // Schedule the file for processing

//                 resolve({
//                     filePath: filePath,
//                     fileName: iterator?.name
//                 });
//             });
//         });

//         schedulingPromises.push(schedulingPromise);
//     }
//     return await Promise.all(schedulingPromises)
// }

// module.exports = {
//     scheduleMedicalFiles,
//     scheduleAccentPhotoFiles,
//     scheduleinjuryPhotoFiles,
//     scheduleMedicalBillFiles,
//     schedulePoliceReportFiles,
//     schedulePreMedicalFiles
// }