const { patchDocument, PatchType, Document,
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
    TabStopType } = require("docx");
const fs = require('fs')

const totalSettlementAmount = (amount, postNonEconomicsDamagesFinalAmount, pastNonEconomicDamages) => {
    const postNonEconimicAmount = parseFloat(postNonEconomicsDamagesFinalAmount.replaceAll(',', ''))
    const pastNonEconomicAmount = parseFloat(pastNonEconomicDamages.replaceAll(',', ''))
    const medicalExpenseAmount = amount
    const settlementAmoount = (postNonEconimicAmount + pastNonEconomicAmount + medicalExpenseAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return settlementAmoount
}

const createAndSaveTemplateReportWord = async (
    templateFile,
    {
        accidentDate,
        createdDate,
        clientName,
        clientFullName,
        faulterName,
        medicalRecordsDetailsDoc,
        priorMedicalRecordsDetailsDoc,
        executiveSummaryDoc,
        llmLibilityDescriptionDoc,
        selectedAccidentFilesDoc,
        propertyDamageHyperlinkSentenceDoc,
        policeReportExhibitSectionDoc,
        medicalRecordExhibitSectionDoc,
        preMedicalRecordExhibitSectionDoc,
        acciedentFileExhibitSectionDoc,
        bodilyInjuryExhibitSectionDoc,
        bodyInjryPhotoHyperlinkNumber,
        selectedBodyInjuryFilesArr,
        llmPainAndSufferingDoc,
        monthsDifference,
        pastMonthlyPainAmount,
        pastNonEconomicDamages,
        lifeExpectancyAge,
        FutureYearlyPainAmount,
        perDayAmountForFutureNonEconomicDamages,
        postNonEconomicsDamagesFinalAmount,
        HourlyWorkingRate,
        his_her,
        he_she,
        him_her,
        age,
        lossofIncomeCalculatedAmount,
        MissedWorkHours,
        perDayPasNonEconomicDamagesFinalAmount,
        settlementDemandTableDoc,
        clientProfession,
        policeReportLinkSentenceDoc,
        preMedicalRecordLinkSentenceDoc,
        defAdjusterName,
        defInsuranceName,
        defAdjusterAddress,
        defAdjusterCity,
        defAdjusterState,
        defAdjusterZip,
        clientAdjusterName,
        clientInsuranceName,
        clientAdjusterAddress,
        clientAdjusterCity,
        clientAdjusterState,
        clientAdjusetrZip,
        defClaimNumber,
        clientClaimNumber,
        defInsuranceLastName,
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
        futureExpenseExhibitSectionDoc
    }
) => {
     
    HourlyWorkingRate = HourlyWorkingRate || '0.00'
    clientName = clientName || ''
    clientFullName = clientFullName || ''
    clientProfession = clientProfession || 'N/A'
    monthsDifference = monthsDifference || '0'
    his_her = his_her || ''
    he_she = he_she || ''
    him_her = him_her || ''
    MissedWorkHours = MissedWorkHours || '0'
    lossofIncomeCalculatedAmount = lossofIncomeCalculatedAmount || '0'
    age = age || '0'
    postNonEconomicsDamagesFinalAmount = postNonEconomicsDamagesFinalAmount || '0'
    perDayAmountForFutureNonEconomicDamages = perDayAmountForFutureNonEconomicDamages || '0'
    FutureYearlyPainAmount = FutureYearlyPainAmount || '0'
    lifeExpectancyAge = lifeExpectancyAge || '0'
    pastNonEconomicDamages = pastNonEconomicDamages || '0'
    pastMonthlyPainAmount = pastMonthlyPainAmount || '0'
    faulterName = faulterName || ''
    createdDate = createdDate || ''
    perDayPasNonEconomicDamagesFinalAmount = perDayPasNonEconomicDamagesFinalAmount || '0'
    

    let dollarSign = aggregatedMedicalBills?.map((values, index) =>
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 10, before: 10 }, 
            children: [
                new TextRun({ text: `${index === 0 ? "$" : ""}`, size: 24, font: fontName })
            ],
        }),
    )

    let totalAmount = aggregatedMedicalBills?.map((values, index) =>
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 10, before: 10 }, 
            children: [new TextRun({
                children: [values.totalBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
                size: 24,
                font: fontName 
            }, new Paragraph({})),]
        }))

    let providerName1 = aggregatedMedicalBills?.map((values) => new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 10, before: 10 }, 
        children: [new TextRun({
            children: [values.medicalProviderName + '\n'],
            size: 24,
            font: fontName 
        }, new Paragraph({})),]
    }))

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
                            new Paragraph({ spacing: { after: 10, before: 10 }, children: [new TextRun({ text: "Provider Name", size: 24, bold: true, font: fontName  })] }),
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
                                spacing: { after: 10, before: 10 }, 
                                alignment: AlignmentType.RIGHT, children: [
                                    new TextRun({ text: `${billedAmountHeading ? "Billed" : "Howell"}`, size: 24, font: fontName, bold: true, italics: billedAmountHeading ? false : true }),
                                    new TextRun({ text: " Amount", size: 24, bold: true, font: fontName  })
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
                            new Paragraph({ spacing: { after: 10, before: 10 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: ``, size: 24, bold: true, font: fontName  })] }),
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
                            new Paragraph({ spacing: { after: 10, before: 10 }, children: [new TextRun({ text: "TOTAL", size: 24, bold: true, font: fontName  })] })
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
                            new Paragraph({ spacing: { after: 10, before: 10 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$`, size: 24, bold: true, font: fontName  })] }), // Dynamic content for totalAmount
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
                            new Paragraph({ spacing: { after: 10, before: 10 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, size: 24, bold: true, font: fontName  })] }), // Dynamic content for totalAmount
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

    const medicalSpecialTableDoc = [medicalSpecial, dynamicMedicalSpecialData, medicalSpecialTotal]

    const setttlementDemandTableDoc = [
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
                                    spacing: { after: 10, before: 10 }, 
                                    children: [
                                        new TextRun({
                                            children: [`a) Medical Expenses`],
                                            size: 24, font: fontName 

                                        }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [`b) Future Medical Expenses`],
                                        size: 24, font: fontName 

                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [`c) Past Non-Economic Damages`],
                                        size: 24, font: fontName 

                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [
                                        new TextRun({
                                            children: [`d) Future Non-Economic Damages`],
                                            size: 24, font: fontName 
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
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [`$`],
                                        size: 24, font: fontName 
                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [``],
                                        size: 24, font: fontName 

                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [``],
                                        size: 24, font: fontName 

                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [``],
                                        size: 24, font: fontName 
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
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [`${amount === 'NaN' ? 0 : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                                        size: 24, font: fontName 
                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [``],
                                        size: 24, font: fontName 

                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [pastNonEconomicDamages],
                                        size: 24, font: fontName 

                                    }),]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({
                                        children: [postNonEconomicsDamagesFinalAmount],
                                        size: 24, font: fontName 
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
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({ text: "TOTAL", size: 24, bold: true, font: fontName  })]
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
                                    spacing: { after: 10, before: 10 }, 
                                    children: [new TextRun({ children: [`$`], size: 24, bold: true, font: fontName  })]
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
                                new Paragraph({ spacing: { after: 10, before: 10 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${totalSettlementAmount(amount, postNonEconomicsDamagesFinalAmount, pastNonEconomicDamages)}`, size: 24, bold: true, font: fontName  })] }),
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

    const medicalParagraphs = caseMedicalRecordsParagraphs.length > 0 ? await getProcessedMedicalRecords(caseMedicalRecordsParagraphs) : [new TextRun({text: "No medical records found."})];
    const preMedicalParagraphs = casePreMedicalRecordsParagraphs.length > 0 ? await getProcessedMedicalRecords(casePreMedicalRecordsParagraphs) : [new TextRun({text: "No prior medical records found."})];

    try {
        const patchTheDocument = async (data) => await patchDocument(data, {
            patches: {
                clientname: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientName}` })]
                },

                Clientname: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientName}` })]
                },

                clientFullName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientFullName}` })],
                },

                CLIENTFULLNAME: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientFullName.toUpperCase()}` })],
                },

                clientProfession: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientProfession}` })],
                },

                monthsDifference: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${monthsDifference}` })],
                },

                his_her: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${his_her}` })],
                },

                he_she: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${he_she}` })],
                },

                him_her: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${him_her}` })],
                },

                MissedWorkHours: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${MissedWorkHours}` })],
                },



                lossofIncomeCalculatedAmount: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${lossofIncomeCalculatedAmount}` })],
                },

                HourlyWorkingRate: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${HourlyWorkingRate}` })],
                },

                Age: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${age}` })],
                },

                postNonEconomicsDamagesFinalAmount: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${postNonEconomicsDamagesFinalAmount}` })],
                },

                perDayAmountForFutureNonEconomicDamages: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${perDayAmountForFutureNonEconomicDamages}` })],
                },

                FutureYearlyPainAmount: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${FutureYearlyPainAmount}` })],
                },

                lifeExpectancyAge: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${lifeExpectancyAge}` })],
                },

                pastNonEconomicDamages: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${pastNonEconomicDamages}` })],
                },

                pastMonthlyPainAmount: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${pastMonthlyPainAmount}` })],
                },

                FaulterName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${faulterName}` })]
                },

                AccidentDate: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${accidentDate}` })]
                },

                perDayPastNonEconomicDamagesFinalAmount: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${perDayPasNonEconomicDamagesFinalAmount}` })]
                },

                currentDate: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${createdDate}` })]
                },

                defAdjusterName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defAdjusterName}` })]
                },
                
                defInsuranceName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defInsuranceName}` })]
                },
                
                defAdjusterAddress: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defAdjusterAddress}` })]
                },
                
                defAdjusterCity: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defAdjusterCity}` })]
                },

                defAdjusterState: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defAdjusterState}` })]
                },

                defAdjusterZip: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defAdjusterZip}` })]
                },

                clientAdjusterName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientAdjusterName}` })]
                },
                
                clientInsuranceName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientInsuranceName}` })]
                },

                clientAdjusterAddress: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientAdjusterAddress}` })]
                },

                clientAdjusterCity: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientAdjusterCity}` })]
                },
                
                clientAdjusterState: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientAdjusterState}` })]
                },
                
                clientAdjusetrZip: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientAdjusetrZip}` })]
                },
                
                defClaimNumber: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defClaimNumber}` })]
                },

                clientClaimNumber: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${clientClaimNumber}` })]
                },
                
                defInsuranceLastName: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({ text: `${defInsuranceLastName}` })]
                },

                //  // ------------------------document patches start from here------------------- //   // 

                executiveSummary: {
                    type: PatchType.PARAGRAPH,
                    children: executiveSummaryDoc.filter(x => x.length)
                    .flatMap((value, index, array) => {
                        const textRun = new TextRun({
                            text: value,
                        });
                        
                        // If not the last paragraph, add a line break
                        if (index < array.length - 1) {
                            return [new TextRun({ text: "\t" }), textRun, new TextRun({ text: "\t" }), new TextRun({ break: 1 })];
                        }
                        return [new TextRun({ text: "\t" }), textRun, new TextRun({ text: "\t" })];
                    }) || []
                },

                priorMedicalRecordsDetails: {
                    type: PatchType.PARAGRAPH,
                    children: preMedicalParagraphs || []
                },

                medicalRecordsDetails: {
                    type: PatchType.PARAGRAPH,
                    children: medicalParagraphs || []
                },

                LLMLiabilityDescription: {
                    type: PatchType.PARAGRAPH,
                   children: llmLibilityDescriptionDoc ? [new TextRun({ text: "\t" }), new TextRun({ text: llmLibilityDescriptionDoc })] : []
                },

                propertyDamageHyperlinkSentence: {
                    type: PatchType.PARAGRAPH,
                    children: propertyDamageHyperlinkSentenceDoc < 0 ? [] : [new TextRun('Copies of the property damage photographs are attached as '), new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: `EXHIBIT ${propertyDamageHyperlinkSentenceDoc}.`,
                                            bold: true,
                                            color: '0563C1',
                                            size: 24,
                                            style: "Hyperlink",
                                        }),
                                    ],
                                    anchor: "accidentPhotosExhibitId",
                                })]
                },

                propertyDamageHyperlinkSentenceBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'Exhibit5Id',
                                    children: [new TextRun('‎')]
                                })
                            ]
                        })
                    ]
                },

                propertyDamagePhotos: {
                    type: PatchType.DOCUMENT,
                    children: selectedAccidentFilesDoc || []
                },

                settlementDemandTable: {
                    type: PatchType.DOCUMENT,
                    children: [...setttlementDemandTableDoc] || []
                },

                bodilyInjuryPhotos: {
                    type: PatchType.DOCUMENT,
                    children: selectedBodyInjuryFilesArr || []
                },

                bodilyInjuryHyperlinks: {
                    type: PatchType.PARAGRAPH,
                    children: bodyInjryPhotoHyperlinkNumber < 0 ? [] : [new TextRun('The bodily injury photographs are inserted above and attached as '), new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: `EXHIBIT ${bodyInjryPhotoHyperlinkNumber}.`,
                                            bold: true,
                                            color: '0563C1',
                                            size: 24,
                                            style: "Hyperlink",
                                        }),
                                    ],
                                    anchor: "bodyInjuryExhibitLinkId",
                                })]
                },

                bodilyInjuryHyperlinksBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'Exhibit6Id',
                                    children: [new TextRun('‎')]
                                })
                            ]
                        })
                    ]
                },

                painAndSuffering: {
                    type: PatchType.PARAGRAPH,
                    children: llmPainAndSufferingDoc.filter(x => x.length)
                    .flatMap((value, index, array) => {
                        const textRun = new TextRun({
                            text: value,
                        });
                        
                        // If not the last paragraph, add a line break
                        if (index < array.length - 1) {
                            return [new TextRun({ text: "\t" }), textRun, new TextRun({ text: "\t" }), new TextRun({ break: 2 })];
                        }
                        return [new TextRun({ text: "\t" }), textRun, new TextRun({ text: "\t" })];
                    }) || []
                },

                medicalSpecialsTable: {
                    type: PatchType.DOCUMENT,
                    children: [...medicalSpecialTableDoc] || []
                },

                 //  // ------------------------Exhibit sentence link -------------------

                policeReportLinkSentence: {
                    type: PatchType.PARAGRAPH,
                    children: policeReportHyperlinkNumber < 0 ? [] : [new TextRun('A copy of the Traffic Collision report is attached as '), new InternalHyperlink({
                        children: [
                            new TextRun({
                                text: `EXHIBIT ${policeReportHyperlinkNumber}.`,
                                bold: true,
                                color: '0563C1',
                                size: 24,
                                style: "Hyperlink",
                            }),
                        ],
                        anchor: "policeExhibitId",
                    })]
                },

                policeReportLinkSentenceBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'Exhibit1Id',
                                    children: [new TextRun('‎ ')]
                                })
                            ]
                        })
                    ]
                },

                preMedicalRecordLinkSentence: {
                    type: PatchType.PARAGRAPH,
                    children: preMedicalHyperlinkNumber > 0 && casePreMedicalRecordsParagraphs?.length > 0 ? [
                        new TextRun('Copies of prior medical records are attached as '),
                        new InternalHyperlink({
                            children: [
                                new TextRun({
                                    text: `EXHIBIT ${preMedicalHyperlinkNumber}.`,
                                    bold: true,
                                    color: '0563C1',
                                    size: 24,
                                    style: "Hyperlink",
                                }),
                            ],
                            anchor: "preMedicalRecordsExhibitId",
                        })] : []
                },

                preMedicalRecordLinkSentenceBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'preMedicalRecordsExhibitAnchor',
                                    children: [new TextRun('‎')]
                                })
                            ]
                        })
                    ]
                },

                medicalRecordLinkSentence: {
                    type: PatchType.PARAGRAPH,
                    children: medicalHyperlinkNumber > 0 && caseMedicalRecordsParagraphs?.length > 0 ? [
                        new TextRun('Copies of medical records are attached as '),
                        new InternalHyperlink({
                            children: [
                                new TextRun({
                                    text: `EXHIBIT ${medicalHyperlinkNumber}.`,
                                    bold: true,
                                    color: '0563C1',
                                    size: 24,
                                    style: "Hyperlink",
                                }),
                            ],
                            anchor: "medicalRecordExhibitId",
                        })] : []
                },

                medicalRecordLinkSentenceBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'Exhibit3Id',
                                    children: [new TextRun('‎')]
                                })
                            ]
                        })
                    ]
                },

                lossOfEarningsLinkSentence: {
                    type: PatchType.PARAGRAPH,
                    children: lossOfEarningsHyperlinkNumber > 0 ? [
                        new TextRun('Copies of the relevant loss of earnings documents are attached as '),
                        new InternalHyperlink({
                            children: [
                                new TextRun({
                                    text: `EXHIBIT ${lossOfEarningsHyperlinkNumber}.`,
                                    bold: true,
                                    color: '0563C1',
                                    size: 24,
                                    style: "Hyperlink",
                                }),
                            ],
                            anchor: "lossOfIncomeExhibitId",
                        })] : []
                },

                lossOfEarningsLinkSentenceBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'lossOfEarningsExhibit',
                                    children: [new TextRun('‎')]
                                })
                            ]
                        })
                    ]
                },

                futureExpensesLinkSentence: {
                    type: PatchType.PARAGRAPH,
                    children: futureExpenseHyperlinkNumber > 0 ? [
                        new TextRun(`Copies of ${clientFullName}'s future medical expenses are attached as `),
                        new InternalHyperlink({
                            children: [
                                new TextRun({
                                    text: `EXHIBIT ${futureExpenseHyperlinkNumber}.`,
                                    bold: true,
                                    color: '0563C1',
                                    size: 24,
                                    style: "Hyperlink",
                                }),
                            ],
                            anchor: "medicalExpensesExhibitPathsId",
                        })] : []
                },

                futureExpensesLinkSentenceBookmark:{
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [
                                new Bookmark({
                                    id: 'medicalExpensesExhibit',
                                    children: [new TextRun('‎')]
                                })
                            ]
                        })
                    ]
                },

                //  // ------------------------Exhibit start -------------------

                policeReportExhibits: {
                    type: PatchType.DOCUMENT,
                    children: policeReportExhibitSectionDoc || []
                },

                accidentsExhibits: {
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [new PageBreak()]
                        }),
                        ...acciedentFileExhibitSectionDoc
                    ] || []
                },

                preMedicalRecordsExhibits: {
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [new PageBreak()]
                        }),
                        ...preMedicalRecordExhibitSectionDoc
                    ] || []
                },

                medicalRecordsExhibits: {
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [new PageBreak()]
                        }),
                        ...medicalRecordExhibitSectionDoc
                    ] || []
                },

                bodilyInjuryExhibit: {
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [new PageBreak()]
                        }),
                        ...bodilyInjuryExhibitSectionDoc
                    ] || []
                },

                lossOfEarningsExhibit: {
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [new PageBreak()]
                        }),
                        ...lossOfIncomeExhibitSectionDoc
                    ] || []
                },

                futureExpenseExhibit: {
                    type: PatchType.DOCUMENT,
                    children: [
                        new Paragraph({
                            children: [new PageBreak()]
                        }),
                        ...futureExpenseExhibitSectionDoc
                    ] || []
                },

                //  // ------------------------Exhibit end  -------------------

            },

            keepOriginalStyles: true
        })

        // Patch the document a first time:
        let patchedDocxTemplate = await patchTheDocument(templateFile)
        for (let i = 0; i < 10; i++) { //why 10 here??
            patchedDocxTemplate = await patchTheDocument(Buffer.from(patchedDocxTemplate))
        }

        // fs.writeFileSync(`output.docx`, patchedDocxTemplate);

        return patchedDocxTemplate

    } catch (e) {
        console.log(e)
    }
}

