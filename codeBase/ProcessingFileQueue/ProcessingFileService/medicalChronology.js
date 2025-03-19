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
    convertInchesToTwip,
    Tab,
    PageOrientation,
    LevelFormat,
    InternalHyperlink,
    Bookmark,
    ShadingType,
    PageNumber,
    NumberFormat,
    Footer,
    PageBreak
} = require("docx");

const SettingSchema = require("../src/db/models/SettingSchema");
const { getParseHtmlToTextObjects } = require('./dynamicWordDataProcessing')
const moment = require('moment');
const { mongoose } = require("mongoose");
const CaseSchema = require("../src/db/models/Case");
const { DEMAND, DEMAND_TYPE } = require("../src/utils/enum");
const { s3Client } = require("../src/utils/aws/client");



const createMedicalChronology = async (domainName, caseId, demand) => {
    const db = mongoose.connection.useDb(domainName);
    const Case = db.model("cases", CaseSchema);
    const Setting = db.model('settings', SettingSchema);

    const setting = await Setting.findOne({
        isDefault: true
    }).lean();
    const settingTemplate = setting?.template;
    const checkcompanyLogo = settingTemplate?.companyLogo;
    const fontName = settingTemplate?.fontFamily || 'Times New Roman';
    const attorneyNameData = settingTemplate?.attorneyName;
    const attorneyEmailData = settingTemplate?.attorneyEmail;
    const firmAddressData = settingTemplate?.firmAddress;
    // const demandType = demand.value;


    const caseData = await Case.findById(caseId).lean();
    const userId = caseData?.userId || null;
    const victimName = caseData?.detailsInput?.caseInfo?.caseName || "";
    const userData = caseData?.detailsInput || "";
    const createDate = caseData?.createdOn || "";
    const medicalRecords = caseData?.result?.medicalRecords || [];
    const preMedicalRecords = caseData?.result?.preMedicalRecords || [];
    const gender = userData?.painAndSuffering?.gender;
    const createdDate = moment(createDate).format('MMMM D, YYYY');
    const claimAmount = userData.painAndSuffering?.monthlyamount.split('.')[0]
    const annualClaimAmount = userData.painAndSuffering?.annualamount.split('.')[0]
    const clientProfession = userData.damage?.typeofWork;
    const hourlyIncomeRate = userData.damage?.hourlyIncomeRate;
    const workHourMissed = userData.damage?.WorkHoursMissed;
    let clientName = gender === "Male" ? `Mr. ${userData?.caseInfo?.clientName?.trim().split(" ").at(-1)}` : `Ms. ${userData?.caseInfo?.clientName?.trim().split(" ").at(-1)}`
    let clientFullName = `${userData?.caseInfo?.clientName}`
    const faulterName = `${userData?.caseInfo?.defendantName}`
    const accidentDate = moment(userData?.caseInfo?.dateOfIncident).format('MMMM D, YYYY')
    
    const accidentDateMoment = moment(userData?.caseInfo?.dateOfIncident);
    const createdDateMoment = moment(createDate);
    // Calculate difference using the moment objects
    let monthsDifference = parseInt(createdDateMoment.diff(accidentDateMoment, 'months', true));
    let month = isNaN(monthsDifference) ? parseInt('0') : monthsDifference
    const age = userData?.painAndSuffering?.age;
    const visitDates = caseData?.result?.visitDates || "";
    const preMedicalVisitDates = caseData?.result?.preMedicalVisitDates || "";


    const medicalRecordsExhibit = caseData?.result?.medicalRecordsExhibitDirectoryPath || [];
    const preMedicalRecordsExhibit = caseData?.result?.preMedicalRecordsExhibitDirectoryPath || [];


    let name = victimName;
    let attorneyNames;
    let companyLogo;
    let attorneyEmails;
    let firmAddresss;
    let bookmarkCounter = 0;
    let hyperlinkCounter = 0;



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

    if (checkcompanyLogo) {
        companyLogo = await getFileToS3(checkcompanyLogo);
    }



    let HeaderData = "";

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

    const rgbToHex = (r, g, b) => {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
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
            console.log(e)
        }
    }

    const replaceVariablesWithValues = (textData) => {

        const replacements = {
            "[Clientname]": clientName,
            "[clientFullName]": clientFullName,
            "[FaulterName]": faulterName,
            "[AccidentDate]": accidentDate,
            "[PastMonthlyPainAmount]": `$` + claimAmount,
            "[FutureYearlyPainAmount]": `$` + annualClaimAmount,
            "[Age]": age,
            "[CreatedDate]": createdDate,
            "[monthsDifference]": month,
            "[ClientProfession]": clientProfession,
            "[MissedWorkHours]": hourlyIncomeRate,
            "[HourlyWorkingRate]": workHourMissed,
            "[his/her]": gender === "Male" ? "his" : "her",
            "[he/she]": gender === "Male" ? "he" : "she",
            "[him/her]": gender === "Male" ? "him" : "her",
            "[PoliceReportExhibit]": "",
            "[PropertyInjuryPhotosExhibit]": "",
            "[PriorMedicalRecordExhibit]": "",
            "[AccidentInjuryPhotosExhibit]": "",
            "[PainAndSuffringSection]": "",
            "</t>": ""
        };

        let resultText = textData;

        for (const [key, value] of Object.entries(replacements)) {
            resultText = resultText?.replaceAll(key, value);
        }
        // console.log(resultText);

        return resultText;
    };

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
                        children: [x.textData?.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData)],
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
                    children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData)],
                    size: y?.style.includes('font-size') ? getFontSize(y.style, 15) : 15,
                    color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                    bold: y.isBold || false,
                    italics: y.isItalic || false,
                    underline: y.isUnderline || false

                }))

            });
        }
    }).flat();


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
                        children: [valuesToCheck.includes(x.className?.split('-').at(-1)) ? "        " : "", replaceVariablesWithValues(x.textData)],
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
                    children: [valuesToCheck.includes(y.className?.split('-').at(-1)) ? "        " : "", replaceVariablesWithValues(y.textData)],
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
                        children: [x.textData?.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(x.textData)],
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
                    children: [y.textData.includes('</t>') ? new Tab() : "", replaceVariablesWithValues(y.textData)],
                    size: y?.style.includes('font-size') ? getFontSize(y.style, 15) : 15,
                    color: y?.style.includes('color') ? getFontColor(y?.style) : "",
                    bold: y.isBold || false,
                    italics: y.isItalic || false,
                    underline: y.isUnderline || false
                }))
            });
        }
    }).flat();

    if (attorneyNames?.length > 0 && attorneyEmails?.length > 0) {
        HeaderData = new Table({
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

    const removeDuplicates = (array) => {
        const uniqueNames = new Set();
        const imagingData = array?.filter(scan => !scan.imagingImpression.includes('No-findings'))

        return imagingData.filter(item => {
            const lowerCaseName = item.imagingName.toLowerCase();
            // array.map((values) => values.imagingImpression.filter(x => x !== "No-findings"))
            if (!uniqueNames.has(lowerCaseName)) {
                uniqueNames.add(lowerCaseName);
                return true;
            }
            return false;
        });
    };

    const imagingImpressions = (values) => {
        let impressions = [];
        const uniqueArray = removeDuplicates(values.imagingData);
        uniqueArray.filter(x => x.scanType !== "Ultrasound" && x.imagingName !== "No-findings" && x.imagingName !== "").forEach((data) => {
            const imaginName = new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 120 },
                children: [
                    new TextRun({ text: data?.imagingName + ':' + '\n', underline: true, size: 24 }),
                    new TextRun({ text: '\n' }),
                ]
            });
            const imageImpressions = data?.imagingImpression.map(impression =>
                new Paragraph({
                    // spacing: { after: 120 },
                    alignment: AlignmentType.JUSTIFIED,
                    numbering: {
                        reference: "my-unique-bullet-points",
                        level: 0,
                    },
                    children: [new TextRun({ text: impression, size: 24 })]
                }));
            impressions.push(imaginName, ...imageImpressions);
        });
        return impressions;
    }

    const diagnosesData = (values, index) => {
        return values?.map((data, index) =>
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                numbering: {
                    reference: "my-unique-bullet-points",
                    level: 0,
                },
                children: [new TextRun({ text: data + '\n', size: 24 })]
            }))
    }

    const getHospitalTreatmentData = (data, bookmarkId) => {
        let hospitalTreatmentData = []
        data?.forEach((treatment) => {
            sections = [
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Date of Service' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.date, size: 24 }),
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Type of Visit' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.typeOfVisit + ' ', size: 24 }),
                        new Bookmark({
                            id: `id${treatment?.date}`,
                            children: [
                                new InternalHyperlink({
                                    children: [new TextRun({ text: '- ', size: 20 }),
                                    new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                    ], anchor: `${bookmarkId}${treatment?.pageNumber}`
                                }),

                            ]
                        }),
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Patient Complaints' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.primaryVisitComplaint, size: 24 }),
                    ]
                }),
                ...treatment?.historyOfPresentIllness == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'History of Present Illness' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.historyOfPresentIllness + " ", size: 24 }),
                    ]
                })],
                ...treatment?.pastMedicalHistory == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Past Medical History' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.pastMedicalHistory + " ", size: 24 }),
                    ]
                })],
                ...treatment?.pastSurgicalHistory == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Past Surgical History' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.pastSurgicalHistory + " ", size: 24 }),
                    ]
                })],
                ...treatment?.painLevel == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Pain Level' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.painLevel + " ", size: 24 }),
                    ]
                })],
                ...treatment?.goals == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Goals' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.goals + " ", size: 24 }),
                    ]
                })],
                ...treatment?.assessment == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Assessment' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.assessment + " ", size: 24 }),
                    ]
                })],
                ...treatment?.restrictionsPrecautionsForTreatment == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Restrictions / Precautions For Treatment' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.restrictionsPrecautionsForTreatment + " ", size: 24 }),
                    ]
                })],
                ...treatment?.priorLevelOfFunction == undefined ? [] : [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Prior Level of Function' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.priorLevelOfFunction + " ", size: 24 }),
                    ]
                })],
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Review of System / Physical Exam' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.reviewOfSystemPhysicalExam, size: 24 }),
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Diagnosis' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.diagnosis, size: 24 }),
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({ text: 'Plan / Recommendation' + ': ', bold: true, size: 24 }),
                        new TextRun({ text: treatment?.planRecommendation + ' ', size: 24 }),
                        new Bookmark({
                            id: `id${treatment?.date}`,
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                    ], anchor: `${bookmarkId}${treatment?.pageNumber}`
                                }),

                            ]
                        }),
                    ]
                }),
                //put image findings section styled like MRI findings here
                //only add findings section if imageFindings array's length is greater than 0
                !(treatment?.imageFindings !== undefined && treatment?.imageFindings.length > 0) ? [] : new Paragraph({ children: [new TextRun({ text: 'Findings:' + '\n', bold: true, size: 24 })] }),
                ...treatment?.imageFindings.map(finding =>
                    new Paragraph({
                        // spacing: { after: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                        numbering: {
                            reference: "my-unique-bullet-points",
                            level: 0,
                        },
                        children: [new TextRun({ text: finding, size: 24 })]
                    })
                ),
                new Paragraph({ children: [new TextRun({ text: '\n', bold: true, size: 24 })] }),
                //put additional sections code here
                ...treatment?.additionalSections.map(section =>
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({ text: section?.sectionTitle + ': ', bold: true, size: 24 }),
                            new TextRun({ text: section?.sectionContent, size: 24 }),
                        ]
                    }),
                ),
                // new Paragraph({ children: [new TextRun({ text: '\n', bold: true, size: 24 })] }),
                // new Paragraph({ children: [new TextRun({ text: '\n', bold: true, size: 24 })] }),
            ]
            hospitalTreatmentData = [...hospitalTreatmentData, ...sections]
        })
        return hospitalTreatmentData
    }

    const getConsultationReportsData = (consultationData) => {
        //console.log("input to getConsultationReportsData: ", consultationData)
        const diagnoses = []
        const causation = []
        const historyOfInjury = []
        const pastSurgicalHistory = []
        const pastMedicalHistory = []
        const treatmentSummary = []
        const imagingData = []
        const treatmentDates = []
        let consultationReport = [];

        consultationData.map((data) => {
            diagnoses.push(data?.diagnoses)
            causation.push(data?.causation)
            historyOfInjury.push(data?.historyOfInjury)
            pastSurgicalHistory.push(data?.pastSurgicalHistory)
            pastMedicalHistory.push(data?.pastMedicalHistory)
            treatmentSummary.push(data?.treatmentSummary)
            treatmentDates.push(data?.treatmentSummary[0]?.date)
            imagingData.push(data?.imagingData)
        })

        consultationReport = [{
            "diagnoses": [...new Set(diagnoses.flat())],
            "causation": [...new Set(causation.flat())],
            "historyOfInjury": [...new Set(historyOfInjury.flat())],
            "pastSurgicalHistory": [...new Set(pastSurgicalHistory.filter(x => x != 'NA').flat())],
            "pastMedicalHistory": [...new Set(pastMedicalHistory.filter(x => x != 'NA').flat())],
            "treatmentDates": treatmentDates.sort((a, b) => new Date(a) - new Date(b)),
            "treatmentSummary": treatmentSummary.flat().sort((a, b) => new Date(a.date) - new Date(b.date)),
            "imagingData": imagingData
        }]
        return consultationReport;
    }

    const getConsultationReportsDiagones = (data) => {
        return [...new Set(data)]?.map((imaginData, index) =>
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                numbering: {
                    reference: "my-unique-bullet-points",
                    level: 0,
                },
                children: [new TextRun({ text: imaginData + '\n', size: 24 })]
            })
        )
    }


    const getConsultantPastMedicalHistory = (values) => {
        return values?.map((data) =>
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                numbering: {
                    reference: "my-unique-bullet-points",
                    level: 0,
                },
                children: [new TextRun({ text: data + '\n', size: 24 })]
            }))
    }


    const getConsultationReportImagingsData = (data) => {
        try {
            let impressions = [];

            // Guard clause for invalid input
            if (!Array.isArray(data)) {
                console.log("Input data is not an array");
                return [];
            }

            // Flatten array and filter out invalid entries
            let flatdata = data.flat().filter(item => {
                return item && typeof item === 'object' && !Array.isArray(item);
            });

            // Group and normalize the data
            const groupedData = Object.values(flatdata.reduce((acc, item) => {
                // Skip invalid entries
                if (!item.imagingName) return acc;

                // Initialize if not exists
                if (!acc[item.imagingName]) {
                    acc[item.imagingName] = {
                        ...item,
                        imagingImpression: new Set()
                    };
                }

                // Handle different imagingImpression formats
                if (item.imagingImpression) {
                    if (Array.isArray(item.imagingImpression)) {
                        // Handle array of impressions
                        item.imagingImpression.forEach(impression => {
                            if (typeof impression === 'string' && impression.trim()) {
                                acc[item.imagingName].imagingImpression.add(impression.trim());
                            }
                        });
                    } else if (typeof item.imagingImpression === 'string') {
                        // Handle string impression
                        acc[item.imagingName].imagingImpression.add(item.imagingImpression.trim());
                    }
                }

                return acc;
            }, {})).map(item => ({
                ...item,
                imagingImpression: Array.from(item.imagingImpression)
            }));

            // Create paragraphs for valid entries
            groupedData
                .filter(x => x.imagingName &&
                    x.imagingName !== "No-findings" &&
                    x.imagingName !== "" &&
                    x.imagingImpression.length > 0)
                .forEach((data) => {
                    const imaginName = new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({ break: 1 }),
                            new TextRun({ text: data.imagingName + ':', underline: true, size: 24 }),
                        ]
                    });

                    const imageImpressions = data.imagingImpression.map(impression =>
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            numbering: {
                                reference: "my-unique-bullet-points",
                                level: 0,
                            },
                            children: [new TextRun({ text: impression, size: 24 })]
                        }));

                    impressions.push(imaginName, ...imageImpressions);
                });

            return impressions;
        } catch (e) {
            console.log("Error in getConsultationReportImagingsData:", e);
            return [];
        }
    };

    const getTreatDiscriptionPoints = (description) => {

        return description?.filter(x => x !== "").map((data, index) =>
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                numbering: {
                    reference: "my-unique-bullet-points",
                    level: 0,
                },
                children: [new TextRun({ text: index === 0 ? `${data}.` : `${data.replace(' ', '')}.`, size: 24 })]
            }))
    }

    const getConsultantTreatmentSummary = (treatmentSummary, bookmarkId) => {
        let consultantData = [];
        treatmentSummary?.forEach((data) => {

            const dateandDescription = new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 120 },
                children: [
                    new TextRun({ text: moment(data?.date).format('M/D/YY') + ' ', bold: true, size: 24 }),
                    new TextRun({ text: 'Current Complaints: ' + '  ', bold: true, size: 24 }),
                    new Bookmark({
                        id: `id${data.date}`,
                        children: [
                            new InternalHyperlink({
                                children: [
                                    new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                ], anchor: `${bookmarkId}${data?.pageNumber}`
                            })
                        ]
                    }),
                ]
            });
            const description = getTreatDiscriptionPoints(data?.treatmentDescription.replaceAll('  ', ' ').split('.'))


            const physicalExaminationData = data?.physicalExamination?.flatMap((physicalExaminationValues, index) => [
                ...(index === 0 ? [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { before: 120, after: 120 },
                    children: [
                        new TextRun({ text: 'Physical Examination: ', bold: true, size: 24 }),
                    ]
                })] : []),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    numbering: {
                        reference: "my-unique-bullet-points",
                        level: 0,
                    },
                    children: [new TextRun({ text: physicalExaminationValues, size: 24 })]
                })
            ])

            const planAndDiscussion = data?.PlanDiscussion?.flatMap((PlanDiscussionValues, index) => [
                ...(index === 0 ? [new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { before: 120, after: 120 },
                    children: [
                        new TextRun({ text: 'Plan/Discussion: ', bold: true, size: 24 }),
                    ]
                })] : []),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    numbering: {
                        reference: "my-unique-bullet-points",
                        level: 0,
                    },
                    children: [new TextRun({ text: PlanDiscussionValues, size: 24 })]
                })
            ]);

            consultantData.push(dateandDescription, ...description, ...physicalExaminationData, ...planAndDiscussion, new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 120 },
                children: []
            }), new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 120 },
                children: []
            }));
        });
        return consultantData;
    }


    const uniqueDates = (values) => {
        let uniqueDatesData = []
        for (let i = 0; i <= values?.length; i++) {
            uniqueDatesData.push(values[i]?.date)
        }
        uniqueDatesData = uniqueDatesData.filter(item => item !== undefined)
        const dates = [...new Set(uniqueDatesData)].length
        return `${dates.toString()}`

    }


    const getOtherMedicalRcordsDiagonsis = (diagnoses) => {
        let filteredDiagonesData = diagnoses[0]?.values?.filter(x => x !== 'Sure, here are the ICD10 codes and their corresponding disease names:').map((data) => data.replaceAll('ICD10 Code:', "").replaceAll('Disease Name:', '').replaceAll(':', ''))
        return [...new Set(filteredDiagonesData)]?.filter(x => x.trim() !== '').map((data) =>
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                numbering: {
                    reference: "my-unique-bullet-points",
                    level: 0,
                },
                children: [new TextRun({ text: data.trim() + '\n', size: 24 })]
            }))
    }

    const getProcessedMedicalRecords = (priorOrPreMedicalRecords, bookmarkId) => {
        return priorOrPreMedicalRecords?.map(record => {
            const recordParagraphs = record?.flatMap((values, index) => {
                try {

                    const medicalType = values?.medicalTypeName;
                    let treatmentDate = ""
                    if (medicalType !== "ER" && medicalType !== "Hospital" && medicalType !== "Consultation Reports") { //MRI, OTHER, SURGERY
                        let treatmentTimeLine = values?.treatmentDates.map(date => moment(date.date).format('M/D/YYYY'));
                        treatmentTimeLine = [...new Set(treatmentTimeLine)]
                    }
                    let treatmentText;

                    if (medicalType === "MRI Other Imaging") {
                        treatmentText = values.treatmentDates?.flatMap((date, index) => {
                            // const dates = uniqueDateArr.filter(x => x >= date.date)
                            return [
                                // dates.push(date.date),
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                        new TextRun({ text: moment(date.date).format('M/D/YYYY') + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date.treatmentDescription + ' ', size: 24, size: 24 }),
                                        new Bookmark({
                                            id: `id${date.date}`,
                                            children: [
                                                new InternalHyperlink({
                                                    children: [
                                                        new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                                    ], anchor: `${bookmarkId}${date.pageNumber}`
                                                })
                                            ]
                                        }),
                                        new TextRun({ break: 1 }),
                                    ]
                                }),


                                new Paragraph({ children: [new TextRun({ text: 'Findings:' + '\n', bold: true, size: 24 })] }),
                                ...findingsRendering(values, index),
                            ];
                        });

                    } else if (medicalType === "Surgery Center Reports") {
                        treatmentText = values.treatmentDates?.flatMap(date => {
                            return [
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({ text: 'Attending Physician/Surgeon' + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date.Surgeon, size: 24 }),
                                    ]

                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({ text: moment(date.date).format('M/D/YYYY') + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date.treatmentDescription + " ", size: 24 }),
                                        new Bookmark({
                                            id: `id${date.date}`,
                                            children: [
                                                new InternalHyperlink({
                                                    children: [
                                                        new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                                    ], anchor: `${bookmarkId}${date.pageNumber}`
                                                })
                                            ]
                                        }),
                                        new TextRun({ text: '\n\n' }),
                                    ]

                                }),
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                                new Paragraph({ children: [new TextRun({ text: 'Treatment Summary:' + '\n', bold: true, size: 24 })] }),
                                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: date.procedures + '\n', size: 24 })] }),
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                            ];
                        });

                    } else if (medicalType === "ER") {
                        const physicalExamination = values?.physicalExaminationData ? values?.physicalExaminationData[0]?.systemPhysicalExam : ""// 
                        const recommendation = values?.planRecommendation?.filter((values, index) => index < 2).map((values) => values?.planRecommendation).join(' ')
                        treatmentText = values.treatmentDates?.flatMap(date => {
                            return [
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: ShadingType.SOLID,
                                        color: "001C66",
                                        fill: "001C66",
                                    },
                                    children: [
                                        new TextRun({ text: ' Medical Provider' + ': ', bold: true, size: 24, color: 'FFFFFF' }),
                                        new TextRun({ text: values?.name, size: 24, bold: true, color: 'FFFFFF' }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: ShadingType.SOLID,
                                        color: "001C66",
                                        fill: "001C66",
                                    },
                                    children: [
                                        new TextRun({ text: 'Admitted' + ': ', bold: true, size: 24, color: 'FFFFFF' }),
                                        new TextRun({ text: date?.admittedDate, size: 24, bold: true, color: 'FFFFFF' }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: ShadingType.SOLID,
                                        color: "001C66",
                                        fill: "001C66",
                                    },
                                    children: [
                                        new TextRun({ text: 'Discharged' + ': ', bold: true, size: 24, color: 'FFFFFF' }),
                                        new TextRun({ text: date?.dischargedDate, size: 24, bold: true, color: 'FFFFFF' }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({ break: 1 }),
                                        new TextRun({ text: 'Chief Complaint' + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date?.chiefComplaint, size: 24 }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({ break: 1 }),
                                        new TextRun({ text: 'Impression/ED Plan' + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date?.impression + " ", size: 24 }),
                                        new Bookmark({
                                            id: `id${date?.admittedDate}`,
                                            children: [
                                                new InternalHyperlink({
                                                    children: [
                                                        new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                                    ], anchor: `${bookmarkId}${date?.pageNumber}`
                                                })
                                            ]
                                        }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({ break: 1 }),
                                        new TextRun({ text: 'History of Present Illness' + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date?.historyOfPresentIllness, size: 24 }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({ break: 1 }),
                                        new TextRun({ text: 'Past Medical History' + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date?.pastMedicalHistory, size: 24 }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({ text: 'Past Surgical History' + ':' + '\n', bold: true, size: 24 }),
                                        new TextRun({ text: date?.pastSurgicalHistory + '\n', size: 24 }), new TextRun({ text: '\n\n' }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({ text: 'Review of System/Physical Exam' + ':' + '\n', bold: true, size: 24 }),
                                        new TextRun({ text: physicalExamination + '\n', size: 24 }), new TextRun({ text: '\n\n' }),
                                    ]
                                }),
                                new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Imaging:' + '\n', bold: true, size: 24 })] }),
                                ...imagingImpressions(values, index),
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                                new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Plan/Recommendation:' + '\n', bold: true, size: 24 })] }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED, children: [
                                        new TextRun({ text: recommendation + " ", size: 24 }),
                                        new Bookmark({
                                            id: `id${date?.admittedDate}`,
                                            children: [
                                                new InternalHyperlink({
                                                    children: [
                                                        new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                                    ], anchor: `${bookmarkId}${date?.pageNumber}`
                                                })
                                            ]
                                        }),
                                        new TextRun({ text: '\n', size: 24 })
                                    ]
                                }),
                                new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Diagnosis:' + '\n', bold: true, size: 24 })] }),
                                ...diagnosesData(date?.diagnoses),
                                // new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                            ];
                        });
                    } else if (medicalType === "Hospital") {
                        //console.log("inside processing hospital records")
                        treatmentText = values?.treatmentDates?.flatMap((date, index) => {
                            return [
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: index == 0 ? ShadingType.SOLID : "",
                                        color: index == 0 ? "001C66" : "FFFFFF",
                                        fill: index == 0 ? "001C66" : "FFFFFF",
                                    },
                                    children: [
                                        new TextRun({
                                            text: index == 0 ? ' Medical Provider: ' : "" + '\n', bold: true, size: 24, color: 'FFFFFF'
                                        }),

                                        new TextRun({ text: index == 0 ? values?.name : "", size: 24, bold: true, color: 'FFFFFF' }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: index == 0 ? ShadingType.SOLID : "",
                                        color: index == 0 ? "001C66" : "FFFFFF",
                                        fill: index == 0 ? "001C66" : "FFFFFF",
                                    },
                                    children: [
                                        new TextRun({ text: index == 0 ? 'Dates of Service' + ':' : "", bold: true, size: 24, color: 'FFFFFF' }),
                                        new TextRun({ text: index == 0 ? date.admittedDate + '-' + date.dischargeDate : "", size: 24, color: 'FFFFFF' }),
                                    ]
                                }),

                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: index == 0 ? ShadingType.SOLID : "",
                                        color: index == 0 ? "001C66" : "FFFFFF",
                                        fill: index == 0 ? "001C66" : "FFFFFF",
                                    },
                                    children: [
                                        new TextRun({ text: 'Chief Complaint' + ':', bold: true, size: 24, }),
                                        new TextRun({ text: date.chiefComplaint, size: 24, }),
                                    ]
                                }),
                                ...getHospitalTreatmentData(date?.treatmentSummary ? date?.treatmentSummary : [], bookmarkId),
                                new Paragraph({ children: [new TextRun({ text: '\n' })] }),

                            ];

                        });

                    } else if (medicalType === "Consultation Reports") {
                        const consultationFormattedData = values?.medicalTypeName == "Consultation Reports" ? getConsultationReportsData(values?.treatmentDates) : console.log("Not Matched");
                        //console.log("consultationFormattedData: ", consultationFormattedData)
                        treatmentText = consultationFormattedData?.flatMap((date, index) => {
                            return [
                                new Paragraph({
                                    shading: {
                                        type: ShadingType.SOLID,
                                        color: "001C66",
                                        fill: "001C66",
                                    },
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: index === 0 ? ' Medical Provider: ' : "",
                                            bold: true,
                                            size: 24,
                                            color: 'FFFFFF'
                                        }),
                                        new TextRun({
                                            text: index === 0 ? values?.name : "",
                                            size: 24,
                                            bold: true,
                                            color: 'FFFFFF'
                                        }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: ShadingType.SOLID,
                                        color: "001C66",
                                        fill: "001C66",
                                    },
                                    children: [
                                        new TextRun({
                                            text: index === 0 ? 'Treatment Timeline: ' : "",
                                            bold: true,
                                            size: 24,
                                            color: 'FFFFFF'
                                        }),
                                        new TextRun({
                                            text: index === 0 ? moment(date?.treatmentSummary[0]?.date).format('M/D/YYYY') + ' - ' + moment(date?.treatmentSummary.at(-1)?.date).format('M/D/YYYY') : "",
                                            size: 24,
                                            bold: true,
                                            color: 'FFFFFF'
                                        })
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    shading: {
                                        type: ShadingType.SOLID,
                                        color: "001C66",
                                        fill: "001C66",
                                    },
                                    children: [
                                        new TextRun({
                                            text: index === 0 ? 'Medical Visits: ' : "",
                                            bold: true,
                                            size: 24,
                                            color: 'FFFFFF'
                                        }),
                                        new TextRun({
                                            text: index === 0 ? `${date?.treatmentSummary.length}` : "",
                                            size: 24,
                                            bold: true,
                                            color: 'FFFFFF'
                                        }),
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: []
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({
                                            text: 'Diagnosis/Assessment:' + '\n',
                                            bold: true,
                                            size: 24
                                        }),
                                    ]
                                }),
                                ...getConsultationReportsDiagones(date?.diagnoses),

                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { before: 120, after: 120 },

                                    children: [
                                        new TextRun({
                                            text: 'Causation: ',
                                            bold: true,
                                            size: 24
                                        }),
                                        new TextRun({
                                            text: date?.causation.filter(x => x !== "NA").join(' ').replaceAll('.,', '.') + '\n',
                                            size: 24
                                        }),
                                    ]
                                }),

                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({
                                            text: 'History of Injury:' + '\n',
                                            bold: true,
                                            size: 24
                                        }),
                                        new TextRun({
                                            text: date?.historyOfInjury.join(' ') + '\n',
                                            size: 24
                                        }),
                                    ]
                                }),
                                ...(!date?.pastMedicalHistory) ? [] : [new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({
                                            text: 'Past Medical History:' + '\n',
                                            bold: true,
                                            size: 24
                                        }),
                                    ]
                                }),
                                ...getConsultantPastMedicalHistory(date?.pastMedicalHistory)],

                                ...(!date?.pastSurgicalHistory) ? [] : [new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { after: 120 },
                                    children: [
                                        new TextRun({
                                            text: 'Past Surgical History:' + '\n',
                                            bold: true,
                                            size: 24
                                        }),
                                    ]
                                }),
                                ...getConsultantPastMedicalHistory(date?.pastSurgicalHistory)],

                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { before: 120, after: 120 },
                                    children: [
                                        new TextRun({
                                            text: 'Review of Imaging:' + '\n',
                                            bold: true,
                                            size: 24
                                        }),
                                    ]
                                }),
                                ...getConsultationReportImagingsData(date?.imagingData),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { before: 120 },
                                    children: []
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    spacing: { before: 120, after: 120 },
                                    children: [
                                        new TextRun({
                                            text: 'Treatment Summary:',
                                            bold: true,
                                            size: 24
                                        }),
                                    ]
                                }),
                                ...getConsultantTreatmentSummary(date?.treatmentSummary, bookmarkId)
                            ]
                        });

                    } else {
                        treatmentText = values.treatmentDates.flatMap((date, index) => {
                            return [
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({ text: moment(date.date).format('M/D/YYYY') + ': ', bold: true, size: 24 }),
                                        new TextRun({ text: date.treatmentDescription + ' ', size: 24 }),
                                        new Bookmark({
                                            id: `id${date.date}`,
                                            children: [
                                                new InternalHyperlink({
                                                    children: [
                                                        new TextRun({ text: 'See Record', style: 'Hyperlink', size: 20 })
                                                    ], anchor: `${bookmarkId}${date.pageNumber}`
                                                }),

                                            ]
                                        }),
                                    ]
                                }),
                                new Paragraph({ children: [new TextRun({ text: '' })] }),
                            ];
                        });
                    }
                    return [
                        // new Paragraph({ children: [new TextRun({ text: '' })] }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            shading: {
                                type: ShadingType.SOLID,
                                color: "001C66",
                                fill: "001C66",
                            },
                            children: [
                                new TextRun({
                                    text: ' Medical Provider: ', bold: true, size: 24, alignment: AlignmentType.LEFT, color: 'FFFFFF'
                                }),
                                new TextRun({ text: `${values.name}`, size: 24, bold: true, alignment: AlignmentType.LEFT, color: 'FFFFFF' }),
                            ]
                        }),
                        medicalType !== "ER" && medicalType !== "Hospital" && medicalType !== "Consultation Reports" ?
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                shading: {
                                    type: ShadingType.SOLID,
                                    color: "001C66",
                                    fill: "001C66",
                                },
                                children: [
                                    new TextRun({ text: 'Treatment Timeline: ', bold: true, size: 24, alignment: AlignmentType.LEFT, color: 'FFFFFF' }),
                                    new TextRun({ text: `${treatmentDate}`, size: 24, bold: true, alignment: AlignmentType.LEFT, color: 'FFFFFF' }),
                                ],
                            }) : "",
                        medicalType !== "ER" && medicalType !== "Hospital" && medicalType !== "Consultation Reports" ?
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                shading: {
                                    type: ShadingType.SOLID,
                                    color: "001C66",
                                    fill: "001C66",
                                },
                                children: [
                                    new TextRun({ text: 'Medical Visits: ', bold: true, size: 24, alignment: AlignmentType.LEFT, color: 'FFFFFF' }),
                                    new TextRun({ text: uniqueDates(values.treatmentDates), bold: true, size: 24, alignment: AlignmentType.LEFT, color: 'FFFFFF' }),
                                ],
                            }) : "",
                        // new Paragraph({ children: [new TextRun({ text: '' })] }),

                        ...medicalType === "All Other Medical Records" ?
                            [
                                new Paragraph({
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({ text: 'Diagnosis: ' + '\n', size: 24, bold: true }),
                                    ],
                                }),
                                ...getOtherMedicalRcordsDiagonsis(values.diagnosis),
                            ]
                            : "",

                        // new Paragraph({ children: [new TextRun({ text: '' })] }),
                        ...medicalType === "All Other Medical Records" ?
                            [new Paragraph({
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({ text: 'Objective Summary: ' + '\n', bold: true, size: 24 }),
                                    new TextRun({ text: values.objectFindings, size: 24 }),
                                ],
                            })
                            ]
                            : "",

                        medicalType === "All Other Medical Records" || medicalType === "MRI Other Imaging" ?
                            new Paragraph({ children: [new TextRun({ text: "Treatment Summary:", bold: true, size: 24 })] }) : "",
                        ...treatmentText,
                    ];
                } catch (e) {
                    console.log(e)
                    console.log("Failed to extract information from medical records")
                }

            });

            return recordParagraphs;
        }).flat()
    }

    const medicalRecordsParagraphs = getProcessedMedicalRecords(medicalRecords, "imageMedId");

    //console.log("medicalRecordsParagraphs", medicalRecordsParagraphs)
    const preMedicalRecordsParagraphs = getProcessedMedicalRecords(preMedicalRecords, "imagePreMedId")

    const medicalRecordExhibitLink = new InternalHyperlink({
        children: [
            new TextRun({
                text: medicalRecordsExhibit.length ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.` : "",
                bold: true,
                color: '0563C1',
                size: 24,
                style: "Hyperlink",
            }),
        ],
        anchor: "medicalRecordExhibitId",
    });

    const preMedicalExhibitLink = new InternalHyperlink({
        children: [
            new TextRun({
                text: preMedicalRecordsExhibit.length ? `EXHIBIT ${hyperlinkCounter = hyperlinkCounter + 1}.` : "",
                bold: true,
                color: '0563C1',
                size: 24,
                style: "Hyperlink",
            }),
        ],
        anchor: "preMedicalRecordsExhibitId",
    });


    let medicalRecordsExhibitPath = []

    if (medicalRecordsExhibit?.length > 0) {
        const medicalRecordsExhibitArr = Promise.all(medicalRecordsExhibit.map(async (fileName) => {
            const awsFile = await getFileToS3(fileName);
            return awsFile
        }));
        medicalRecordsExhibitPath = await medicalRecordsExhibitArr;
    }

    let pureVisitsDates = [];
    for (let i = 0; i < visitDates.length; i++) {
        if (visitDates[i].length > 10 || visitDates[i].length === 2) {
            pureVisitsDates.push(visitDates[i].replace(visitDates[i], ''))
        } else {
            pureVisitsDates.push(visitDates[i])
        }
    }


    const medicalRecordsExhibitData = medicalRecordsExhibitPath?.map((values, index) => {
        return new Paragraph({
            spacing: { after: 120 },
            indent: { right: convertInchesToTwip(0.7) },
            children: [
                new Bookmark({
                    id: `imageMedId${index + 1}`,
                    children: [
                        new InternalHyperlink({
                            children: [new TextRun({ text: 'Back', style: 'Hyperlink' }),

                            ], anchor: `id${pureVisitsDates[index]}` //need "unsorted" uniqueDateArr
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

    let purePreMeidcalVisitsDates = [];
    let preMedicalExhibitPath = []
    if (preMedicalRecordsExhibit?.length > 0) {
        const preMedicalRecordsExhibitArr = Promise.all(preMedicalRecordsExhibit.map(async (fileName) => {
            const awsFile = await getFileToS3(fileName);
            return awsFile
        }));
        preMedicalExhibitPath = await preMedicalRecordsExhibitArr;
    }

    for (let i = 0; i < preMedicalVisitDates.length; i++) {
        if (preMedicalVisitDates[i].length > 10 || preMedicalVisitDates[i].length === 2) {
            purePreMeidcalVisitsDates.push(preMedicalVisitDates[i].replace(preMedicalVisitDates[i], ''))
        } else {
            purePreMeidcalVisitsDates.push(preMedicalVisitDates[i])
        }
    }
    const preMedicalRecordsExhibitData = preMedicalExhibitPath?.map((values, index) => {
        return new Paragraph({
            spacing: { after: 120 },
            children: [
                new Bookmark({
                    id: `imagePreMedId${index + 1}`,
                    children: [
                        new InternalHyperlink({
                            children: [new TextRun({ text: 'Back', style: 'Hyperlink' }),

                            ], anchor: `id${purePreMeidcalVisitsDates[index]}`
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
            // Medical Record
            ...(medicalRecordsParagraphs.length > 0 ?
                [{
                    children: [
                        new Paragraph({
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
                        }),
                        ...medicalRecordsParagraphs,
                        new Paragraph({
                            spacing: {
                                after: 120
                            },
                            alignment: AlignmentType.LEFT,
                            children: [
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
                                })
                            ]
                        })

                    ],
                }] : []),
            // PRE Medical Record
            ...(preMedicalRecordsParagraphs.length > 0 ? [
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
                            spacing: { after: 120 },
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    children: [`${clientFullName.toLocaleUpperCase()}’S PRIOR MEDICAL TREATMENT`],
                                    size: 24,
                                    bold: true,
                                    underline: true

                                }),
                            ]
                        }),
                        ...preMedicalRecordsParagraphs,
                        new Paragraph({
                            spacing: {
                                after: 120
                            },
                            alignment: AlignmentType.LEFT,
                            children: [
                                new Bookmark({
                                    id: "Exhibit2Id",
                                    children: [
                                        new TextRun({
                                            children: [`Copies of ${clientFullName}'s records are attached as `],
                                            size: 24,
                                        }),
                                        preMedicalRecords?.length ? preMedicalExhibitLink : new TextRun({
                                            children: ["Exhibit."],
                                            size: 24
                                        })
                                    ]
                                })]
                        })

                    ]
                }] : []),
            //  Medical Record Exhibit
            ...(medicalRecordsExhibit.length > 0 ? [
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
                                        })]

                                })
                                , new PageBreak()],
                        }),
                        ...(medicalRecordsExhibitData ? medicalRecordsExhibitData : "" || []),
                    ]
                }] : []),
            // PRE Medical Record Exhibit
            ...(preMedicalRecordsExhibit.length > 0 ? [
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
                                            anchor: "Exhibit2Id",
                                        })
                                    ]
                                })
                                , new PageBreak()],
                        }),
                        ...(preMedicalRecordsExhibitData ? preMedicalRecordsExhibitData : "" || []),
                    ]
                }] : []),
        ],
    });


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
                    console.log('File uploaded successfully.');
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

    const s3FilePath = `${domainName}/${userId}/${caseData?.s3UniqueId}/generatedCase/${demand.value}-${name.trim()}.docx`;
    await generateWordFromBuffer(document, s3FilePath);
    await Case.findByIdAndUpdate(caseId, {
        $set: {
            [`docxFiles.${DEMAND_TYPE[demand.value]?.key}`]: s3FilePath
        }
    },
        { new: true }
    ).lean();
    console.log(s3FilePath)
    return s3FilePath;
}

module.exports = createMedicalChronology;