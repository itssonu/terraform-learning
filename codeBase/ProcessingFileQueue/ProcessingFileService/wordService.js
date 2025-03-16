const { Document,
    Paragraph,
    TextRun,
    Packer,
    AlignmentType,
    WidthType,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    BorderStyle,
    Header,
    convertInchesToTwip,
    Tab,
    PageOrientation,
    LevelFormat,
    PageBreak,
    InternalHyperlink,
    Bookmark,
    PageNumber,
    NumberFormat,
    Footer,
    TabStopType
} = require("docx");

const fs = require('fs');
const path = require('path')
const ImageLogo = path.join(__dirname, "../logo/Eastonlogo.jpg")
const moment = require('moment');
const { lifeExpectancyTable, femaleLifeExpectancyTable } = require('./lifeExpectancy');
const { getParseHtmlToTextObjects, getParseHtmlBlock, getArrayOutofHtmlBlock } = require('./dynamicWordDataProcessing')
const { processAi } = require('./ChatGptPdfProcessor');
const { getSummary } = require('./executiveSummary')
const { generateMedicalTreatment } = require('./keyMedicalTreatmentSummary');
const mongoose = require("mongoose");
const CaseSchema = require("../src/db/models/Case");
const { s3Client } = require("../src/utils/aws/client");
const { DEMAND_TYPE, DEMAND } = require("../src/utils/enum");
const SettingSchema = require("../src/db/models/SettingSchema");
const DemandTemplateSchema = require("../src/db/models/DemandTemplateSchema");
const { createAndSaveTemplateReportWord } = require("./templateWordService");