const getProcessedMedicalRecords = async (values) => {
    if (!values) {
        return [new TextRun("")];
    }

    const paragraphs = values.split('\n')
        .map(para => para.trim())
        .filter(para => para.length > 0);

    let allChildren = [];
    let previousWasBullet = true;

    for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i];
        const isBullet = text.startsWith('•') || text.startsWith('-');

        if (isBullet) {
            // If this is a bullet point
            if (previousWasBullet) {
                // If previous line was also a bullet, use break: 1
                allChildren.push(new TextRun({ break: 1 }));
            } else {
                // If previous line was not a bullet, use break: 2 for the first bullet
                allChildren.push(new TextRun({ break: 2 }));
            }
            
            // Add the bullet point and its text

            allChildren.push(
                new TextRun({
                    text: "     \u2022",
                    bold: true,
                })
            );

            allChildren.push(
                new TextRun({
                    text: "     ",
                }),
            );

            allChildren.push(
                new TextRun({
                    text: text.substring(1).trim(),
                })
            );

            allChildren.push(
                new TextRun({
                    text: "\t",
                })
            );
            
            previousWasBullet = true;
        } else {
            // For non-bullet paragraphs
            if (i > 0) {
                allChildren.push(new TextRun({ break: 2 }));
            }

            allChildren.push(
                new TextRun({
                    text: "\t",
                })
            );

            allChildren.push(
                new TextRun({
                    text: text,
                })
            );
            
            if (i < paragraphs.length-1) {
                allChildren.push(
                    new TextRun({
                        text: "\t",
                    })
                );
            }
            
            previousWasBullet = false;
        }
    }

    return allChildren;
};

module.exports = { createAndSaveTemplateReportWord }