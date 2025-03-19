const { convertPDFToImages, policeReportPDF } = require('./ProcessingPdfServices');
const mongoose = require("mongoose");
const CaseSchema = require('../src/db/models/Case');
const { processAi } = require('./ChatGptPdfProcessor');



const processandGeneratePoliceReport = async (fileArray, caseId, userId, socketService, liability, domainName) => {
    // await socketService.policeReportProgress("Uploading", caseId, userId, domainName);

    // Process files in parallel but collect results in order
    const processingPromises = fileArray.map((file, index) =>
        policeReportPDF(file, liability, "policexhibitDirectoryPath", caseId, domainName, index)
    );

    // Wait for all processing to complete while maintaining order
    const results = await Promise.all(processingPromises);

    // Process and filter text
    const extractedPdfTextArr = results.map(text =>
        text ? text.replace(/\s+/g, ' ').trim() : ''
    );

    // await socketService.policeReportProgress(`Extracted`, caseId, userId, domainName);

    return extractedPdfTextArr;
};

const getFileTextAndImage = async (fileArray, caseId, userId, socketService, socketServiceFunc, liability, domainName, dbExhibitkey) => {
    // await socketService[socketServiceFunc](`Uploading`, caseId, userId, domainName);

    // Process files in parallel but collect results in order
    const processingPromises = fileArray.map((file, index) =>
        convertPDFToImages(file, liability, dbExhibitkey, caseId, domainName, index)
    );

    // Wait for all processing to complete while maintaining order
    const results = await Promise.all(processingPromises);

    console.log("Done extracting data")

    // await socketService[socketServiceFunc](`Extracted`, caseId, userId, domainName);

    // Collect all paths in order
    const allPaths = results.map(r => r.exhibitPaths).flat();

    // Update database with complete ordered array at once
    const DbConnect = mongoose.connection.useDb(domainName);
    const CaseModal = DbConnect.model("cases", CaseSchema);
    await CaseModal.findByIdAndUpdate(caseId, {
        [`result.${dbExhibitkey}`]: allPaths
    });

    const getMedicalType = async (fileText) => {
        const token = 50000;
        const combinedText = fileText.join('\n');
        initialText = combinedText.slice(0, token);

        const prompt = `
        You are an experienced medical record analyst with expertise in interpreting and summarizing complex medical information for a personal injury demand from the perspective of the injured person. Your task is to analyze the provided medical text and billing information to determine the type of medical record it represents.
        Here are the possible medical record types:
        <medical_record_types>
        - MRI Other Imaging
        - Surgery Center Reports
        - ER
        - Hospital
        - Consultation Reports
        - All Other Medical Records
        </medical_record_types>
        <medical_record_descriptions>
        - MRI Other Imaging: "Diagnostic imaging reports including MRI, CT, X-ray, ultrasound, PET scans, and nuclear medicine studies. Contains technical imaging parameters, radiologist observations, findings, and impressions. Often includes anatomical descriptions and comparison with prior studies."
        - Surgery Center Reports: "Operative reports, epidural injection reports, other pain management injections and procedures, pre-operative evaluations, post-operative notes, and ambulatory surgery center documentation. Contains surgical procedure details, anesthesia records, operative findings, technique descriptions, and immediate post-operative status."
        - ER: "Emergency department visit documentation including triage notes, chief complaints, emergency physician evaluations, trauma assessments, urgent care treatments, and ED discharge summaries. Contains vital signs, acute symptoms, immediate interventions, and disposition plans."
        - Hospital: "Inpatient hospital records including admission notes, daily progress notes, nursing documentation, specialty reports from orthopedic or neurosurgeons etc, medication administration records, and hospital discharge summaries. Documents full hospital course from admission through discharge."
        - Consultation Reports: "Specialist evaluation reports and recommendations from various medical disciplines. Contains detailed history, focused physical exam findings, expert medical opinions, differential diagnoses, and treatment recommendations specific to the consultant's specialty. These will often be associated with orthopedic, neurology, neurosurgery, pain management and other specialty fields"
        - All Other Medical Records: "Any medical documentation that doesn't fit the above categories, including but not limited to: primary care visits, physical therapy notes, chiropractic records, chiropractic soap notes, laboratory reports, pathology reports, mental health evaluations, vaccination records, and routine outpatient visits."
        </medical_record_descriptions>
        Instructions:
        1. Carefully read and analyze the provided medical text.
        2. Determine which of the listed medical record types best describes the content of the text.
        3. Use your expertise to identify key indicators that suggest the record type.
        4. Provide your final determination in a JSON format as shown in the example below.
        Here is the medical text to be analyzed:
        <medical_text>
        {{fileTxt}}
        </medical_text>
        Return ONLY a JSON object with the format {"medicalType": "TYPE"} without any additional explanation or analysis.
        Please proceed with your analysis and determination of the medical record type.
    `

        const updatedPrompt = prompt.replace("{{fileTxt}}", initialText)
        analystResult = await processAi({content: updatedPrompt, jsonValidator: true})


        return JSON.parse(analystResult)
    }

    const medicalTypePromiseArr = [];
    const extractedPdfTextArray = results.map(r => {
        medicalTypePromiseArr.push(getMedicalType(r.imageTextValue));
        return r.imageTextValue
    });

    const medicalTypePromiseRes = await Promise.all(medicalTypePromiseArr);

    console.log("Got Medical Type")

    return {
        extractedPdfTextArray,
        providerNames: results.map(r => r.providerName),
        // medicalTypes: results.map(r => r.medicalType)
        medicalTypes: medicalTypePromiseRes.map(r => r.medicalType)
    };
};

module.exports = {
    processandGeneratePoliceReport,
    getFileTextAndImage
}