const createAndSaveSetttlementReportWord = async (domainName, caseId, demand) => {
    try {
        //console.log(`createAndSaveSetttlementReportWord`, domainName, caseId, demand)
        console.log(`Creating ${demand.text} for caseID: ${caseId} in the client: ${domainName}`)
        const db = mongoose.connection.useDb(domainName);
        const eastonDB = mongoose.connection.useDb('easton');

        const Case = db.model("cases", CaseSchema);
        const Setting = db.model('settings', SettingSchema);

        const caseData = await Case.findById(caseId).lean();
        const userId = caseData?.userId || null;
        const victimName = caseData?.detailsInput?.caseInfo?.caseName || "";
        const userData = caseData?.detailsInput || "";
        const createDate = caseData?.createdOn || "";
        const liability = caseData?.result?.policeReportChatGptResponse?.join('\n\n') || "";
        const medicalRecords = caseData?.result?.medicalRecords || [];
        const medicalBillRecords = caseData?.result?.medicalBillRecords || [];
        const caseMedicalRecordsParagraphs = caseData?.result?.medicalRecordsParagraphs || "";
        const casePreMedicalRecordsParagraphs = caseData?.result?.preMedicalRecordsParagraphs || "";
        const accidenPhoto = caseData?.result?.accidentPhotoRecords || [];
        const uiSelectedAccidentFiles = caseData?.result?.selectedAccidentFiles || [];
        const bodyInjuryFiles = caseData?.result?.bodyInjuryFiles || [];
        const uiSelectedBodyInjuryFiles = caseData?.result?.selectedBodyInjuryFiles || [];
        const preMedicalRecords = caseData?.result?.preMedicalRecords || [];
        //console.log("pre medical records are: ", preMedicalRecords)
        const policeExhibit = caseData?.result?.policexhibitDirectoryPath || null;
        const medicalRecordsExhibit = caseData?.result?.medicalRecordsExhibitDirectoryPath || null;
        const premMedicalRecordsExhibit = caseData?.result?.preMedicalRecordsExhibitDirectoryPath || null;
        const medicalBillExhibit = caseData?.result?.medicalBillExhibitDirectoryPath || [];
        const painAndSufferingReport = caseData?.result?.painAndSufferingReport || "";
        const visitDates = caseData?.result?.visitDates || "";
        const preMedicalVisitDates = caseData?.result?.preMedicalVisitDates || "";
        const demandType = demand.value;
        const caseType = userData?.caseInfo?.caseType;
        const state = userData?.caseInfo?.stateOfIncident;
        const userCaseInfo = userData?.caseInfo;

        const incidentReportExhibitS3Path = caseData.result?.incidentExhibitDirectoryPath || null;
        const witnessReportExhibitS3Path = caseData.result?.witnessExhibitDirectoryPath || null;
        const expertReportExhibitDirectorys3Path = caseData.result?.expertReportExhibitDirectoryPath || null;
        const incidentImageFileS3Path = caseData.result?.incidentImageFiles || null;
        const selectedIncidentImageFilesS3Path = caseData.result?.selectedIncidentImageFiles || null;

        const productPhotosS3Path = caseData.result?.productPhotos || null;
        const selectedProductPhotoS3Path = caseData.result?.selectedProductPhotos || null;

        const lossOfEarningsExhibitPaths = caseData.result?.lossOfEarningsExhibitPaths || null;
        const medicalExpensesExhibitPaths = caseData.result?.medicalExpensesExhibitPaths || null;
        const lossOfEarningsLLMRes = caseData.result?.lossOfIncomeAnalysis || "";
        const medicalExpensesLLMRes = caseData.result?.medicalExpensesLLM || "";


        const LLMFactsOfIncident = caseData?.result?.LLMFactsOfIncident || "";
        const LLMDangerousCondition = caseData?.result?.LLMDangerousCondition || "";
        const LLMACNotice = caseData?.result?.LLMACNotice || "";
        const LLMAdequateWarning = caseData?.result?.LLMAdequateWarning || "";
        const LLMConsumerExpectation = caseData?.result?.LLMConsumerExpectation || "";
        const LLMRiskBenefit = caseData?.result?.LLMRiskBenefit || "";
        const isExhibitInlcuded = caseData.detailsInput?.caseInfo?.isIncludeExhibit
        
        const LLMManufacturingDefect = caseData?.result?.LLMManufacturingDefect || "";


        const setting = await Setting.findOne({
            isDefault: true
        }).lean();
        const settingTemplate = setting?.template

        const getTemplateQueryParams = {
            state,
            caseType,
            demandType
        };

        let demandTemplate = await getTemplateFromDB(db, getTemplateQueryParams)

        if (!demandTemplate) {
            demandTemplate = await getTemplateFromDB(eastonDB, getTemplateQueryParams)
            if (!demandTemplate) {
                demandTemplate = await getTemplateFromDB(eastonDB, { ...getTemplateQueryParams, state: 'California' })
            }
        }


        let aggregatedMedicalBills = []
        let amount = 0
        if (medicalBillRecords.length > 0) {
            const { billPerProvider, totalBillAmount } = getMedicalBillData(medicalBillRecords)
            aggregatedMedicalBills = billPerProvider
            amount = totalBillAmount
        }


        let name = victimName;
        let bookmarkCounter = 0;
        let hyperlinkCounter = 0;
        const checkcompanyLogo = settingTemplate?.companyLogo;
        const fontName = settingTemplate?.fontFamily || 'Times New Roman';
        let billedAmountHeading = settingTemplate?.billedAmountHeading || false;
        //console.log("Mediucal records are: ", medicalRecords)
        let processedExecutiveSummary = caseMedicalRecordsParagraphs?.length > 0 ? await getSummary({ medicalRecords, userData }) : "No records found";

        let dollarSign = aggregatedMedicalBills?.map((values, index) =>
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({ text: `${index === 0 ? "$" : ""}`, size: 24 })
                ],
            }),
        )

        let totalAmount = aggregatedMedicalBills?.map((values, index) =>
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({
                    children: [values.totalBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
                    size: 24,
                    font: fontName
                }, new Paragraph({})),]
            }))

        let providerName1 = aggregatedMedicalBills?.map((values) => new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({
                children: [values.medicalProviderName + '\n'],
                size: 24,
                font: fontName
            }, new Paragraph({})),]
        }))

        const getFileToS3 = async (awsFilePath) => {
            try {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: awsFilePath,
                };
                const data = await s3Client.getObject(params).promise();
                return data.Body;
            } catch (err) {
                console.error(`Error Get file ${awsFilePath} to S3:`, err);
                throw err;
            }
        };


        const getAlignmentName = (stylename) => {
            const alignmentName = stylename?.split('-').at(-1)
            if (alignmentName === "justify") {
                return AlignmentType.JUSTIFIED
            }
            if (alignmentName === "center") {
                return AlignmentType.CENTER
            }

            if (alignmentName === "left") {
                return AlignmentType.LEFT
            }

            if (alignmentName === "right") {
                return AlignmentType.RIGHT
            }
        }

        const getAlignmentAndIndentationName = (getAlignmentandIndentationName) => {
            const indentName = getAlignmentandIndentationName[0].split('-').at(1)
            const alignmentName = getAlignmentandIndentationName[1]
            const alignment = getAlignmentName(alignmentName)
            return { indentName, alignment }
        }

        let attorneyNames
        let companyLogo
        let attorneyEmails
        let firmAddresss
        let introductions
        let introductionDescriptions
        let factIncidentTitle = demandTemplate?.factIncidentTitle || null;
        let factIncidentDescription = demandTemplate?.factIncidentDescription || null;
        let liabilityTitle = demandTemplate?.liabilityTitle || null;
        let liabilityDescription = demandTemplate?.liabilityDescription || null;
        let isLiabilityDefaultPosition = false;
        if (!liabilityDescription?.includes("[LLMLiabilityDescription]") && liability?.length) {
            isLiabilityDefaultPosition = true
        }

        let liabilityTitles
        let liabilityTitleDescriptions
        let priorMedicalRecordTitles
        let priorMedicalRecordDescriptions
        let nonMedicalTitles
        let nonMedicalDescriptions
        let settlementTitles
        let settlementDescriptions
        let badFaithExposerTitles
        let badFaithExposerDescriptions
        let termOfSettlementTitles
        let termOfSettlementDescriptions
        let lossOfincomeTitle = demandTemplate?.lossOfIncomeTitle || null;
        let lossOfIncomeDescription = demandTemplate?.lossOfIncomeDescription || null;
        let firmNameTitle
        try {



            // ============================
            let awsAccidentFilesArr = [];
            let awsSelectedAccidentFilesArr = [];
            if (accidenPhoto && accidenPhoto.length > 0) {
                try {
                    const awsFilesArr = Promise.all(accidenPhoto.map(async (awsFilePath) => {
                        const params = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: awsFilePath,
                        };
                        const result = await s3Client.getObject(params).promise();

                        let selectedFile = uiSelectedAccidentFiles.some(filePath => awsFilePath === filePath);
                        if (selectedFile) {
                            awsSelectedAccidentFilesArr.push(result.Body)
                        }
                        return result.Body;
                    }));
                    awsAccidentFilesArr = await awsFilesArr;
                } catch (error) {
                    console.error('Error fetching files from S3:', error);
                    throw error;
                }
            }

            let awsBodyInjuryFilesArr = [];
            let awsSelectedBodyInjuryFilesArr = [];
            if (bodyInjuryFiles && bodyInjuryFiles.length > 0) {
                try {
                    const awsFilesArr = Promise.all(bodyInjuryFiles.map(async (awsFilePath) => {
                        const params = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: awsFilePath,
                        };
                        const result = await s3Client.getObject(params).promise();

                        let selectedFile = uiSelectedBodyInjuryFiles.some(filePath => awsFilePath === filePath);
                        if (selectedFile) {
                            awsSelectedBodyInjuryFilesArr.push(result.Body)
                        }
                        return result.Body;
                    }));
                    awsBodyInjuryFilesArr = await awsFilesArr;
                } catch (error) {
                    console.error('Error fetching files from S3:', error);
                    throw error;
                }
            }

            const bodyInjuryFilesArr = awsBodyInjuryFilesArr.map(file => {
                return (
                    new Paragraph({
                        spacing: { after: 50, before: 50 },
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: file,
                                transformation: { width: 550, height: 450 }
                            }),
                        ]
                    })
                )
            });
            const selectedBodyInjuryFilesArr = awsSelectedBodyInjuryFilesArr.map(file => {
                return (
                    new Paragraph({
                        spacing: { after: 50, before: 50 },
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: file,
                                transformation: { width: 550, height: 450 }
                            }),
                        ]
                    })
                )
            });

            const accidentFilesArr = awsAccidentFilesArr.map(file => {
                return (
                    new Paragraph({
                        spacing: { after: 50, before: 50 },
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: file,
                                transformation: { width: 550, height: 450 }
                            }),
                        ]
                    })
                )
            });
            const selectedAccidentFiles = awsSelectedAccidentFilesArr.map(file => {
                return (
                    new Paragraph({
                        spacing: { after: 50, before: 50 },
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: file,
                                transformation: { width: 550, height: 450 }
                            }),
                        ]
                    })
                )
            });



            const getExhibitArr = async (s3PathArr) => {
                if (s3PathArr?.length <= 0) { return [] }
                let s3PromiseArr = Promise.all(s3PathArr.map(async (fileName) => {
                    const awsFile = await getFileToS3(fileName);
                    return awsFile
                }));
                s3PromiseArr = await s3PromiseArr;

                const exhibitArr = s3PromiseArr?.map((values, index) => {
                    return new Paragraph({
                        spacing: { after: 120 },
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: values,
                                transformation: { width: 650, height: 700 },
                            })
                        ]
                    })
                });
                return exhibitArr;
            }


            const exhibitImageAndSelectedArr = async (s3pathArr, selectedS3Path) => {
                try {
                    const exhibitImageArr = []
                    const selectedExhibitImageArr = []

                    await Promise.all(s3pathArr.map(async (awsFilePath) => {
                        const params = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: awsFilePath,
                        };
                        const result = await s3Client.getObject(params).promise();

                        const docxImage = new Paragraph({
                            spacing: { after: 50, before: 50 },
                            alignment: AlignmentType.CENTER,
                            children: [
                                new ImageRun({
                                    data: result?.Body,
                                    transformation: { width: 550, height: 450 }
                                }),
                            ]
                        })

                        exhibitImageArr.push(docxImage);
                        let selectedFile = selectedS3Path.some(filePath => awsFilePath === filePath);
                        if (selectedFile) {
                            selectedExhibitImageArr.push(docxImage);
                        }
                    }));
                    return { exhibitImageArr, selectedExhibitImageArr };
                } catch (error) {
                    console.error('Error fetching files from S3:', error);
                    throw error;
                }

            }

            const { exhibitImageArr: incidentImageExhibitArr = [], selectedExhibitImageArr: selectedIncidentImageExhibitArr = [] } = incidentImageFileS3Path ? await exhibitImageAndSelectedArr(incidentImageFileS3Path, selectedIncidentImageFilesS3Path) : {};

            let { exhibitImageArr: productExhibitImageArr = [], selectedExhibitImageArr: selectedProductExhibitArr = [] } = productPhotosS3Path ? await exhibitImageAndSelectedArr(productPhotosS3Path, selectedProductPhotoS3Path) : [];


            // ============================
            ////////////////////////////////////////////////////////////////////////// Supporting functions Starts from here /////////////////////////////////////////////////////////////////
            const logo = new ImageRun({
                data: fs.readFileSync(ImageLogo),
                transformation: { width: 120, height: 60 },
            })

            const medicalSpecialTotal = new Table({
                // alignment: AlignmentType.JUSTIFIED,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 5900,
                                    type: WidthType.DXA,
                                },
                                children: [
                                    new Paragraph({ children: [new TextRun({ text: "TOTAL", size: 24, font: fontName, bold: 'true' })] })
                                ],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Top border
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Left border
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Right border
                                },
                            }),
                            new TableCell({
                                width: {
                                    size: 800,
                                    type: WidthType.DXA,
                                },
                                children: [
                                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$`, size: 24, font: fontName, bold: true })] }), // Dynamic content for totalAmount
                                ],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                },
                            }),
                            new TableCell({
                                width: {
                                    size: 800,
                                    type: WidthType.DXA,
                                },
                                children: [
                                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, size: 24, font: fontName, bold: 'true' })] }), // Dynamic content for totalAmount
                                ],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                },
                            }),
                        ],
                    }),
                ],
                alignment: AlignmentType.CENTER
            });

            const findingsRendering = (values, index) => {
                try {
                    return values.treatmentDates?.map((data, index) => data?.findings)[index].map((findings, index) =>
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            numbering: {
                                reference: "my-unique-bullet-points",
                                level: 0,
                            },
                            children: [
                                new TextRun({ text: findings, size: 24 })
                            ]
                        }))
                } catch (e) {
                    console.log(e)
                    console.log("values was: ", values)
                    return []
                }

            }

            const getLifeExpectancy = (age, gender, state) => {
                let data;
                let life_state;
                if (gender === "Male") {
                    !lifeExpectancyTable.hasOwnProperty(state) ? life_state = "National" : life_state = state; 
                    for (const entry of lifeExpectancyTable[life_state]) {
                        const ageRange = entry["Age Range"];
                        const [startAge, endAge] = ageRange.split('-').map(Number);

                        if (startAge <= age && age <= endAge) {
                            //console.log(entry["Expectation of life at age x"])
                            data = entry["Expectation of life at age x"];
                            return entry["Expectation of life at age x"];
                        }
                    }
                } else {
                    !femaleLifeExpectancyTable.hasOwnProperty(state) ? life_state = "National" : life_state = state; 
                    for (const entry of femaleLifeExpectancyTable[life_state]) {
                        const ageRange = entry["Age Range"];
                        const [startAge, endAge] = ageRange.split('-').map(Number);

                        if (startAge <= age && age <= endAge) {
                            //console.log(entry["Expectation of life at age x"])
                            data = entry["Expectation of life at age x"];
                            return entry["Expectation of life at age x"];
                        }
                    }
                }
                return data
            }

            const pastNoneEconomicsDamagesAmount = (claimAmount, monthsDifference) => {
                claimAmount = claimAmount?.replace(',', '')
                const claimedAmount = parseInt(claimAmount)
                const finalAmount = claimedAmount * monthsDifference;
                return finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }

            const totalSettlementAmount = (amount, postNonEconomicsDamagesFinalAmount, pastNonEconomicDamages) => {
                const postNonEconimicAmount = parseFloat(postNonEconomicsDamagesFinalAmount.replaceAll(',', ''))
                const pastNonEconomicAmount = parseFloat(pastNonEconomicDamages.replaceAll(',', ''))
                const medicalExpenseAmount = amount
                const settlementAmoount = (postNonEconimicAmount + pastNonEconomicAmount + medicalExpenseAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                return settlementAmoount
            }

            const lossOFIncomeCalculation = (workHourMissed, hourlyIncomeRate) => {
                const workHour = parseFloat(workHourMissed)
                const hourlyIncome = parseFloat(hourlyIncomeRate)
                const totalLossOfIncome = workHour * hourlyIncome
                return '$' + totalLossOfIncome.toLocaleString('en-US')
            }


            const replaceVariablesWithValues = (
                textData,
                clientName,
                faulterName,
                accidentDate,
                claimAmount, annualClaimAmount,
                lifeExpectancyAge,
                age,
                perDayAmountForFutureNonEconomicDamages,
                monthsDifference,
                createdDate,
                clientProfession,
                hourlyIncomeRate,
                workHourMissed,
                gender,
                postNonEconomicsDamagesFinalAmount,
                perDayPasNonEconomicDamagesFinalAmount,
                pastNonEconomicDamages,
                liability,
                policeExhibitLinkParam,
                painAndSufferingData,
                clientFullName,
                isUpperCase

            ) => {

                const replacements = {
                    "[Clientname]": clientName,
                    "[clientFullName]": clientFullName,
                    "[FaulterName]": faulterName,
                    "[AccidentDate]": accidentDate,
                    "[lifeExpectancyAge]": lifeExpectancyAge,
                    "[PastMonthlyPainAmount]": `$` + claimAmount,
                    "[FutureYearlyPainAmount]": `$` + annualClaimAmount,
                    "[Age]": age,
                    "[CreatedDate]": createdDate,
                    "[monthsDifference]": month,
                    "[ClientProfession]": clientProfession,
                    "[MissedWorkHours]": hourlyIncomeRate,
                    "[HourlyWorkingRate]": workHourMissed,
                    "[perDayAmountForFutureNonEconomicDamages]": perDayAmountForFutureNonEconomicDamages,
                    "[his/her]": gender === "Male" ? "his" : "her",
                    "[he/she]": gender === "Male" ? "he" : "she",
                    "[him/her]": gender === "Male" ? "him" : "her",
                    "[postNonEconomicsDamagesFinalAmount]": `$` + postNonEconomicsDamagesFinalAmount,
                    "[perDayPasNonEconomicDamagesFinalAmount]": `$` + perDayPasNonEconomicDamagesFinalAmount,
                    "[pastNonEconomicDamages]": pastNonEconomicDamages,
                    "[lossofIncomeCalculatedAmount]": lossofIncomeCalculatedAmount,
                    "[PoliceReportExhibit]": "",
                    "[PropertyInjuryPhotosExhibit]": "",
                    "[PriorMedicalRecordExhibit]": "",
                    "[AccidentInjuryPhotosExhibit]": "",
                    "[PainAndSuffringSection]": "",
                    "[LLMLiabilityDescription].": liability,
                    "[LLMLiabilityDescription]": liability,
                    "[LLMDangerousCondition]": LLMDangerousCondition,
                    "[LLMACNotice]": LLMACNotice,
                    "[LLMFactsOfIncident]": LLMFactsOfIncident,
                    "[defAdjusterName]" : userCaseInfo?.defendantAdjusterName,
                    "[defInsuranceName]" : userCaseInfo?.defendantInsuranceName,
                    "[defAdjusterAddress]" : userCaseInfo?.defendantAdjusterAddress,
                    "[defAdjusterCity]" : userCaseInfo?.defendantCity,
                    "[defAdjusterState]" : userCaseInfo?.defendantState,
                    "[defAdjusterZip]" : userCaseInfo?.defendantZip,
                    "[clientAdjusterName]" : userCaseInfo?.clientAdjusterName,
                    "[clientInsuranceName]" : userCaseInfo?.clientInsuranceName,
                    "[clientAdjusterAddress]" : userCaseInfo?.clientAdjusterAddress,
                    "[clientAdjusterCity]" : userCaseInfo?.clientCity,
                    "[clientAdjusterState]" : userCaseInfo?.clientState,
                    "[clientAdjusetrZip]" : userCaseInfo?.clientZip,
                    "[defClaimNumber]" : userCaseInfo?.defendantClaimNumber,
                    "[clientClaimNumber]" : userCaseInfo?.clientClaimNumber,
                    "[defInsuranceLastName]" : userData?.painAndSuffering?.gender === "Male"  ? `Mr. ${userData?.caseInfo?.defendantAdjusterName?.trim().split(" ").at(-1)}` : `Ms. ${userData?.caseInfo?.defendantAdjusterName?.trim().split(" ").at(-1)}`,
                    "</t>": "",
                    "[LLMLossIncome]." : lossOfEarningsLLMRes,
                    "[LLMMedicalExpenses]." : medicalExpensesLLMRes, 
                    "[LLMLossIncome]" : lossOfEarningsLLMRes,
                    "[LLMMedicalExpenses]" : medicalExpensesLLMRes, 
                };

                let resultText = textData;

                for (const [key, value] of Object.entries(replacements)) {
                    resultText = resultText?.replaceAll(key, value);
                }
                // console.log(resultText);

                return resultText;
            };


            let pureVisitsDates = [];
            for (let i = 0; i < visitDates.length; i++) {
                if (visitDates[i].length > 10 || visitDates[i].length === 2) {
                    pureVisitsDates.push(visitDates[i].replace(visitDates[i], ''))
                } else {
                    pureVisitsDates.push(visitDates[i])
                }
            }

            let uniqueDateArr = []
            const uniqueVisitsDates = (dates, index) => {
                if (index === 0) {
                    uniqueDateArr.push(dates)
                }
                if (index !== 0) {
                    let previousDate = uniqueDateArr.at(-1)
                    if (previousDate === dates || previousDate.length === 0) {
                        const uniqueDate = `${dates}_U${index}`
                        uniqueDateArr.push(uniqueDate)
                    } else {
                        uniqueDateArr.push(dates)
                    }
                }

            }

            for (let i = 0; i < pureVisitsDates.length; i++) {
                uniqueVisitsDates(pureVisitsDates[i], i)
            }

            // console.log(uniqueDateArr)

            let purePreMeidcalVisitsDates = [];
            for (let i = 0; i < preMedicalVisitDates.length; i++) {
                if (preMedicalVisitDates[i].length > 10 || preMedicalVisitDates[i].length === 2) {
                    purePreMeidcalVisitsDates.push(preMedicalVisitDates[i].replace(preMedicalVisitDates[i], ''))
                } else {
                    purePreMeidcalVisitsDates.push(preMedicalVisitDates[i])
                }
            }

            let uniquePreMedicalDateArr = []
            const uniquePreMedicalVisitsDates = (dates, index) => {
                if (index === 0) {
                    uniquePreMedicalDateArr.push(dates)
                }
                if (index !== 0) {
                    let previousDate = uniquePreMedicalDateArr.at(-1)
                    if (previousDate === dates || previousDate.length === 0) {
                        const uniqueDate = `${dates}_U${index}`
                        uniquePreMedicalDateArr.push(uniqueDate)
                    } else {
                        uniquePreMedicalDateArr.push(dates)
                    }
                }

            }

            for (let i = 0; i < purePreMeidcalVisitsDates.length; i++) {
                uniquePreMedicalVisitsDates(purePreMeidcalVisitsDates[i], i)
            }


            const getProcessedMedicalRecords = async (key) => {
                let values = ""
                if (key) {
                    values = casePreMedicalRecordsParagraphs
                } else {
                    values = caseMedicalRecordsParagraphs
                }

                let paragraphs = [""]
                if (values) {
                    paragraphs = values.split('\n').map(para => para.trim()).filter(para => para.length > 0);
                }

                const docxParagraphs = paragraphs.map(text => {
                    // Check if the line starts with a bullet point
                    if (text.startsWith('•' || "-")) {
                        // Handle bullet points
                        return new Paragraph({
                            children: [
                                new TextRun({
                                    text: "\u2022",
                                    bold: true,
                                }),

                                new TextRun({
                                    text: "\t",
                                }),

                                new TextRun({ children: [text.substring(1).trim()], size: 24, font: fontName })
                            ],
                            tabStops: [
                                {
                                    type: TabStopType.LEFT,
                                    position: convertInchesToTwip(0.5),
                                },
                            ],
                            indent: {
                                left: convertInchesToTwip(0.5),
                                hanging: convertInchesToTwip(0.25)
                            },
                            // numbering: { reference: "my-unique-bullet-points", level: 0 },
                            spacing: {
                                before: 10,
                                after: 10
                            },
                            alignment: AlignmentType.JUSTIFIED,
                        });
                    } else {
                        // Regular paragraph
                        return new Paragraph({
                            children: [
                                new TextRun({ children: [new Tab(), text], size: 24, font: fontName })
                            ],
                            spacing: {
                                before: 120,
                                after: 120
                            },
                            alignment: AlignmentType.JUSTIFIED,
                        });
                    }
                });


                return docxParagraphs
            }

            /////////////////////////////////////////////////////////////////////////////////////// Ends ////////////////////////////////////////////////////////////////////////////////////////////

            ////////////////////////////////////////////// Medical Records/Pre Medical Records Rendering Code Start from here/////////////////////////////////////////////////////////////////////////////////////
            const preMedicalRecordsParagraphs = preMedicalRecords.length ? await getProcessedMedicalRecords(true) : []

            const medicalRecordsParagraphs = medicalRecords.length ? await getProcessedMedicalRecords(false) : []

            ////////////////////////////////////////////////////////////////////////////////////// Ends ////////////////////////////////////////////////////////////////////////////////////

            ////////////////////////////////////////////////////////// Hyperlinks Intialization Codes Start from here//////////////////////////////////////////////////////////////////////////////////
            let policeExhibitPaths = []
            let medicalRecordsExhibitPath = []
            let preMedicalExhibitPath = []
            let medicalBillExhibitPath = []
            let imageDates = []

            if (policeExhibit?.length > 0) {
                const policeExhibitArr = Promise.all(policeExhibit.map(async (fileName) => {
                    const awsFile = await getFileToS3(fileName);
                    return awsFile
                }));
                policeExhibitPaths = await policeExhibitArr;
            }

            if (medicalRecordsExhibit?.length > 0) {
                const medicalRecordsExhibitArr = Promise.all(medicalRecordsExhibit.map(async (fileName) => {

                    const awsFile = await getFileToS3(fileName);
                    return awsFile
                }));
                medicalRecordsExhibitPath = await medicalRecordsExhibitArr;
            }

            if (premMedicalRecordsExhibit?.length > 0) {
                const premMedicalRecordsExhibitArr = Promise.all(premMedicalRecordsExhibit.map(async (fileName) => {
                    const awsFile = await getFileToS3(fileName);
                    return awsFile
                }));
                preMedicalExhibitPath = await premMedicalRecordsExhibitArr;
            }

            if (medicalBillExhibit?.length > 0) {
                const medicalBillExhibitArr = Promise.all(medicalBillExhibit.map(async (fileName) => {
                    const awsFile = await getFileToS3(fileName);
                    return awsFile
                }));
                medicalBillExhibitPath = await medicalBillExhibitArr;
            }

            const policeReportExhibit = policeExhibitPaths?.map((values, index) => {
                return new Paragraph({
                    spacing: { after: 120 },
                    alignment: AlignmentType.CENTER,
                    children: [
                        new ImageRun({
                            data: values,
                            transformation: { width: 650, height: 700 },
                        })
                    ]
                })
            })

            const medicalRecordsExhibitData = medicalRecordsExhibitPath?.map((values, index) => {
                return new Paragraph({
                    spacing: { after: 120 },
                    // alignment: AlignmentType.JUSTIFIED,
                    indent: { right: convertInchesToTwip(0.7) },
                    children: [
                        new Bookmark({
                            id: `imageMedId${index + 1}`,
                            children: [
                                new InternalHyperlink({
                                    children: [new TextRun({ text: 'Back', style: 'Hyperlink' }),

                                    ], anchor: `Exhibit3Id` //need "unsorted" uniqueDateArr
                                })
                            ]

                        }),
                        new ImageRun({
                            data: values,
                            transformation: { width: 650, height: 700, },
                        })
                    ]
                })
            })

            const preMedicalRecordsExhibitData = preMedicalExhibitPath?.map((values, index) => {
                return new Paragraph({
                    spacing: { after: 120 },
                    children: [
                        new Bookmark({
                            id: `imagePreMedId${index + 1}`,
                            children: [
                                new InternalHyperlink({
                                    children: [new TextRun({ text: 'Back', style: 'Hyperlink' }),

                                    ], anchor: `Exhibit2Id`
                                })
                            ]

                        }),
                        new ImageRun({
                            data: values,
                            transformation: { width: 650, height: 700 },
                        })
                    ]
                })
            })

            //Do Not suffle the following squence.
            const policeExhibitLink = policeReportExhibit?.length ? new InternalHyperlink({
                children: [
                    new TextRun({
                        text: (liability && !userData?.liability?.description?.trim()) ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.` : 'EXHIBIT',
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "policeExhibitId",
            }) : ''

            let policeReportHyperlinkNumber = (liability && !userData?.liability?.description?.trim() && policeReportExhibit?.length) ? hyperlinkCounter : -1

            const accidenPhotoExhibitLink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: awsAccidentFilesArr?.length ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}` : "",
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "accidentPhotosExhibitId",
            })

            let accidentPhotoHyperlinkNumber = awsAccidentFilesArr?.length ? hyperlinkCounter : -1

            const preMedicalExhibitLink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: premMedicalRecordsExhibit ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.` : "",
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "preMedicalRecordsExhibitId",
            })

            let preMedicalHyperlinkNumber = premMedicalRecordsExhibit ? hyperlinkCounter : -1

            const medicalRecordExhibitLink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: medicalRecords?.length ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.` : "",
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "medicalRecordExhibitId",
            })

            let medicalHyperlinkNumber = medicalRecords?.length ? hyperlinkCounter : -1

            const bodyInjuryExhibitLink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: awsBodyInjuryFilesArr?.length ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.` : "",
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "bodyInjuryExhibitLinkId",
            })

            let bodyInjryPhotoHyperlinkNumber = awsBodyInjuryFilesArr?.length ? hyperlinkCounter : -1

            const lossOfIncomeExhibitLink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.`,
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "lossOfIncomeExhibitId",
            })

            let lossOfEarningsHyperlinkNumber = lossOfEarningsExhibitPaths?.length > 0 ? hyperlinkCounter : -1

            const futureExpenseExhibitLink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.`,
                        bold: true,
                        color: '0563C1',
                        size: 24,
                        style: "Hyperlink",
                    }),
                ],
                anchor: "medicalExpensesExhibitPathsId",
            })

            let futureExpenseHyperlinkNumber = medicalExpensesExhibitPaths?.length > 0 ? hyperlinkCounter : -1
            ////////////////////////////////////////////////////////////////////////////////////// Ends /////////////////////////////////////////////////////////////////////////////////////////////



            //////////////////////////////////////////////////////////////////////////// Supporting Variables //////////////////////////////////////////////////////////////////////////        
            let gender = userData?.painAndSuffering?.gender;
            const isMale = gender === "Male"
            gender = isMale ? "Male" : "Female"
            const his_her = isMale ? "his" : "her"
            const he_she = isMale ? "he" : "she"
            const him_her = isMale ? "him" : "her"
            const createdDate = moment(createDate).format('MMMM D, YYYY');
            const claimAmount = userData?.painAndSuffering?.monthlyamount.split('.')[0]
            const annualClaimAmount = userData?.painAndSuffering?.annualamount.split('.')[0]
            const clientProfession = userData.damage?.typeofWork;
            const hourlyIncomeRate = userData.damage?.hourlyIncomeRate;
            const workHourMissed = userData.damage?.WorkHoursMissed;
            let clientName = gender === "Male" ? `Mr. ${userData?.caseInfo?.clientName?.trim().split(" ").at(-1)}` : `Ms. ${userData?.caseInfo?.clientName?.trim().split(" ").at(-1)}`
            let clientFullName = `${userData?.caseInfo?.clientName}`
            const faulterName = `${userData?.caseInfo?.defendantName}`
            const accidentDate = moment(userData?.caseInfo?.dateOfIncident).format('MMMM D, YYYY')
            const lifeExpectancyAge = getLifeExpectancy(userData?.painAndSuffering?.age, gender, state)
            const accidentDateMoment = moment(userData?.caseInfo?.dateOfIncident);
            const createdDateMoment = moment(createDate);
            // Calculate difference using the moment objects
            let monthsDifference = parseInt(createdDateMoment.diff(accidentDateMoment, 'months', true));
            let month = isNaN(monthsDifference) ? parseInt('0') : monthsDifference
            const pastNonEconomicDamages = pastNoneEconomicsDamagesAmount(claimAmount, month);
            const perDayAmountForFutureNonEconomicDamages = Math.ceil(parseInt(annualClaimAmount.replace(',', '')) / 365)
            const postNonEconomicsDamagesFinalAmount = (parseInt(annualClaimAmount.replace(',', '')) * lifeExpectancyAge).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const perDayPasNonEconomicDamagesAmount = Math.floor(parseInt(claimAmount.replace(',', '')) / 30)
            // console.log('perDayAmount', perDayPasNonEconomicDamagesAmount)
            const perDayPasNonEconomicDamagesFinalAmount = perDayPasNonEconomicDamagesAmount.toLocaleString('en-US');
            const age = userData?.painAndSuffering?.age
            const lossofIncomeCalculatedAmount = lossOFIncomeCalculation(workHourMissed, hourlyIncomeRate)

            const renderTextRun = (text, textObj) => {
                return (
                    new TextRun({
                        children: [text?.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(text, clientName,
                            faulterName,
                            accidentDate,
                            claimAmount, annualClaimAmount,
                            lifeExpectancyAge,
                            age,
                            perDayAmountForFutureNonEconomicDamages,
                            monthsDifference,
                            createdDate,
                            clientProfession,
                            hourlyIncomeRate,
                            workHourMissed,
                            gender,
                            postNonEconomicsDamagesFinalAmount,
                            perDayPasNonEconomicDamagesFinalAmount,
                            pastNonEconomicDamages,
                            liability,
                            policeExhibitLink)],
                        size: textObj?.style.includes('font-size') ? getFontSize(textObj.style, 24) : 24,
                        color: textObj?.style.includes('color') ? getFontColor(textObj?.style) : "",
                        bold: textObj.isBold || false,
                        italics: textObj.isItalic || false,
                        underline: textObj.isUnderline || false
                    })
                )
            }

            const renderExhibitText = (textObj) => {
                if (textObj.textData.includes("[PropertyInjuryPhotosExhibit]") && !awsAccidentFilesArr?.length) {
                    textObj.textData = textObj.textData
                        .split(".")
                        .filter((text) => !text.includes("[PropertyInjuryPhotosExhibit]"))
                        .join(".");
                }
                textObj.textData = textObj.textData
                                    .replace("[PoliceReportExhibit].", "[PoliceReportExhibit]")
                                    .replace("[PropertyInjuryPhotosExhibit].", "[PropertyInjuryPhotosExhibit]");
                const textChunks = textObj.textData.split(/(\[PoliceReportExhibit\]|\[PropertyInjuryPhotosExhibit\])/);
                const paragraphChildren = textChunks.map(text => {
                    if (text === "[PoliceReportExhibit]") {
                        return isExhibitInlcuded ? policeExhibitLink : "";
                    }
                    else if (text === "[PropertyInjuryPhotosExhibit]") {
                        return isExhibitInlcuded ? accidenPhotoExhibitLink :"";
                    }
                    else {
                        return renderTextRun(text, textObj);
                    }
                });
                return paragraphChildren
            }



            const getDOCXTitle = (titleValue = null, bookmarkId = "") => {
                titleValue = getParseHtmlToTextObjects(titleValue);
                if (titleValue) {
                    titleValue = titleValue.map((values, index) => {
                        if (values.length === 1) {
                            return values.map((x) =>
                                new Paragraph({
                                    alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                    numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                    spacing: { after: 120 },
                                    children: [
                                        new Bookmark({
                                            id: bookmarkId,
                                            children: [
                                                renderTextRun(x.textData, x)
                                            ]
                                        })
                                    ]
                                })
                            );
                        } else {
                            return new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                children: [
                                    new Bookmark({
                                        id: bookmarkId,
                                        children: values.map((y) => renderTextRun(y.textData, y))
                                    })
                                ]
                            });
                        }
                    }).flat();
                }
                return titleValue;
            }
            const getDOCXDescription = (descriptionValue = null, bookmarkId = "") => {
                descriptionValue = getParseHtmlToTextObjects(descriptionValue);
                if (descriptionValue) {
                    descriptionValue = descriptionValue.filter(x => x.length).map((values, index) => {
                        if (values[0]?.listType === "OL" || values[0]?.listType === "UL") {
                            return values.map((x) => {
                                return new Paragraph({
                                    alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                    numbering: x.listType === "OL" ? { reference: "my-crazy-numbering", level: 1 } : x.listType === "UL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                    indent: x.className?.includes('ql-indent') ? getAlignmentAndIndentationName(x?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                    children: [
                                        new Bookmark({
                                            id: bookmarkId,
                                            children: renderExhibitText(x)
                                        })
                                    ]
                                })
                            });
                        } else {
                            return new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                numbering: values[0]?.listType === "OL" ? { reference: "my-crazy-numbering", level: 1 } : values[0]?.listType === "UL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [
                                    new Bookmark({
                                        id: bookmarkId,
                                        children: values.map((y) => renderExhibitText(y)).flat()
                                    })
                                ]
                            });
                        }
                    }).flat();
                }
                return descriptionValue
            }


            let getDataByCompanyName = []
            let nonEconomicDamageDescription = []

            const rgbToHex = (r, g, b) => {
                return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
            }

            const getFontColor = (fontColorValue) => {
                try {
                    let fontColor = []
                    let santizedFontColor = fontColorValue.split(';').filter(x => x.length)
                    santizedFontColor.map((values) => {
                        if (values.includes('rgb')) {
                            fontColor.push(values)
                        }
                    })
                    let santizedFontColorName = fontColor?.join('').split(':')[1]
                    // console.log('Error is here', santizedFontColorName)
                    santizedFontColorName = santizedFontColorName ? santizedFontColorName.replace('rgb', '').replace('(', '').replace(')', '').split(',') : ""
                    if (santizedFontColorName) {
                        const red = parseInt(santizedFontColorName[0])
                        const green = parseInt(santizedFontColorName[1])
                        const blue = parseInt(santizedFontColorName[2])

                        const colorName = rgbToHex(red, green, blue)

                        //console.log(colorName)
                        return colorName
                    }
                    return ''
                } catch (e) {
                    consol.log(e)
                }
            }

            const getFontSize = (fontSizeData, defaultFontSize) => {
                try {
                    let fontSize = []
                    let santizedFontFamily = fontSizeData.split(';').filter(x => x.length)
                    santizedFontFamily.map((values) => {
                        if (values.includes('font-size')) {
                            fontSize.push(values)
                        }
                    })
                    const santizedFontSize = fontSize?.join('').split(':')[1].replace('px', '')
                    return isNaN(santizedFontSize) ? defaultFontSize : santizedFontSize
                } catch (e) {
                    console.log(e)
                }
            }

            let reportWithClientName = painAndSufferingReport?.replace(/\[clientName\](?:'s)?/gi, `${clientName}'s`).replace(/(\r\n|\n|\r){2,}/g, '\n').replace(/^\s+|\s+$/g, '');
            const painAndSufferingReportText = reportWithClientName?.trim().split('\n')
            const painAndSufferingReportData = reportWithClientName?.trim().split('\n').map((text, index) => {
                return (

                    new Paragraph({
                        spacing: { after: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun({
                            children: [new Tab(), text],
                            size: 24,
                        })]
                    })
                )
            });

            const getFormattedStockLanguage = async (companyNameData,
                attorneyNameData,
                attorneyEmailData,
                firmAddressData,
                introductionData,
                liabilityTitleData,
                liabilityDescriptionData,
                introductionTitleData,
                introductionDescriptionData,
                priorMedicalRecordTitleData,
                priorMedicalRecordDescriptionData,
                nonEconomicDamageTitleData,
                nonEconomicDamageDescriptionData,
                settlementDemandTitleData,
                settlementDemandDescriptionData,
                badFaithExposerTitleData,
                badFaithExposerDescriptionData,
                termOfSettlementTitleData,
                termOfSettlementDescriptionData,
                lossofIncomeData,
                lossofIncomeDescriptionData,
                firmName) => {
                const attorneyName = getParseHtmlToTextObjects(attorneyNameData)

                const attorneyNameHasAlphanumeric = attorneyName.some(arr =>
                    arr.some(obj => {
                        const cleanText = obj.textData.replace(/<br>|\n/g, '');
                        return /[a-zA-Z0-9]/.test(cleanText);
                    })
                );

                attorneyNames = !attorneyNameHasAlphanumeric ? [] : attorneyName?.map(values => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                indent: x[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [new TextRun({
                                    children: [x.textData?.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                        faulterName,
                                        accidentDate,
                                        claimAmount, annualClaimAmount,
                                        lifeExpectancyAge,
                                        age,
                                        perDayAmountForFutureNonEconomicDamages,
                                        monthsDifference,
                                        createdDate,
                                        clientProfession,
                                        hourlyIncomeRate,
                                        workHourMissed,
                                        gender,
                                        postNonEconomicsDamagesFinalAmount,
                                        perDayPasNonEconomicDamagesFinalAmount,
                                        pastNonEconomicDamages,
                                        liability,
                                        policeExhibitLink)],
                                    size: x?.style.includes('font-size') ? getFontSize(x.style, 15) : 15,
                                    color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                    bold: x.isBold || false,
                                    italics: x.isItalic || false,
                                    underline: x.isUnderline || false
                                })]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink)],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 15) : 15,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false

                            }))

                        });
                    }
                }).flat();

                if (checkcompanyLogo) {
                    companyLogo = await getFileToS3(checkcompanyLogo);
                }

                const attorneyEmail = getParseHtmlToTextObjects(attorneyEmailData)

                const attornyEmailHasAlphanumeric = attorneyEmail.some(arr =>
                    arr.some(obj => {
                        const cleanText = obj.textData.replace(/<br>|\n/g, '');
                        return /[a-zA-Z0-9]/.test(cleanText);
                    })
                );

                attorneyEmails = !attornyEmailHasAlphanumeric ? [] : attorneyEmail?.map(values => {
                    let valuesToCheck = ["left", "justify", undefined, null, ""]
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.CENTER,
                                indent: x[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [new TextRun({
                                    children: [valuesToCheck.includes(x.className?.split('-').at(-1)) ? "        " : "", replaceVariablesWithValues(x.textData, clientName,
                                    )],
                                    size: x?.style.includes('font-size') ? getFontSize(x.style, 15) : 15,
                                    color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                    bold: x.isBold || false,
                                    italics: x.isItalic || false,
                                    underline: x.isUnderline || false
                                })]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.CENTER,
                            indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                            children: values.map((y) => new TextRun({
                                children: [valuesToCheck.includes(y.className?.split('-').at(-1)) ? "        " : "", replaceVariablesWithValues(y.textData, clientName,
                                )],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 15) : 15,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const firmAddress = getParseHtmlToTextObjects(firmAddressData)

                firmAddresss = firmAddress?.map(values => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                indent: x[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [new TextRun({
                                    children: [x.textData?.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                    )],
                                    size: x?.style.includes('font-size') ? getFontSize(x.style, 15) : 15,
                                    color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                    bold: x.isBold || false,
                                    italics: x.isItalic || false,
                                    underline: x.isUnderline || false
                                })]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                )],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 15) : 15,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const introductionTitleArray = getParseHtmlToTextObjects(introductionTitleData)

                introductions = introductionTitleArray?.map((values, index) => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink, "", clientFullName)],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    }),
                                ]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink, "", clientFullName)],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const introductionDescription = getParseHtmlToTextObjects(introductionDescriptionData)

                introductionDescriptions = introductionDescription.map((values, index) => {
                    if (values.length === 1 || values[0]?.listType === "OL" || values[0]?.listType === "UL") {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x?.listType === "OL" || x?.listType === "UL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink, "", clientFullName)],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    }),
                                ]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            numbering: values[0]?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                            spacing: { after: 120 },
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink, "", clientFullName)],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const priorMedicalRecordTitleArray = getParseHtmlToTextObjects(priorMedicalRecordTitleData)
                priorMedicalRecordTitles = priorMedicalRecordTitleArray.map((values, index) => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName.toUpperCase(),
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink, "", clientFullName.toUpperCase())],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    }),
                                ]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName.toUpperCase(),
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink, "", clientFullName.toUpperCase())],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const priorMedicalRecordDescription = getParseHtmlToTextObjects(priorMedicalRecordDescriptionData)

                priorMedicalRecordDescriptions = priorMedicalRecordDescription.filter(x => x.length).map((values, index) => {
                    if (values.length === 1) {
                        if (values[0].textData.includes("[PriorMedicalRecordExhibit]")) {
                            return values.map((x) => new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                children: isExhibitInlcuded ? [
                                    new Bookmark({
                                        id: "Exhibit2Id",
                                        children: [
                                            new TextRun({
                                                children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(
                                                    x.textData.replace('.', ""), clientName
                                                ), preMedicalExhibitLink],
                                                size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                                color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                                bold: x.isBold || false,
                                                italics: x.isItalic || false,
                                                underline: x.isUnderline || false
                                            })
                                        ]
                                    }),
                                ]:""
                            }));
                        }

                        return values.map((x) => new Paragraph({
                            alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: [
                                new TextRun({
                                    children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(
                                        x.textData, clientName, faulterName, accidentDate, claimAmount, annualClaimAmount,
                                        lifeExpectancyAge, age, perDayAmountForFutureNonEconomicDamages, monthsDifference,
                                        createdDate, clientProfession, hourlyIncomeRate, workHourMissed, gender,
                                        postNonEconomicsDamagesFinalAmount, perDayPasNonEconomicDamagesFinalAmount,
                                        pastNonEconomicDamages, liability, policeExhibitLink
                                    )],
                                    size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                    color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                    bold: x.isBold || false,
                                    italics: x.isItalic || false,
                                    underline: x.isUnderline || false
                                }),
                            ]
                        }))

                    } else {

                        // values[0]?.className ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).alignment :
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            indent: values[0]?.className?.includes('ql-indent-7') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                            children: [
                                ...(values.map((y) => new TextRun({
                                    children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName, faulterName, accidentDate, claimAmount, annualClaimAmount,
                                        lifeExpectancyAge, age, perDayAmountForFutureNonEconomicDamages, monthsDifference,
                                        createdDate, clientProfession, hourlyIncomeRate, workHourMissed, gender,
                                        postNonEconomicsDamagesFinalAmount, perDayPasNonEconomicDamagesFinalAmount,
                                        pastNonEconomicDamages, liability, policeExhibitLink)],
                                    size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                    color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                    bold: y.isBold || false,
                                    italics: y.isItalic || false,
                                    underline: y.isUnderline || false

                                }))),
                            ]
                        });
                    }
                }).flat();

                const nonEconomicDamageTitleArray = getParseHtmlToTextObjects(nonEconomicDamageTitleData)

                nonMedicalTitles = nonEconomicDamageTitleArray?.map((values, index) => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName.toUpperCase(),
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink, "", clientFullName.toUpperCase())],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    }),
                                ]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName.toUpperCase(),
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink, "", clientFullName.toUpperCase())],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const converter = (painData) => {
                    const data = painData.split('\n').map((data, index) => `<p class="ql-align-justify">&lt;/t&gt;${data}</p>`)
                    return [`<p class="ql-align-justify">[PainAndSuffringSection]</p>`, data]
                }

                let nonEconomicDamageDescriptionArray = getArrayOutofHtmlBlock(nonEconomicDamageDescriptionData)
                const isPainAndSuffringSectionIncluded = nonEconomicDamageDescriptionArray?.filter(x => x.includes('[PainAndSuffringSection]'))
                const modifiedNonEconomicDamageDescriptionArray = nonEconomicDamageDescriptionArray?.map((values, index) => {
                    if (values.includes("[PainAndSuffringSection]") && reportWithClientName.length) {
                        const structuredHTML = converter(reportWithClientName)
                        values = [...structuredHTML];
                    }
                    return values;
                });


                //console.log("modifiedNonEconomicDamageDescriptionArray is: ", modifiedNonEconomicDamageDescriptionArray)

                for (let i = 0; i < modifiedNonEconomicDamageDescriptionArray?.length; i++) {
                    const nonEconomicDamageDescriptionData = getParseHtmlBlock(modifiedNonEconomicDamageDescriptionArray[i])
                    nonEconomicDamageDescription.push(nonEconomicDamageDescriptionData)
                }

                //console.log("nonEconomicDamageDescription is: ", nonEconomicDamageDescription)

                nonMedicalDescriptions = nonEconomicDamageDescription.slice(isExhibitInlcuded ? 1:2).filter(x => x.length).map((values, index) => {
                    const painAndSufferingData = isPainAndSuffringSectionIncluded.length === 0 && reportWithClientName.length > 0 && index === 1 && painAndSufferingReportData ? painAndSufferingReportData : "";
                    if (values.length === 1 || values[0].textData.includes('[PainAndSuffringSection]')) {
                        if (values[0].textData.includes('[PainAndSuffringSection]') && reportWithClientName.length) {
                            values = values.slice(1).filter(x => x.className)
                        } else if (values[0].textData.includes('[PainAndSuffringSection]') && !reportWithClientName.length) {
                            return
                        }

                        if (selectedBodyInjuryFilesArr.length === 0 && values[0].textData.includes("[AccidentInjuryPhotosExhibit]")) {
                            return
                        }

                        return values.map((x) => {
                            //x.textData === ',' ? x.textData = '' : x.textData



                            if (selectedBodyInjuryFilesArr.length > 0 && x.textData.includes("[AccidentInjuryPhotosExhibit]")) {
                                return new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    indent: x?.className?.includes('ql-indent')
                                        ? getAlignmentAndIndentationName(x.className.split(' ')).indentName
                                            ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) }
                                            : ""
                                        : "",
                                    children: [
                                        new Bookmark({
                                            id: "Exhibit6Id",
                                            children: [
                                                new TextRun({
                                                    children: [x.textData.includes('</t>') ? new Tab() : "",
                                                    replaceVariablesWithValues(
                                                        x.textData.replace(".", ""), clientName, faulterName, accidentDate, claimAmount, annualClaimAmount,
                                                        lifeExpectancyAge, age, perDayAmountForFutureNonEconomicDamages, monthsDifference,
                                                        createdDate, clientProfession, hourlyIncomeRate, workHourMissed, gender,
                                                        postNonEconomicsDamagesFinalAmount, perDayPasNonEconomicDamagesFinalAmount,
                                                        pastNonEconomicDamages, liability, policeExhibitLink, painAndSufferingData
                                                    ),
                                                    x?.textData.includes("[AccidentInjuryPhotosExhibit]") && awsSelectedBodyInjuryFilesArr && isExhibitInlcuded
                                                        ? bodyInjuryExhibitLink
                                                        : "",
                                                    ...(painAndSufferingData || [])
                                                    ],
                                                    size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                                    color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                                    bold: x.isBold || false,
                                                    italics: x.isItalic || false,
                                                    underline: x.isUnderline || false
                                                })
                                            ]
                                        }),
                                    ]
                                });
                            }
                            return new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                indent: x?.className?.includes('ql-indent')
                                    ? getAlignmentAndIndentationName(x.className.split(' ')).indentName
                                        ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) }
                                        : ""
                                    : "",
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "",
                                        replaceVariablesWithValues(
                                            x.textData, clientName, faulterName, accidentDate, claimAmount, annualClaimAmount,
                                            lifeExpectancyAge, age, perDayAmountForFutureNonEconomicDamages, monthsDifference,
                                            createdDate, clientProfession, hourlyIncomeRate, workHourMissed, gender,
                                            postNonEconomicsDamagesFinalAmount, perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages, liability, policeExhibitLink, painAndSufferingData
                                        ),
                                        ...(painAndSufferingData || [])
                                        ],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    })
                                ]
                            });
                        });
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: values[0]?.textData.length ? 120 : 0 },
                            indent: values[0]?.className?.includes('ql-indent')
                                ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName
                                    ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) }
                                    : ""
                                : "",
                            children: [
                                ...(values.map((y) =>
                                    new TextRun({
                                        children: [y.textData.includes('</t>') ? new Tab() : "",
                                        replaceVariablesWithValues(
                                            y.textData, clientName, faulterName, accidentDate, claimAmount, annualClaimAmount,
                                            lifeExpectancyAge, age, perDayAmountForFutureNonEconomicDamages, monthsDifference,
                                            createdDate, clientProfession, hourlyIncomeRate, workHourMissed, gender,
                                            postNonEconomicsDamagesFinalAmount, perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages, liability, policeExhibitLink, painAndSufferingData
                                        ),
                                        y.textData.includes("[AccidentInjuryPhotosExhibit]") && awsSelectedBodyInjuryFilesArr  && isExhibitInlcuded
                                            ? bodyInjuryExhibitLink
                                            : "",
                                        ],
                                        size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                        color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                        bold: y.isBold || false,
                                        italics: y.isItalic || false,
                                        underline: y.isUnderline || false
                                    })))
                            ]
                        })
                    }
                }).flat();
                
                if(demandTemplate?.shouldShowSettlementTable){
                    const settlementDemandTitleArray = getParseHtmlToTextObjects(settlementDemandTitleData)

                    settlementTitles = settlementDemandTitleArray?.map((values, index) => {
                        if (values.length === 1) {
                            return values.map((x) =>
                                new Paragraph({
                                    alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                    numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({
                                            children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                                faulterName,
                                                accidentDate,
                                                claimAmount, annualClaimAmount,
                                                lifeExpectancyAge,
                                                age,
                                                perDayAmountForFutureNonEconomicDamages,
                                                monthsDifference,
                                                createdDate,
                                                clientProfession,
                                                hourlyIncomeRate,
                                                workHourMissed,
                                                gender,
                                                postNonEconomicsDamagesFinalAmount,
                                                perDayPasNonEconomicDamagesFinalAmount,
                                                pastNonEconomicDamages,
                                                liability,
                                                policeExhibitLink)],
                                            size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                            color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                            bold: x.isBold || false,
                                            italics: x.isItalic || false,
                                            underline: x.isUnderline || false
                                        }),
                                    ]
                                })
                            );
                        } else {
                            return new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                children: values.map((y) => new TextRun({
                                    children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                        faulterName,
                                        accidentDate,
                                        claimAmount, annualClaimAmount,
                                        lifeExpectancyAge,
                                        age,
                                        perDayAmountForFutureNonEconomicDamages,
                                        monthsDifference,
                                        createdDate,
                                        clientProfession,
                                        hourlyIncomeRate,
                                        workHourMissed,
                                        gender,
                                        postNonEconomicsDamagesFinalAmount,
                                        perDayPasNonEconomicDamagesFinalAmount,
                                        pastNonEconomicDamages,
                                        liability,
                                        policeExhibitLink)],
                                    size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                    color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                    bold: y.isBold || false,
                                    italics: y.isItalic || false,
                                    underline: y.isUnderline || false
                                }))
                            });
                        }
                    }).flat();

                    const settlementDemandDescription = getParseHtmlToTextObjects(settlementDemandDescriptionData)

                    settlementDescriptions = settlementDemandDescription.filter(x => x.length).map((values, index) => {
                        if (values.length === 1) {
                            return values.map((x) =>
                                new Paragraph({
                                    alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    indent: x[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                    children: [
                                        new TextRun({
                                            children: [x.textData?.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                                faulterName,
                                                accidentDate,
                                                claimAmount, annualClaimAmount,
                                                lifeExpectancyAge,
                                                age,
                                                perDayAmountForFutureNonEconomicDamages,
                                                monthsDifference,
                                                createdDate,
                                                clientProfession,
                                                hourlyIncomeRate,
                                                workHourMissed,
                                                gender,
                                                postNonEconomicsDamagesFinalAmount,
                                                perDayPasNonEconomicDamagesFinalAmount,
                                                pastNonEconomicDamages,
                                                liability,
                                                policeExhibitLink)],
                                            size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                            color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                            bold: x.isBold || false,
                                            italics: x.isItalic || false,
                                            underline: x.isUnderline || false
                                        })]
                                })
                            );
                        } else {
                            // values[0]?.className ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).alignment :
                            return new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [
                                    ...(values.map((y) => new TextRun({
                                        children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink)],
                                        size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                        color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                        bold: y.isBold || false,
                                        italics: y.isItalic || false,
                                        underline: y.isUnderline || false
                                    })))
                                ]
                            });
                        }
                    }).flat();
                }
                const badFaithExposerTitleArray = getParseHtmlToTextObjects(badFaithExposerTitleData)

                badFaithExposerTitles = badFaithExposerTitleArray?.map((values, index) => {
                    if (demand.value === DEMAND_TYPE.UIM_N_PLD.value || demand.value === DEMAND_TYPE.TP_N_PLD.value || demand.value === DEMAND_TYPE.UIM_PLD.value) {
                        return
                    }
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink)],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    }),
                                ]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink)],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                const badFaithExposerDescription = getParseHtmlToTextObjects(badFaithExposerDescriptionData)

                badFaithExposerDescriptions = badFaithExposerDescription.filter(x => x.length).map((values, index) => {
                    if (demand.value === DEMAND_TYPE.UIM_N_PLD.value || demand.value === DEMAND_TYPE.TP_N_PLD.value || demand.value === DEMAND_TYPE.UIM_PLD.value) {
                        return
                    }
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x[0]?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                indent: x[0]?.className.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink)],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    })]
                            })
                        );
                    } else {
                        // values[0]?.className ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).alignment :
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            numbering: values[0].listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                            indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                            children: [
                                ...(values.map((y) => new TextRun({
                                    children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                        faulterName,
                                        accidentDate,
                                        claimAmount, annualClaimAmount,
                                        lifeExpectancyAge,
                                        age,
                                        perDayAmountForFutureNonEconomicDamages,
                                        monthsDifference,
                                        createdDate,
                                        clientProfession,
                                        hourlyIncomeRate,
                                        workHourMissed,
                                        gender,
                                        postNonEconomicsDamagesFinalAmount,
                                        perDayPasNonEconomicDamagesFinalAmount,
                                        pastNonEconomicDamages,
                                        liability,
                                        policeExhibitLink)],
                                    size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                    color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                    bold: y.isBold || false,
                                    italics: y.isItalic || false,
                                    underline: y.isUnderline || false

                                }))),
                            ]
                        });
                    }
                }).flat();

                const termOfSettlementTitleArray = getParseHtmlToTextObjects(termOfSettlementTitleData)

                termOfSettlementTitles = termOfSettlementTitleArray?.map((values, index) => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink)],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    }),
                                ]
                            })
                        );
                    } else {
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: values.map((y) => new TextRun({
                                children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                    faulterName,
                                    accidentDate,
                                    claimAmount, annualClaimAmount,
                                    lifeExpectancyAge,
                                    age,
                                    perDayAmountForFutureNonEconomicDamages,
                                    monthsDifference,
                                    createdDate,
                                    clientProfession,
                                    hourlyIncomeRate,
                                    workHourMissed,
                                    gender,
                                    postNonEconomicsDamagesFinalAmount,
                                    perDayPasNonEconomicDamagesFinalAmount,
                                    pastNonEconomicDamages,
                                    liability,
                                    policeExhibitLink)],
                                size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                bold: y.isBold || false,
                                italics: y.isItalic || false,
                                underline: y.isUnderline || false
                            }))
                        });
                    }
                }).flat();

                // const termOfSettlementDescription = 
                const termOfSettlementDescription = getParseHtmlToTextObjects(termOfSettlementDescriptionData)

                termOfSettlementDescriptions = termOfSettlementDescription.filter(x => x.length).map((values, index) => {
                    if (values.length === 1) {
                        return values.map((x) =>
                            new Paragraph({
                                alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                numbering: x[0]?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                spacing: { after: 120 },
                                indent: x[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                children: [
                                    new TextRun({
                                        children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                            faulterName,
                                            accidentDate,
                                            claimAmount, annualClaimAmount,
                                            lifeExpectancyAge,
                                            age,
                                            perDayAmountForFutureNonEconomicDamages,
                                            monthsDifference,
                                            createdDate,
                                            clientProfession,
                                            hourlyIncomeRate,
                                            workHourMissed,
                                            gender,
                                            postNonEconomicsDamagesFinalAmount,
                                            perDayPasNonEconomicDamagesFinalAmount,
                                            pastNonEconomicDamages,
                                            liability,
                                            policeExhibitLink)],
                                        size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                        color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                        bold: x.isBold || false,
                                        italics: x.isItalic || false,
                                        underline: x.isUnderline || false
                                    })
                                ]
                            })
                        );
                    } else {
                        if (values[0]?.listType === "OL") {
                            return values.map((x) =>
                                new Paragraph({
                                    alignment: x.className ? getAlignmentName(x.className) : AlignmentType.JUSTIFIED,
                                    numbering: x?.listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                                    spacing: { after: 120 },
                                    indent: x[0]?.className.includes('ql-indent') ? getAlignmentAndIndentationName(x[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                                    children: [
                                        new TextRun({
                                            children: [x.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData, clientName,
                                                faulterName,
                                                accidentDate,
                                                claimAmount, annualClaimAmount,
                                                lifeExpectancyAge,
                                                age,
                                                perDayAmountForFutureNonEconomicDamages,
                                                monthsDifference,
                                                createdDate,
                                                clientProfession,
                                                hourlyIncomeRate,
                                                workHourMissed,
                                                gender,
                                                postNonEconomicsDamagesFinalAmount,
                                                perDayPasNonEconomicDamagesFinalAmount,
                                                pastNonEconomicDamages,
                                                liability,
                                                policeExhibitLink)],
                                            size: x?.style.includes('font-size') ? getFontSize(x.style, 24) : 24,
                                            color: x?.style.includes('color') ? getFontColor(x?.style) : "",
                                            bold: x.isBold || false,
                                            italics: x.isItalic || false,
                                            underline: x.isUnderline || false
                                        })
                                    ]
                                })
                            );
                        }
                        
                        // values[0]?.className ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).alignment :
                        return new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            numbering: values[0].listType === "OL" ? { reference: "my-unique-bullet-points", level: 0 } : undefined,
                            indent: values[0]?.className?.includes('ql-indent') ? getAlignmentAndIndentationName(values[0]?.className.split(' ')).indentName ? { right: convertInchesToTwip(1), left: convertInchesToTwip(1) } : "" : "",
                            children: [
                                ...(values.map((y) => new TextRun({
                                    children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData, clientName,
                                        faulterName,
                                        accidentDate,
                                        claimAmount, annualClaimAmount,
                                        lifeExpectancyAge,
                                        age,
                                        perDayAmountForFutureNonEconomicDamages,
                                        monthsDifference,
                                        createdDate,
                                        clientProfession,
                                        hourlyIncomeRate,
                                        workHourMissed,
                                        gender,
                                        postNonEconomicsDamagesFinalAmount,
                                        perDayPasNonEconomicDamagesFinalAmount,
                                        pastNonEconomicDamages,
                                        liability,
                                        policeExhibitLink)],
                                    size: y?.style.includes('font-size') ? getFontSize(y.style, 24) : 24,
                                    color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                                    bold: y.isBold || false,
                                    italics: y.isItalic || false,
                                    underline: y.isUnderline || false

                                })))
                            ]
                        });
                    }
                }).flat();

                // firmName
                const firmNameData = getParseHtmlBlock(firmName)
                firmNameTitle = firmNameData?.map((value) =>
                    new Paragraph({
                        spacing: { before: value.listType ? 10 : 120, after: value.listType ? 10 : 120 },
                        indent: { left: convertInchesToTwip(2.56) },
                        children: [
                            new TextRun({
                                children: [value.textData],
                                size: value?.style.includes('font-size') ? getFontSize(value.style, 24) : 24,
                                color: value?.style.includes('color') ? getFontColor(value?.style) : "",
                                bold: true,
                                italics: value.isItalic ? true : false,
                                underline: value.isUnderline ? true : false
                            }),
                        ]
                    }
                    ))
            }

            await getFormattedStockLanguage(
                '',
                settingTemplate?.attorneyName,
                settingTemplate?.attorneyEmail,
                settingTemplate?.firmAddress,
                demandTemplate?.introduction,
                demandTemplate?.liabilityTitle,
                demandTemplate?.liabilityDescription,
                demandTemplate?.introductionTitle,
                demandTemplate?.introductionDescription,
                demandTemplate?.priorMedicalRecordTitle,
                demandTemplate?.priorMedicalRecordDescription,
                demandTemplate?.nonEconomicDamageTitle,
                demandTemplate?.nonEconomicDamageDescription,
                demandTemplate?.settlementDemandTitle,
                demandTemplate?.settlementDemandDescription,
                demandTemplate?.badFaithExposerTitle,
                demandTemplate?.badFaithExposerDescription,
                demandTemplate?.termOfSettlementTitle,
                demandTemplate?.termOfSettlementDescription,
                demandTemplate?.lossOfIncomeTitle,
                demandTemplate?.lossOfIncomeDescription,
                settingTemplate?.firmName
            )

            processedExecutiveSummary = [processedExecutiveSummary].join('').split('\n')
            let processedExecutiveSummaryText = processedExecutiveSummary.filter(x => x.length).map((value, index) => {
                return new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    indent: (demand.value !== DEMAND_TYPE.Simplified_TP_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UIM_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UM_PLD.value) ? {
                        left: convertInchesToTwip(0.1),
                        right: convertInchesToTwip(0.1)
                    } : undefined,
                    children: [
                        new TextRun({
                            children: [new Tab(), value],
                            size: 24,
                        }),
                    ]
                })
            })

            let HeaderData = ""
            //console.log("attorneyNames: ", attorneyNames)
            //console.log("attorneyEmails: ", attorneyEmails)
            if (attorneyNames?.length > 0 && attorneyEmails?.length > 0) {
                //we have attorney names or emails
                HeaderData = new Table({
                    // alignment: AlignmentType.CENTER,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: {
                                        size: 33,
                                        type: WidthType.PERCENTAGE,
                                    },
                                    children: [...(attorneyNames || [])],
                                    borders: {
                                        top: { color: "ffffff", style: BorderStyle.SINGLE },
                                        bottom: { color: "ffffff", style: BorderStyle.SINGLE },
                                        left: { color: "ffffff", style: BorderStyle.SINGLE },
                                        right: { color: "ffffff", style: BorderStyle.SINGLE },
                                    }
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            width: {
                                                size: 33,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [
                                                ...(companyLogo ? [new ImageRun({
                                                    data: companyLogo,
                                                    transformation: { width: 250, height: 75 },
                                                })] : [
                                                    new TextRun({
                                                        children: [""],
                                                        size: 15,
                                                    })
                                                ]),
                                                new Paragraph({
                                                    alignment: AlignmentType.CENTER,
                                                    children: [new TextRun({
                                                        children: [""],
                                                        size: 15,
                                                    }),]
                                                }),
                                                ...(firmAddresss || [])
                                            ],
                                        }),
                                    ],
                                    borders: {
                                        // White borders for the cell
                                        top: { color: "ffffff", style: BorderStyle.SINGLE },
                                        bottom: { color: "ffffff", style: BorderStyle.SINGLE },
                                        left: { color: "ffffff", style: BorderStyle.SINGLE },
                                        right: { color: "ffffff", style: BorderStyle.SINGLE },
                                    },
                                }),
                                new TableCell({
                                    width: {
                                        size: 33,
                                        type: WidthType.PERCENTAGE,
                                    },
                                    children: [new Tab(), ...(attorneyEmails || [])],//attornyMailText,
                                    borders: {
                                        // White borders for the cell
                                        top: { color: "ffffff", style: BorderStyle.SINGLE },
                                        bottom: { color: "ffffff", style: BorderStyle.SINGLE },
                                        left: { color: "ffffff", style: BorderStyle.SINGLE },
                                        right: { color: "ffffff", style: BorderStyle.SINGLE },
                                    },
                                }),
                            ],
                        }),
                    ],

                });
            } else {
                HeaderData = new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        ...(companyLogo ? [new ImageRun({
                            data: companyLogo,
                            transformation: { width: 600, height: 100 },
                        })] : [new TextRun({
                            children: [""],
                            size: 15,
                        })]),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({
                                children: [""],
                                size: 15
                            })]
                        }),
                        ...(firmAddresss || [])
                    ]
                })
            }


            const medicalSpecial = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 4200,
                                    type: WidthType.DXA,
                                },

                                children: [
                                    new Paragraph({ children: [new TextRun({ text: "Provider Name", size: 24, font: fontName, bold: true })] }),
                                ],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Top border
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Left border
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Right border
                                },
                            }),
                            new TableCell({
                                columnSpan: 2,
                                width: {
                                    size: 1735,
                                    type: WidthType.DXA,
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT, children: [
                                            new TextRun({ text: `${billedAmountHeading ? "Billed" : "Howell"}`, size: 24, font: fontName, bold: true, italics: billedAmountHeading ? false : true }),
                                            new TextRun({ text: " Amount", size: 24, font: fontName, bold: true })
                                        ]
                                    }),
                                ],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: ``, size: 24, font: fontName, bold: true })] }),
                                ],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                },
                            }),
                        ],
                    }),
                ],
                alignment: AlignmentType.CENTER
            })
        

            const dynamicMedicalSpecialData = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 5900,
                                    type: WidthType.DXA,
                                },
                                children: [...(providerName1 || [])],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" },
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "000000" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" },
                                },
                            }),
                            new TableCell({
                                width: {
                                    size: 900,
                                    type: WidthType.DXA,
                                },
                                children: [...(dollarSign || [])],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "000000" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                                },
                            }),
                            new TableCell({
                                width: {
                                    size: 800,
                                    type: WidthType.DXA,
                                },
                                children: [...(totalAmount || [])],
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                                    bottom: { style: BorderStyle.SINGLE, size: 3, color: "000000" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                                },
                            })
                        ],
                    }),
                ],
                alignment: AlignmentType.CENTER // Ensure the table is centered
            });

            ////////////////////////////////////////////////////////////////////////////////// Ends /////////////////////////////////////////////////////////////////////////////////////////////////
            const llmLibilityDescriptionText = replaceVariablesWithValues(liability)
            const llmLibilityDescriptionDoc = liability ? [
                new Paragraph({
                    spacing: {
                        after: 120,
                        before: 120,
                    },
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({
                            children: [new Tab(), replaceVariablesWithValues(liability)],
                            size: 24,
                        })
                    ]
                })
            ] : []

            const propertyDamageHyperlinkSentenceDoc = [new Paragraph({
                children: [
                    new Bookmark({
                        id: 'Exhibit5Id',
                        children: [new TextRun('Copies of the property damage photographs are attached as '), accidenPhotoExhibitLink]
                    })
                ]
            })]

            const policeReportLinkSentenceDoc = policeReportExhibit?.length ? [new Paragraph({
                children: [
                    new Bookmark({
                        id: 'Exhibit1Id',
                        children: [new TextRun('A copy of the Traffic Collision report is attached as '), policeExhibitLink]
                    })
                ]
            })] : []

            const preMedicalRecordLinkSentenceDoc = preMedicalRecordsExhibitData?.length ? [new Paragraph({
                children: [
                    new Bookmark({
                        id: 'Exhibit2Id',
                        children: [new TextRun('Copies of prior medical records are attached as '), preMedicalExhibitLink]
                    })
                ]
            })] : []

            const bodilyInjuryPhotosHyperlinkSentenceDoc = isExhibitInlcuded ? [new Paragraph({
                children: [
                    new Bookmark({
                        id: 'Exhibit6Id',
                        children: [
                            new TextRun('The bodily injury photographs are inserted above and attached as '),
                            bodyInjuryExhibitLink
                        ]
                    })
                ]
            })] : [];

            const policeReportExhibitSectionDoc = policeReportExhibit?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "policeExhibitId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        }),
                                    ],
                                    anchor: "Exhibit1Id",
                                })]
                        }),
                        new PageBreak()
                    ],
                }),
                ...policeReportExhibit
            ] : []

            const acciedentFileExhibitSectionDoc = accidentFilesArr.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "accidentPhotosExhibitId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "Exhibit5Id",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...accidentFilesArr
            ] : []

            const preMedicalRecordExhibitSectionDoc = preMedicalRecordsExhibitData?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "preMedicalRecordsExhibitId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "preMedicalRecordsExhibitAnchor",
                                })
                            ]
                        })
                        , new PageBreak()],
                }),
                ...preMedicalRecordsExhibitData
            ] : []

            const medicalRecordExhibitSectionDoc = medicalRecordsExhibitData?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "medicalRecordExhibitId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })
                                    ], anchor: "Exhibit3Id"
                                })
                            ]

                        })
                        , new PageBreak()],
                }),
                ...medicalRecordsExhibitData
            ] : []

            const bodilyInjuryExhibitSectionDoc = bodyInjuryFilesArr.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "bodyInjuryExhibitLinkId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "Exhibit6Id",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(bodyInjuryFilesArr.length ? bodyInjuryFilesArr : "" || []),
            ] : []

            const expertReportExhibitSectionDoc = expertReportExhibitDirectorys3Path?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "expertReportExhibitDirectorys3PathID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "expertReportExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(expertReportExhibitDirectorys3Path?.length ? await getExhibitArr(expertReportExhibitDirectorys3Path) : []),
            ] : [];

            const lossOfIncomeExhibitSectionDoc = lossOfEarningsExhibitPaths?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "lossOfIncomeExhibitId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "lossOfEarningsExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(lossOfEarningsExhibitPaths?.length ? await getExhibitArr(lossOfEarningsExhibitPaths) : []),
            ] : []

            const medicalExpensesExhibitSectionDoc = medicalExpensesExhibitPaths?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "medicalExpensesExhibitPathsId",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "medicalExpensesExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(medicalExpensesExhibitPaths?.length ? await getExhibitArr(medicalExpensesExhibitPaths) : []),
            ] : []


            const incidentReportExhibitSectionDoc = incidentReportExhibitS3Path?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "incidentReportExhibitS3PathID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "incidentReportExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(incidentReportExhibitS3Path?.length ? await getExhibitArr(incidentReportExhibitS3Path) : []),
            ] : []

            const witnessReportExhibitSectionDoc = witnessReportExhibitS3Path?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "witnessReportExhibitS3PathID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "witnessReportExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(witnessReportExhibitS3Path?.length ? await getExhibitArr(witnessReportExhibitS3Path) : []),
            ] : []

            const selectedIncidentImageExhibitSectionDoc = selectedIncidentImageExhibitArr?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "selectedIncidentImageExhibitArrID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "selectedIncidentImageExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(selectedIncidentImageExhibitArr?.length > 0 ? selectedIncidentImageExhibitArr : []),
            ] : []

            const incidentImageExhibitSectionDoc = incidentImageExhibitArr?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "incidentImageExhibitArrID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "incidentImageExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(incidentImageExhibitArr?.length > 0 ? incidentImageExhibitArr : []),
            ] : []

            const selectedProductExhibitSectionDoc = selectedProductExhibitArr?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "selectedProductExhibitArrID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "selectedProductExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(selectedProductExhibitArr?.length > 0 ? selectedProductExhibitArr : []),
            ] : []

            const productExhibitSectionDoc = productExhibitImageArr?.length ? [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new Bookmark({
                            id: "productExhibitImageArrID",
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            children: [`EXHIBIT ${bookmarkCounter = bookmarkCounter + 1}`],
                                            size: 104,
                                            bold: true,
                                            style: "Hyperlink"
                                        })],
                                    anchor: "productExhibit",
                                })]
                        }),
                        , new PageBreak()],
                }),
                ...(productExhibitImageArr?.length > 0 ? productExhibitImageArr : []),
            ] : []

            const bodilyInjuryPhotosAndHyperlinks = selectedBodyInjuryFilesArr?.length ? [
                ...selectedBodyInjuryFilesArr,
                ...bodilyInjuryPhotosHyperlinkSentenceDoc,
            ] : []

            const medicalSpecialTableDoc = [medicalSpecial, dynamicMedicalSpecialData, medicalSpecialTotal]

            const settlementDemandTableDoc = [
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: {
                                        size: 4000,
                                        type: WidthType.DXA,
                                    },

                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.LEFT,
                                            children: [
                                                new TextRun({
                                                    children: [`a) Medical Expenses`],
                                                    size: 24,

                                                }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.LEFT,
                                            children: [new TextRun({
                                                children: [`b) Future Medical Expenses`],
                                                size: 24,

                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.LEFT,
                                            children: [new TextRun({
                                                children: [`c) Past Non-Economic Damages`],
                                                size: 24,

                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.LEFT,
                                            children: [
                                                new TextRun({
                                                    children: [`d) Future Non-Economic Damages`],
                                                    size: 24,
                                                }),]
                                        })
                                    ],
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Top border
                                        bottom: { style: BorderStyle.SINGLE, size: 3, color: "000000" }, // Bottom border
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Right border
                                    },
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [`$`],
                                                size: 24,
                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [``],
                                                size: 24,

                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [``],
                                                size: 24,

                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [``],
                                                size: 24,
                                            }),]
                                        })
                                    ],
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                        bottom: { style: BorderStyle.SINGLE, size: 3, color: "000000" }, // Bottom border
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                    },
                                }),
                                new TableCell({
                                    width: {
                                        size: 1000,
                                        type: WidthType.DXA,
                                    },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [`${amount === 'NaN' ? 0 : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                                                size: 24,
                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [``],
                                                size: 24,

                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [pastNonEconomicDamages],
                                                size: 24,

                                            }),]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({
                                                children: [postNonEconomicsDamagesFinalAmount],
                                                size: 24,
                                            }),]
                                        })
                                    ],
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                        bottom: { style: BorderStyle.SINGLE, size: 3, color: "000000" }, // Bottom border
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                    },
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: {
                                        size: 1035,
                                        type: WidthType.DXA,
                                    },
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: "TOTAL", size: 24, font: fontName, bold: 'true' })]
                                        })
                                    ],
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Top border
                                        bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Right border
                                    },
                                }),
                                new TableCell({
                                    width: {
                                        size: 2535,
                                        type: WidthType.DXA,
                                    },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({ children: [`$`], size: 24, bold: true })]
                                        })
                                    ],
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Top border
                                        bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "ffffff" }, // Right border
                                    },
                                }),
                                new TableCell({
                                    width: {
                                        size: 300,
                                        type: WidthType.DXA,
                                    },
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${totalSettlementAmount(amount, postNonEconomicsDamagesFinalAmount, pastNonEconomicDamages)}`, size: 24, font: fontName, bold: 'true' })] }),
                                    ],

                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Top border
                                        bottom: { style: BorderStyle.SINGLE, size: 3, color: "ffffff" }, // Bottom border
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, // Right border
                                    },
                                }),
                            ],
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                })
            ]

            //////////////////////////////////////////////////////////////////////Template Generattion Code Starts from here ////////////////////////////////////////////////////////////////       
            //console.log("Demand.value before medical records paragraph is: ", demand.value)

            const s3FilePath = `${domainName}/${userId}/${caseData?.s3UniqueId}/generatedCase/${DEMAND_TYPE[demand.value].alias}-${name.trim()}.docx`;


            if (demandTemplate?.templateFile) {
                try {
                    const templateFile = await getFileToS3(demandTemplate.templateFile);
                    const modifiedTemplateDocument = await createAndSaveTemplateReportWord(
                        templateFile,
                        {
                            accidentDate,
                            createdDate,
                            clientName,
                            clientFullName,
                            faulterName,
                            medicalRecordsDetailsDoc: medicalRecordsParagraphs,
                            priorMedicalRecordsDetailsDoc: preMedicalRecordsParagraphs,
                            executiveSummaryDoc: processedExecutiveSummary,
                            llmLibilityDescriptionDoc: llmLibilityDescriptionText,
                            selectedAccidentFilesDoc: selectedAccidentFiles,
                            accidenPhotoExhibitLinkDoc: accidenPhotoExhibitLink,
                            propertyDamageHyperlinkSentenceDoc: accidentPhotoHyperlinkNumber,
                            policeReportExhibitSectionDoc,
                            medicalRecordExhibitSectionDoc,
                            preMedicalRecordExhibitSectionDoc,
                            acciedentFileExhibitSectionDoc,
                            bodyInjryPhotoHyperlinkNumber,
                            selectedBodyInjuryFilesArr,
                            llmPainAndSufferingDoc: painAndSufferingReportText,
                            monthsDifference: month,
                            pastMonthlyPainAmount: `$` + claimAmount,
                            pastNonEconomicDamages,
                            lifeExpectancyAge,
                            FutureYearlyPainAmount: `$` + annualClaimAmount,
                            perDayAmountForFutureNonEconomicDamages,
                            postNonEconomicsDamagesFinalAmount,
                            age,
                            HourlyWorkingRate: workHourMissed,
                            his_her,
                            he_she,
                            him_her,
                            lossofIncomeCalculatedAmount,
                            MissedWorkHours: hourlyIncomeRate,
                            perDayPasNonEconomicDamagesFinalAmount: `$` + perDayPasNonEconomicDamagesFinalAmount,
                            medicalSpecialTableDoc,
                            settlementDemandTableDoc,
                            clientProfession,
                            bodilyInjuryExhibitSectionDoc,
                            policeReportLinkSentenceDoc,
                            preMedicalRecordLinkSentenceDoc,
                            defAdjusterName: userCaseInfo?.defendantAdjusterName,
                            defInsuranceName: userCaseInfo?.defendantInsuranceName,
                            defAdjusterAddress: userCaseInfo?.defendantAdjusterAddress,
                            defAdjusterCity: userCaseInfo?.defendantCity,
                            defAdjusterState: userCaseInfo?.defendantState,
                            defAdjusterZip: userCaseInfo?.defendantZip,
                            clientAdjusterName: userCaseInfo?.clientAdjusterName,
                            clientInsuranceName: userCaseInfo?.clientInsuranceName,
                            clientAdjusterAddress: userCaseInfo?.clientAdjusterAddress,
                            clientAdjusterCity: userCaseInfo?.clientCity,
                            clientAdjusterState: userCaseInfo?.clientState,
                            clientAdjusetrZip: userCaseInfo?.clientZip,
                            defClaimNumber: userCaseInfo?.defendantClaimNumber,
                            clientClaimNumber: userCaseInfo?.clientClaimNumber,
                            defInsuranceLastName: userData?.painAndSuffering?.gender === "Male"  ? `Mr. ${userData?.caseInfo?.defendantAdjusterName?.trim().split(" ").at(-1)}` : `Ms. ${userData?.caseInfo?.defendantAdjusterName?.trim().split(" ").at(-1)}`,
                            billedAmountHeading,
                            aggregatedMedicalBills,
                            amount,
                            fontName,
                            casePreMedicalRecordsParagraphs,
                            caseMedicalRecordsParagraphs,
                            policeReportHyperlinkNumber,
                            preMedicalHyperlinkNumber,
                            medicalHyperlinkNumber,
                            lossOfIncomeExhibitSectionDoc,
                            lossOfEarningsHyperlinkNumber,
                            futureExpenseHyperlinkNumber,
                            futureExpenseExhibitSectionDoc: medicalExpensesExhibitSectionDoc
                        }
                    );

                    const params = {
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: s3FilePath,
                        Body: modifiedTemplateDocument
                    };
                    await s3Client.putObject(params).promise();

                } catch (e) {
                    console.error(`Error processing template with file path`, e);
                }
            } else{
            const document = new Document({
                styles: {
                    default: {
                        document: {
                            run: {
                                font: fontName
                            }
                        }
                    }
                },

                numbering: {
                    config: [
                        {
                            reference: "my-crazy-numbering",
                            levels: [
                                {
                                    level: 0,
                                    format: LevelFormat.UPPER_ROMAN,
                                    text: "%1",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.15) },
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: LevelFormat.DECIMAL,
                                    text: "%2.",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.20) }
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: LevelFormat.LOWER_LETTER,
                                    text: "%3)",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(1.18) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: LevelFormat.UPPER_LETTER,
                                    text: "%4)",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            reference: "my-crazy-numbering1",
                            levels: [
                                {
                                    level: 0,
                                    format: LevelFormat.UPPER_ROMAN,
                                    text: "%1",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: LevelFormat.DECIMAL,
                                    text: "(%2).",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.65), hanging: convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: LevelFormat.LOWER_LETTER,
                                    text: "%3)",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(1.18) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: LevelFormat.UPPER_LETTER,
                                    text: "%4)",
                                    alignment: AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
                                        },

                                    },
                                },
                            ],
                        },
                        {
                            reference: "my-unique-bullet-points",
                            levels: [
                                {
                                    level: 0,
                                    format: LevelFormat.UPPER_LETTER,
                                    text: "\u2022",
                                    alignment: AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.20) },
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: LevelFormat.UPPER_LETTER,
                                    text: "\u00A5",
                                    alignment: AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: LevelFormat.BULLET,
                                    text: "\u273F",
                                    alignment: AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 2160, hanging: convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: LevelFormat.BULLET,
                                    text: "\u267A",
                                    alignment: AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 2880, hanging: convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 4,
                                    format: LevelFormat.BULLET,
                                    text: "\u2603",
                                    alignment: AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 3600, hanging: convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                sections: [
                    {
                        properties: {
                            page: {
                                size: {
                                    orientation: PageOrientation.PORTRAIT,
                                },
                                pageNumbers: {
                                    start: 1,
                                    formatType: NumberFormat.DECIMAL
                                }
                            },
                        },
                        children: [
                            HeaderData,
                            ...(checkcompanyLogo ? [new Paragraph({
                                spacing: { after: 120 },
                                indent: { left: 120, hanging: convertInchesToTwip(0.25) },
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [`${createdDate}`],
                                        size: 24,
                                    }),
                                ]
                            })] : []),
                            ...(introductions || []),
                            ...(introductionDescriptions || []),

                        ],
                        footers: {
                            default: new Footer({
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                children: [PageNumber.CURRENT],
                                            })
                                        ]
                                    })
                                ]
                            })
                        }
                    },
                    {
                        children: [
                            ...((demand.value !== DEMAND_TYPE.Simplified_TP_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UIM_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UM_PLD.value) ? [new Table({
                                alignment: AlignmentType.LEFT,
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                width: {
                                                    size: 9000,
                                                    type: WidthType.DXA,

                                                },
                                                borders: {
                                                    top: { style: BorderStyle.THICK, size: 25, color: "001C66" }, // Top border
                                                    bottom: { style: BorderStyle.THICK, size: 25, color: "001C66" }, // Bottom border
                                                    left: { style: BorderStyle.THICK, size: 25, color: "001C66" }, // Left border
                                                    right: { style: BorderStyle.THICK, size: 25, color: "001C66" }, // Right border
                                                },
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.CENTER,
                                                        spacing: {
                                                            before: 120,
                                                            after: 120
                                                        },
                                                        children: [
                                                            new TextRun({
                                                                children: [`${clientFullName.toLocaleUpperCase()}’S KEY MEDICAL TREATMENT`],
                                                                size: 24,
                                                                bold: true,
                                                                underline: true,
                                                            }),]
                                                    }),
                                                    ...(processedExecutiveSummaryText || [])

                                                ]
                                            }),
                                        ]
                                    })
                                ]
                            })] : []),

                            ...(factIncidentTitle ? getDOCXTitle(factIncidentTitle) : []),
                            ...(factIncidentDescription ? getDOCXDescription(factIncidentDescription, "factIncidentDescription") : []),

                            ...(liabilityTitle ? getDOCXTitle(liabilityTitle, "Exhibit1Id") : []),
                            ...(isLiabilityDefaultPosition ? llmLibilityDescriptionDoc : []),
                            ...(!isExhibitInlcuded && !isLiabilityDefaultPosition ? llmLibilityDescriptionDoc : []),

                            ...(liabilityDescription ? getDOCXDescription(liabilityDescription, "Exhibit5Id") : []),

                            ...(selectedAccidentFiles || []),
                            //////////Lability section ends here
                            ...(casePreMedicalRecordsParagraphs?.length > 0 &&  (demand.value !== DEMAND_TYPE.Simplified_TP_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UIM_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UM_PLD.value)) ? [
                                ...(priorMedicalRecordTitles || []),
                                ...(preMedicalRecordsParagraphs || []),
                                ...(priorMedicalRecordDescriptions || []),
                            ] : [],


                            new Paragraph({
                                spacing: { after: 120 },
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [],
                                        size: 24,
                                    }),
                                ]
                            }),
                            ...(caseMedicalRecordsParagraphs?.length > 0 ? [new Paragraph({
                                spacing: { after: 120 },
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [`${clientFullName.toLocaleUpperCase()}’S MEDICAL TREATMENT`],
                                        size: 24,
                                        bold: true,
                                        underline: true

                                    }),
                                ]
                            })] : []),
                            ...[
                                ...medicalRecordsParagraphs,
                                (caseMedicalRecordsParagraphs?.length > 0 &&
                                    new Paragraph({
                                        spacing: {
                                            after: 120
                                        },
                                        alignment: AlignmentType.LEFT,
                                        children: isExhibitInlcuded ? [
                                            new Bookmark({
                                                id: "Exhibit3Id",
                                                children: [
                                                    new TextRun({
                                                        children: [`Copies of ${clientFullName}'s records are attached as `],
                                                        size: 24,
                                                    }),
                                                    medicalRecords?.length ? medicalRecordExhibitLink : new TextRun({
                                                        children: ["Exhibit."],
                                                        size: 24
                                                    })
                                                ]
                                            })] : ""
                                    })
                                )
                            ],
                            ...(nonMedicalTitles || []),

                            new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        children: nonEconomicDamageDescription.flat()[0]?.textData,
                                        size: 24,
                                        italics: true,
                                        bold: true
                                    })
                                ]
                            }),
                            ...(selectedBodyInjuryFilesArr || []),
                            ...(nonMedicalDescriptions || []),
                        ]
                    },
                    {
                        properties: {
                            page: {
                                size: {
                                    orientation: PageOrientation.PORTRAIT,
                                },
                            },
                        },
                        children: [
                            new Paragraph({
                                spacing: {
                                    after: 120,
                                },
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [`${clientFullName.toLocaleUpperCase()}'S MEDICAL SPECIALS`],
                                        size: 24,
                                        bold: true,
                                        underline: true
                                    }),
                                ]

                            }),
                            ...(medicalSpecialTableDoc),
                            new Paragraph({
                                children: ['']
                            }),
                            ...(userData.damage?.WorkHoursMissed && userData.damage?.typeofWork && userData.damage?.hourlyIncomeRate ? [
                                ...(lossOfincomeTitle ? getDOCXTitle(lossOfincomeTitle) : []),
                                ...(lossOfIncomeDescription ? getDOCXDescription(lossOfIncomeDescription) : []),
                                new Paragraph({
                                    spacing: {
                                        after: 120
                                    },
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                                new TextRun({
                                                    children: [``],
                                                    size: 24,
                                                }),
                                            ]
                                        }),
                                
                                (lossOfEarningsExhibitPaths?.length > 0 &&
                                    new Paragraph({
                                        spacing: {
                                            after: 120
                                        },
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new Bookmark({
                                                id: "lossOfEarningsExhibit",
                                                children: isExhibitInlcuded ?  [
                                                    new TextRun({
                                                        children: [`Copies of the relevant loss of earnings statements are attached as `],
                                                        size: 24,
                                                    }),
                                                    lossOfIncomeExhibitLink
                                                ] : ""
                                            })] 
                                    })
                                )
                            ]
                                : []),

                            ...((demand.value !== DEMAND_TYPE.Simplified_TP_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UIM_PLD.value && demand.value !== DEMAND_TYPE.Simplified_UM_PLD.value && demandTemplate?.shouldShowSettlementTable) ? [ //should change back to demandTemplate?.shouldShowSettlementTable once this is re-implemented in the template builder
                                ...(settlementTitles || []),
                                new Paragraph({
                                    spacing: {
                                        after: 120
                                    },
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                        new TextRun({
                                            children: [`The total damages our client will be claiming at ${(demand.value === DEMAND_TYPE.UIM_PLD.value || demand.value === DEMAND_TYPE.UIM_N_PLD.value) ? "arbitration" : "trial"} are as follows:`],
                                            size: 24
                                        })
                                    ]
                                }),

                                ...(settlementDemandTableDoc || []),

                                new Paragraph({
                                    spacing: {
                                        after: 120
                                    },
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            children: [" "],
                                            size: 24,

                                        })
                                    ]
                                }),
                                ...(settlementDescriptions || []),
                                (medicalExpensesExhibitPaths?.length > 0 &&
                                    new Paragraph({
                                        spacing: {
                                            after: 120
                                        },
                                        alignment: AlignmentType.LEFT,
                                        children: isExhibitInlcuded ? [
                                            new Bookmark({
                                                id: "medicalExpensesExhibit",
                                                children: [
                                                    new TextRun({
                                                        children: [`Copies of ${clientFullName}'s future medical expenses are attached as `],
                                                        size: 24,
                                                    }),
                                                    futureExpenseExhibitLink
                                                ]
                                            })] :""
                                    })
                                ),
                            ]:[]),
                            ...(badFaithExposerTitles || []),
                            ...(badFaithExposerDescriptions || []),
                            ...(termOfSettlementTitles || []),
                            ...(termOfSettlementDescriptions || []),


                            new Paragraph({
                                spacing: { after: 120 },
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: ["Very truly yours, "],
                                        size: 24,

                                    })
                                ]
                            }),
                            ...(firmNameTitle || []),
                        ]
                    },
                    ...(!!isExhibitInlcuded ? [
                        ...(policeReportExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: policeReportExhibitSectionDoc
                        }] : []),

                        ...(acciedentFileExhibitSectionDoc?.length ? [{
                             
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: acciedentFileExhibitSectionDoc
                        }] : []),

                        ...(preMedicalRecordExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })]
    
                                        }),
                                    ],
                                }),
                            },
                            children: preMedicalRecordExhibitSectionDoc
                        }] : []),
                        
                        ...(medicalRecordExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
    
                                            children: [
                                                new TextRun({
                                                    children: [""],
                                                    size: 58,
                                                    bold: true
                                                })],
                                        }),
                                    ],
                                }),
                            },
                            children: medicalRecordExhibitSectionDoc
                        }] : []),
                        
                        ...(bodilyInjuryExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children:bodilyInjuryExhibitSectionDoc
                        }] : []),
                        
                        // Expert Report
                        ...(expertReportExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: expertReportExhibitSectionDoc
                        }] : []),
                        
                        //  incident Report
                        ...(incidentReportExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: incidentReportExhibitSectionDoc
                        }] : []),
                     
    
                        //    witness Report
                        ...(witnessReportExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: witnessReportExhibitSectionDoc
                        }] : []),
                        
                        // Selected Incident image
                        ...(selectedIncidentImageExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: selectedIncidentImageExhibitSectionDoc
                        }] : []),
                        
                        // incident Image
                        ...(incidentImageExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children:incidentImageExhibitSectionDoc
    
                        }] : []),
                        
                        // Selected Product Image
                        ...(selectedProductExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: selectedProductExhibitSectionDoc
    
                        }] : []),
                        
                        //  Product Image
                        ...(productExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: productExhibitSectionDoc
    
                        }] : []),
                        
                        // lossOfIncomeExhibitSectionDoc
                        ...(lossOfIncomeExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: lossOfIncomeExhibitSectionDoc
                        }] : []),
                        
                        // medicalExpensesExhibitSectionDoc
                        ...(medicalExpensesExhibitSectionDoc?.length ? [{
                            properties: {
                                page: {
                                    size: {
                                        orientation: PageOrientation.PORTRAIT,
                                    },
                                },
                            },
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            spacing: { after: 400 },
                                            children: [new TextRun({
                                                children: [""],
                                                size: 58,
                                                bold: true
                                            })],
                                        }),
                                    ],
                                }),
                            },
                            children: medicalExpensesExhibitSectionDoc
                        }] : []),
                ]: []),
                 
                ]
            });

            await generateWordFromBuffer(document, s3FilePath);
            }

            await Case.findByIdAndUpdate(caseId, {
                $set: {
                    [`docxFiles.${DEMAND_TYPE[demand.value]?.key}`]: s3FilePath,
                    isCaseEdited: true
                }
            },
                { new: true }
            ).lean();

            console.log(`Finished creating ${demand.text} for caseID: ${caseId} in the client: ${domainName}`)
            
            
            return s3FilePath

        } catch (e) {
            console.log(e)
            throw e;
        }
    } catch (error) {
        throw error;
    }
}

