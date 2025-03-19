
const { processAi } = require('./ChatGptPdfProcessor')
const CaseSchema = require('../src/db/models/Case')
const mongoose = require("mongoose");

const splitStringIntoChunks = (string, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < string.length; i += chunkSize) {
    chunks.push(string.substring(i, i + chunkSize));
  }
  return chunks;
}

function addProviderText(complexArray, providerTextArray) {
  return complexArray.map((outerArray, outerIndex) => {
    return outerArray.map((obj, innerIndex) => {
      return {
        ...obj,
        providerText: providerTextArray[innerIndex] || ''
      };
    });
  });
}

const generateMedicalTreatment = async (caseId, domainName, consolidatedTexts) => {
  const db = mongoose.connection.useDb(domainName);
  const Case = db.model("cases", CaseSchema);
  const caseData = await Case.findById(caseId).lean();
  const medicalRecords = caseData?.result?.medicalRecords || [];
  const painAndSufferingReport = caseData?.result?.painAndSufferingReport || "";
  const userData = caseData?.detailsInput || "";
  const firstTextsByProvider = consolidatedTexts.map(arr => arr[0])
  const updatedMedicalRecords = addProviderText(medicalRecords, firstTextsByProvider);

  let outlinePrompt = `The following set of texts and data describe a series of medical records for a person involved in a personal injury lawsuit. Here is a structured object describing the totality of their records:
    <medical_records>
  ${JSON.stringify(updatedMedicalRecords, null, 2)}
  </medical_records>

  Use the medical_records and summary_texts to generate a single outline for a key medical treatment section for a demand letter.
  <instructions>
      1. For each provider, mention the doctor or surgeon's name by stating their full name, followed by their specialty within the medical field. Make sure to write full paragraphs describing the medical treatment and include list items found in the Medical records.
      2. Include a heading or few sentences between each group of list items found in the medical records, we don't want long sections of just bullet point information. Summarize bullet points into paragraphs if necessary to maintain flow.
      3. All MRI findings should always be represented with bullet points
      4. All bullet points should start with "•"
      5. Only include a single level of bullet points, if any. There must be at least a 3 or 4 full sentences between bullet point lists. If this isn't feasible, summarize the bullet points into a paragraph.
      6. Medical records that describe several individual visits that have similar treatment and complaints over time to the same medical provider can be summarized together as paragraphs.
      7. Try to always note the type of doctor for each doctor mentioned if known.
      8. For sections that have all the necessary data, paragraphs should be structured to cover client complaints, then physical examination findings, and then doctor recommendations and treatments performed during the visit or thereafter.
      9. Include segways between medical providers using a few sentences. For example:
        "Because of the significant findings, she presented to EXAMPLE DOCTOR 1, EXAMPLE DOCTOR SPECIALTY who recommended that she begin EXAMPLE TREATMENT 1 in addition to the EXAMPLE TREATMENT 2 and prescribed EXAMPLE DRUG.  
        Consequently, Mrs. EXAMPLE CLIENT began physical therapy at EXAMPLE MEDICAL PROVIDER on EXAMPLE DATE for EXAMPLE SYMPTOMS in her left arm.  
        During her initial visit, she rated her EXAMPLE SYMPTOM as 9/10.  
        They initiated a treatment program consisting of LIST OF EXAMPLE TREATMENTS that she participated in over the following months."
      10. A SOAP note is a structured method for documenting patient care in healthcare. SOAP stands for Subjective, Objective, Assessment, and Plan. Please follow the SOAP standard while writing these paragraphs
      11. Write in the third person
      12. For the sake of the outline produce a JSON object with the following format:
      [
        {
          "section_title": "TITLE OF SECTION OF TEXT",
          "section_description": "1-3 paragraphs describing the section" 
        },
        ...
      ]
  </instructions>


  Return Result without any additional explanation or analysis.
  Remember, this summary will be directly included in the demand letter, so maintain a professional and objective tone throughout from the injured person’s view.
  `
  console.log("Generating outline for final medical treatment section")
  let outlineOutput = await processAi({content: outlinePrompt, jsonValidator: true, thinking: true});

  outlineOutput = JSON.parse(outlineOutput);
  //console.log("Outline output is: ", JSON.stringify(outlineOutput, null, 2))
  

  let fifthPassPrompt = `The following is a set of texts, data, and an outline that describe a series of medical records for a person involved in a personal injury lawsuit. 
  
  Now, review the case details and pain and suffering information to understand the context:
  <case_details>
  ${JSON.stringify(userData, null, 2)}
  </case_details>

  <pain_and_suffering>
  ${JSON.stringify(painAndSufferingReport, null, 2)}
  </pain_and_suffering>
  
  Here is a structured object describing the totality of their records:
  <medical_records>
  ${JSON.stringify(updatedMedicalRecords, null, 2)}
  </medical_records>

  Additionally, an outline has been created to guide the creation of a medical treatment section for a demand letter.
  <outline>
  ${outlineOutput}
  </outline>

  Use the medical_records, summary_texts, outline, and rough draft to generate a medical treatment section of a demand letter, describing the patient's medical treatment since the accident.
  <instructions>
      1. For each provider, mention the doctor or surgeon's name by stating their full name, followed by their specialty within the medical field. Make sure to write full paragraphs describing the medical treatment and include list items found in the Medical records.
      2. Include a heading or few sentences between each group of list items found in the medical records, we don't want long sections of just bullet point information. Summarize bullet points into paragraphs if necessary to maintain flow.
      3. All MRI findings should always be represented with bullet points
      4. All bullet points should start with "•"
      5. Only include a single level of bullet points, if any. There must be at least a 3 or 4 full sentences between bullet point lists. If this isn't feasible, summarize the bullet points into a paragraph.
      6. Medical records that describe several individual visits that have similar treatment and complaints over time to the same medical provider can be summarized together as paragraphs, not all treatment dates must be mentioned in the final output. Long treatment timelines of similar or minor treatment can be summarized even further.
      7. Try to always note the type of doctor for each doctor mentioned if known.
      8. For sections that have all the necessary data, paragraphs should be structured to cover client complaints, then physical examination findings, and then doctor recommendations and treatments performed during the visit or thereafter.
      9. Include segues between medical providers using a few sentences. For example:
        "Because of the significant findings, she presented to EXAMPLE DOCTOR 1, EXAMPLE DOCTOR SPECIALTY who recommended that she begin EXAMPLE TREATMENT 1 in addition to the EXAMPLE TREATMENT 2 and prescribed EXAMPLE DRUG.  
        Consequently, Mrs. EXAMPLE CLIENT began physical therapy at EXAMPLE MEDICAL PROVIDER on EXAMPLE DATE for EXAMPLE SYMPTOMS in her left arm.  
        During her initial visit, she rated her EXAMPLE SYMPTOM as 9/10.  
        They initiated a treatment program consisting of LIST OF EXAMPLE TREATMENTS that she participated in over the following months."
      10. The response to this prompt will be directly included in the demand letter, do not include any notes or prompts for the user. ONLY OUTPUT THE ACTUAL CHRONOLOGICAL SUMMARY PARAGRAPHS
      11. A SOAP note is a structured method for documenting patient care in healthcare. SOAP stands for Subjective, Objective, Assessment, and Plan. Please follow the SOAP standard while writing these paragraphs
      12. Write in the third person
  </instructions>

  Return a result without any additional explanation or analysis.
  Remember, this summary will be directly included in the demand letter, so maintain a professional and objective tone throughout from the injured person's view.

  Write the medical treatment summary without a title or comments:
  # MEDICAL TREATMENT SUMMARY
  `

  console.log("Generating final medical treatment section")
  let fifthPassOutput = await processAi({content: fifthPassPrompt, thinking: true});

  let simplifiedTreatmentPrompt = `Take the following key medical treatment section from a demand letter and produce a 3-4 paragraph executive summary of the content for a lawyer to quickly review the key facts of the medical treatment.
  <medical_treatment_section>
  ${fifthPassOutput}
  </medical_treatment_section>

    <instructions>
      1. For each provider, mention the doctor or surgeon's name by stating their full name, followed by their specialty within the medical field. Make sure to write full paragraphs describing the medical treatment and include list items found in the Medical records.
      2. Include a heading or few sentences between each group of list items found in the medical records, we don't want long sections of just bullet point information. Summarize bullet points into paragraphs if necessary to maintain flow.
      3. All MRI findings should always be represented with bullet points
      4. All bullet points should start with "•"
      5. Only include a single level of bullet points, if any. There must be at least a 3 or 4 full sentences between bullet point lists. If this isn't feasible, summarize the bullet points into a paragraph.
      6. Medical records that describe several individual visits that have similar treatment and complaints over time to the same medical provider can be summarized together as paragraphs, not all treatment dates must be mentioned in the final output. Long treatment timelines of similar or minor treatment can be summarized even further.
      7. Try to always note the type of doctor for each doctor mentioned if known.
      8. For sections that have all the necessary data, paragraphs should be structured to cover client complaints, then physical examination findings, and then doctor recommendations and treatments performed during the visit or thereafter.
      9. Include segues between medical providers using a few sentences. For example:
        "Because of the significant findings, she presented to EXAMPLE DOCTOR 1, EXAMPLE DOCTOR SPECIALTY who recommended that she begin EXAMPLE TREATMENT 1 in addition to the EXAMPLE TREATMENT 2 and prescribed EXAMPLE DRUG.  
        Consequently, Mrs. EXAMPLE CLIENT began physical therapy at EXAMPLE MEDICAL PROVIDER on EXAMPLE DATE for EXAMPLE SYMPTOMS in her left arm.  
        During her initial visit, she rated her EXAMPLE SYMPTOM as 9/10.  
        They initiated a treatment program consisting of LIST OF EXAMPLE TREATMENTS that she participated in over the following months."
      10. The response to this prompt will be directly included in the demand letter, do not include any notes or prompts for the user. ONLY OUTPUT THE ACTUAL CHRONOLOGICAL SUMMARY PARAGRAPHS
      11. A SOAP note is a structured method for documenting patient care in healthcare. SOAP stands for Subjective, Objective, Assessment, and Plan. Please follow the SOAP standard while writing these paragraphs
      12. Write in the third person
  </instructions>
  
  Return a result without any additional explanation or analysis.
  Remember, this summary will be directly included in the demand letter, so maintain a professional and objective tone throughout from the injured person's view.

  Write the medical treatment summary without a title or comments:
  # EXECUTIVE MEDICAL TREATMENT SUMMARY
  `

  let simplifiedTreatmentOutput = await processAi({content: simplifiedTreatmentPrompt, thinking: false})

  return {keyMedicalTreatmentParagraphs: fifthPassOutput, simplifiedTreatmentParagraphs: simplifiedTreatmentOutput}
}

const generatePreMedicalTreatment = async (caseId, domainName, consolidatedTexts) => {
  const db = mongoose.connection.useDb(domainName);
  const Case = db.model("cases", CaseSchema);
  const caseData = await Case.findById(caseId).lean();
  const medicalRecords = caseData?.result?.preMedicalRecords || [];
  const userData = caseData?.detailsInput || "";
  console.log("inside generatePreMedicalTreatment")
  const firstTextsByProvider = consolidatedTexts.map(arr => arr[0])
  const updatedMedicalRecords = addProviderText(medicalRecords, firstTextsByProvider);  

  let fifthPassPrompt = `The following is a set of texts, data, and an outline that describe a series of pre medical records for a person prior to being involved in a personal injury lawsuit. 
  
  Now, review the case details and pain and suffering information to understand the context:
  <case_details>
  ${JSON.stringify(userData, null, 2)}
  </case_details>
  
  Here is a structured object describing the totality of their records:
  <medical_records>
  ${JSON.stringify(updatedMedicalRecords, null, 2)}
  </medical_records>

  Use the records to generate a prior medical treatment section of a demand letter, describing the patient's unrealated medical treatment prior the accident.
  <instructions>
      1. All bullet points should start with "•"
      2. Only include a single level of bullet points.
      3. The response to this prompt will be directly included in the demand letter, do not include any notes or prompts for the user. ONLY OUTPUT THE ACTUAL CHRONOLOGICAL BULLET POINTS.
      4. Write in the third person
      5. IMPORTANT: Please list all mentioned treatment dates in chronological order as bullet points with the following format: DATE - DOCTOR - SHORT SENTENCE DESCRIPTION OF TREATMENT.
  </instructions>

  Return a result without any additional explanation or analysis.
  Remember, this summary will be directly included in the demand letter, so maintain a professional and objective tone throughout from the injured person's view.

  Write the medical treatment summary without a title or comments:
  # MEDICAL TREATMENT SUMMARY
  `

  console.log("Generating final medical treatment section")
  let fifthPassOutput = await processAi({content: fifthPassPrompt, thinking: true});

  return fifthPassOutput
}