const generateWordFromBuffer = async (document, s3FilePath) => {
    await Packer.toBuffer(document)
        .then(async (buffer) => {
            try {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: s3FilePath,
                    Body: buffer
                };
                await s3Client.putObject(params).promise();
                //console.log('File uploaded successfully.');
            } catch (err) {
                console.log(err)
                throw err
            }
        })
        .catch((error) => {
            console.error("Error creating document:", error);
            throw error;
        });
    return s3FilePath
}

const getMedicalBillData = (medicalBillData = []) => {

    const billMap = new Map();
    let totalAmount = 0;

    for (const bill of medicalBillData) {
        const medicalProviderName = bill.medicalProviderName.split('_')[0];
        const totalBillAmount = bill?.totalBillAmount > 0 ? parseFloat(bill.totalBillAmount) : 0;

        if (billMap.has(medicalProviderName)) {
            billMap.set(medicalProviderName, billMap.get(medicalProviderName) + totalBillAmount);
        } else {
            billMap.set(medicalProviderName, totalBillAmount);
        }

        totalAmount += totalBillAmount;
    }

    const billPerProvider = [];
    billMap.forEach((totalBillAmount, medicalProviderName) => {
        billPerProvider.push({ medicalProviderName, totalBillAmount });
    });

    return { billPerProvider, totalBillAmount: totalAmount };
};

const getTemplateFromDB = async (dbInstance, query) => {
    const Template = dbInstance.model('demandtemplates', DemandTemplateSchema);
    return await Template.findOne(query).lean();
};

module.exports = { createAndSaveSetttlementReportWord }