const sortMedicalRecordsWithStrings = (records, stringArray) => {
  // First, flatten the array if it's nested
  let flatRecords = records.flat();

  // Helper function to parse date string to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  };

  // Function to get all dates from a record
  const getRecordDates = (record) => {
    const type = record.medicalTypeName.toLowerCase();
    let dates = [];

    switch (type) {
      case 'consultation reports': {
        if (record.treatmentDates[0]?.treatmentSummary?.length) {
          dates = record.treatmentDates[0].treatmentSummary.map(summary => ({
            date: parseDate(summary.date),
            summary
          }));
        }
        break;
      }

      case 'hospital': {
        if (record.treatmentDates[0]?.treatmentSummary?.length) {
          dates = record.treatmentDates[0].treatmentSummary.map(summary => ({
            date: parseDate(summary.date),
            summary
          }));
        } else if (record.treatmentDates[0]?.admittedDate) {
          dates = [{
            date: parseDate(record.treatmentDates[0].admittedDate),
            data: record.treatmentDates[0]
          }];
        }
        break;
      }

      case 'er': {
        if (record.treatmentDates[0]?.admittedDate) {
          dates = [{
            date: parseDate(record.treatmentDates[0].admittedDate),
            data: record.treatmentDates[0]
          }];
        }
        break;
      }

      default: {
        if (record.treatmentDates && record.treatmentDates.length > 0) {
          dates = record.treatmentDates.map(treatment => ({
            date: parseDate(treatment.date),
            data: treatment
          }));
        }
      }
    }

    return dates.filter(d => d.date !== null);
  };

  // Create array of record segments with their dates
  let recordSegments = [];
  flatRecords.forEach((record, index) => {
    const dates = getRecordDates(record);
    if (dates.length === 0) {
      // Handle records with no dates
      recordSegments.push({
        record: { ...record },
        dates: [],
        originalIndex: index
      });
      return;
    }

    // Sort dates within each record
    dates.sort((a, b) => a.date - b.date);

    let currentSegment = {
      record: { ...record },
      dates: [dates[0]],
      originalIndex: index
    };

    // Group consecutive dates
    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1].date;
      const currentDate = dates[i].date;

      // Check if there's a date from another record between these dates
      const hasInterleavingDate = flatRecords.some((otherRecord, otherIndex) => {
        if (index === otherIndex) return false;
        const otherDates = getRecordDates(otherRecord);
        return otherDates.some(({ date }) => 
          date > prevDate && date < currentDate
        );
      });

      if (hasInterleavingDate) {
        // Create new segment
        recordSegments.push(currentSegment);
        currentSegment = {
          record: { ...record },
          dates: [dates[i]],
          originalIndex: index
        };
      } else {
        // Add to current segment
        currentSegment.dates.push(dates[i]);
      }
    }
    recordSegments.push(currentSegment);
  });

  // Sort segments by their earliest date
  recordSegments.sort((a, b) => {
    if (a.dates.length === 0) return 1;
    if (b.dates.length === 0) return -1;
    return a.dates[0].date - b.dates[0].date;
  });

  // Create final records array
  const sortedRecords = recordSegments.map(segment => {
    const newRecord = { ...segment.record };
    const type = newRecord.medicalTypeName.toLowerCase();

    // Update the treatmentDates based on the segment's dates
    if (type === 'consultation reports') {
      newRecord.treatmentDates = [{
        ...newRecord.treatmentDates[0],
        treatmentSummary: segment.dates.map(d => d.summary)
      }];
    } else if (type === 'hospital' || type === 'er') {
      newRecord.treatmentDates = [segment.dates[0].data];
    } else {
      newRecord.treatmentDates = segment.dates.map(d => d.data);
    }

    return newRecord;
  });

  // Create corresponding strings array
  const sortedStrings = recordSegments.map(segment => stringArray[segment.originalIndex]);

  return {
    records: [sortedRecords],
    strings: sortedStrings
  };
};

module.exports = {
  sortMedicalRecordsWithStrings,
  generateMedicalTreatment,
  generatePreMedicalTreatment
}