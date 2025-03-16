const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path')
const PDFTable = require('voilab-pdf-table');
const imagePath = path.join(__dirname, '../../logo/Eastonlogo.JPG');
const createAndSaveSettlementReportPdf = (baseUrl, victimName, liability, conclusion, medicalRecords, icdCodes, policeReport, lossOfincome, medicalBillRecords, nonEconomicalDamage, injuryPhoto, accidenPhoto) => {
    let icdCodesKeys = [];
    let icdCodesValues = [];
    let quotedValue = [];
    let total_Bill = 0;
    icdCodes?.forEach(item => {
        // if (item?.key !== null) {
        //     console.log("Keys:");
        //     item?.key?.forEach((Value, index) => {
        //         icdCodesKeys = [...icdCodesKeys, ...index + '\n']
        //         console.log(`Index ${index}: ${Value}`);
        //     });
        // }

        // console.log("Values:");
        item?.values?.forEach((value, index) => {
            icdCodesValues = [...icdCodesValues, ...value + '\n']
            // console.log(`Index ${index}: ${value}`);
        });

        console.log("\n"); // Separate each object for clarity
    });

    let name = victimName;
    const doc = new PDFDocument();


    const fileName = `${name}-Settlement-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, `../.././public/pdf/${fileName}`);
    const x6 = 310;
    const table = new PDFTable(doc, { bottomMargin: 30 });
    const medicalBilltable = new PDFTable(doc, { bottomMargin: 30 });
    const pdf = table.pdf;
    let providerName = JSON.parse(medicalBillRecords)?.map((values) => values.providerName).join('\n')
    let totalAmountfromUploadedBills = JSON.parse(medicalBillRecords)?.map((values) => values.totalBillAmount).join('\n')
    let amount = calculateTotalBill(totalAmountfromUploadedBills, total_Bill)
    let totalAmount = JSON.parse(medicalBillRecords)?.map((values) => '$' + totalAmountOfBill(values.totalBillAmount, quotedValue)).join('\n')
    //totalAmountOfBill(totalAmount)
    const accidentPhotoImageRecord = accidenPhoto?.map(image => path.join(__dirname, image.replace(/^\.\//, "../../../").replace('/./', '/')))
    const injuryPhotoImageRecord = injuryPhoto?.map(image => path.join(__dirname, image.replace(/^\.\//, "../../../").replace('/./', '/')))
    doc.pipe(fs.createWriteStream(filePath));

    try {
        doc
            .fontSize(8).text(`
        W. DOUGLAS EASTON
        BRIAN W. EASTON
        MATTHEW D. EASTON
        TRAVIS R. EASTON
        GABRIEL M. MENDOZA
        BRENDA KOCAJ
        ANNIE C. LU
        MANI S. NAVAB
        AARON S. SINFIELD
        `, 60, 40)
            .image(imagePath, 200, -40, { fit: [200, 200], align: 'center', valign: 'center', width: 280, height: 100 }).moveDown()

            .fontSize(6)
            .text(`
        650 TOWN CENTER DRIVE
        SUITE 1850
        COSTA MESA, CALIFORNIA 92626
        `, 60, 90, { align: 'center' }).moveDown()

            .fontSize(5)
            .text(`
        TELEPHONE  (714) 850-4590
        FACSIMILE  (714) 850-1978
        EMAIL  mailto:info@eastonlawfirm.com
        WEBSITE  https://www.eastonlawfirm.com
        _____________
        
        mailto:deaston@eastonlawfirm.com
        mailto:beaston@eastonlawfirm.com
        mailto:mdeaston@eastonlawfirm.com
        mailto:teaston@eastonlawfirm.com
        mailto:gmendoza@eastonlawfirm.com
        mailto:bkocaj@eastonlawfirm.com
        mailto:alu@eastonlawfirm.com
        mailto:mnavab@eastonlawfirm.com
        mailto:asinfield@eastonlaw.firm.com
        `, 400, 40, { align: 'center' }).moveDown()



            //Liability
            .font('Times-Bold')
            .fontSize(16).text('Liability', 80, 170, { align: 'center' }).moveDown()
            .font('Times-Roman')
            .fontSize(11).text(liability, 80, 200, { align: "justify" }).moveDown().addPage()
        // accidentPhotoImageRecord?.forEach((imagePath) => {
        //     if (imagePath !== null) {
        //         doc.image(imagePath).moveDown().addPage();
        //     }
        // }

        // )
        //Injury Photo 
        // if (injuryPhotoImageRecord !== null) {
        //     doc.fontSize(16).text('Injury Photo', 100, 110, { align: 'center' }).moveDown()
        //     injuryPhotoImageRecord?.forEach((imagePath) => {
        //         if (imagePath !== null) {
        //             doc.image(imagePath).moveDown().addPage();
        //         }
        //     })
        // }
        //Medical Records

        if (medicalRecords || icdCodes) {
            doc
                .image(imagePath, 70, 20, { width: 100, height: 40 }).moveDown()
                .font('Times-Bold')
                .fontSize(16).text('Medical Records', 100, 75, { align: 'center' }).moveDown()
                .font('Times-Roman')
            //  .fontSize(11).text(data, 120, 160).moveDown()

            let count = 0;
            for (var i = 0; i < medicalRecords.length; i++) {
                medicalRecords[i]?.map(subArray => {
                    // console.log(subArray);
                    if (count === 0) {
                        doc.font('Times-Bold')
                            .fontSize(16).text('Treatment', 70, 100, { lineGap: 3, align: 'justify' }).moveDown()
                    }
                    count += count + 1

                    const treatmentTimeLine = subArray.treatmentDates.map((values) => values.date)
                    const medicalVistis = parseInt(treatmentTimeLine.length)
                    const treatmentDate = treatmentTimeLine.length > 1 ? `${treatmentTimeLine[0]} - ${treatmentTimeLine[treatmentTimeLine.length - 1]}` : `${treatmentTimeLine[0]}`
                    if (subArray.name) {
                        doc.font('Times-Bold').fillColor('black').fontSize(11).text("Medical Provider Name : ", { align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text(subArray.name.replace(/'/g, '')).moveDown()
                    } else {
                        doc.font('Times-Bold').fillColor('red').fontSize(11).text("Medical Provider Name : ", { align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text('No-Data').moveDown()
                    }

                    if (treatmentTimeLine.length) {
                        doc.font('Times-Bold').fillColor('black').fontSize(11).text("Treatment Timeline : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text(treatmentDate).moveDown()
                    } else {
                        doc.font('Times-Bold').fillColor('red').fontSize(11).text("Treatment Timeline : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text('No-Data').moveDown()
                    }
                    if (medicalVistis) {
                        doc.font('Times-Bold').fillColor('black').fontSize(11).text("Medical Visits : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text(medicalVistis).moveDown()
                    } else {
                        doc.font('Times-Bold').fillColor('red').fontSize(11).text("Medical Visits : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text('No-Data').moveDown()
                    }

                    if (subArray.objectFindings) {
                        doc.font('Times-Bold').fillColor('black').fontSize(11).text("Objective Summary : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text(subArray.objectFindings).moveDown()
                    } else {
                        doc.font('Times-Bold').fillColor('red').fontSize(11).text("Objective Summary : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text('No-Data').moveDown()
                    }
                    doc.font('Times-Bold').fillColor('black').fontSize(11).text("Treatment Summary : ", { lineGap: 3, align: 'justify', continued: true }).font('Times-Roman').fontSize(11).text('').moveDown().moveDown()
                    subArray.treatmentDates.map((values) => {
                        doc.font('Times-Bold').fontSize(11).text(`${values.date} : `, { lineGap: 3, align: 'justify', continued: true })
                        doc.font('Times-Roman').fontSize(11).text(values.
                            treatmentDescription).moveDown()
                    })


                });
            }
            // if (medicalBillRecords.length === 1) {
            //     doc.moveDown().addPage()
            // }
            // console.log(medicalBillRecords.length)
            pdf.fontSize(11)
            const headerColor = '#FF0000';
            table.addHeader();
            table
                .addPlugin(
                    new (require("voilab-pdf-table/plugins/fitcolumn"))({
                        column: "description",
                        width: 10

                    }),
                    new (require("voilab-pdf-table/plugins/fitcolumn"))({
                        column: "quantity",
                        width: 80

                    }),
                )


            table.setColumnsDefaults({
                headerHeight: 20,
                headerBorder: ['T', 'B', 'R', 'L'],
                headerPadding: [5, 5, 5, 5],
                color: 'white',
                align: "center",
                valign: 'center',
                border: ['L', 'T', 'B', 'R'],
                padding: [5, 5, 5, 5],
                height: 40


            })

            table.addColumns([
                // {
                //     id: "quantity",
                //     header: "ICDCode",
                //     width: 90,
                //     height: 30,
                //     align: "center"

                // },
                {
                    id: "description",
                    header: "Injury/Diagonsis",
                    width: 10,
                    height: 30,
                    align: "left",
                    color: 'white',
                    background: "black"

                }

            ])

            // quantity: icdCodesKeys?.join(''),
            const description = icdCodesValues.join('').split('\n')
            const removeDuplicateDescription = [...new Set(description)]
            if (removeDuplicateDescription) {
                table.addBody([{ description: removeDuplicateDescription.join('\n') }]);
            }

            doc.moveDown().addPage()
        }

        //  medicalBillRecordSection(doc, table, formattedMedicalBills)
        doc.image(imagePath, 70, 30, { width: 100, height: 40 }).moveDown()
            .font('Times-Bold')
            .fontSize(16).text('Non-Economic Damages', 100, 100, { align: 'center' }).moveDown()
            .font('Times-Roman')
            .fontSize(11).text(`${nonEconomicalDamage?.replace(/\t/g, ' ')}`, 70, 130, { align: 'justify' }).moveDown().addPage()
        // nonEconomicalDamage.replace(/\t/g, ' ')


        doc
            .image(imagePath, 70, 30, { width: 100, height: 40 }).moveDown()
            .font('Times-Bold')
            .fontSize(16).text('Medical Specials', 100, 80, { align: 'center' }).moveDown()
            .font('Times-Roman')

        pdf.fontSize(11)
        medicalBilltable.addHeader();


        medicalBilltable.setColumnsDefaults({
            headerHeight: 20,
            headerBorder: ['T', 'B', 'R', 'L'],
            headerPadding: [5, 5, 5, 5],
            color: 'white',
            align: "center",
            valign: 'center',
            border: ['L', 'T', 'B', 'R'],
            padding: [5, 5, 5, 5],
            height: 500


        })

        medicalBilltable.addColumns([

            {
                id: "providerName",
                header: "Provider Name",
                width: 350,
                height: 30,
                align: "left",
                color: 'white',
                background: "black"

            },
            {
                id: "totalAmount",
                header: "Billed Amount",
                width: 100,
                height: 30,
                align: "left",
                color: 'white',
                background: "black"

            }

        ])

        //add events (here, we draw headers on each new page)
        medicalBilltable.onPageAdded(function (tb) {
            tb.addHeader();
        });

        medicalBilltable.addBody([{
            providerName: providerName,
            totalAmount: totalAmount
        }]);
        // doc.fontSize(11).text('Total :', parseFloat(amount)).moveDown().addPage()

        doc.fontSize(16).text('', 100, 80, { align: 'center' }, { align: "justify" }).
            moveDown().addPage();


        doc
            .image(imagePath, 70, 30, { width: 100, height: 40 }).moveDown()
            .font('Times-Bold')
            .fontSize(16).text(`Loss of Earning's`, 100, 80, { align: 'center' }, { align: "justify" }).moveDown()
            .font('Times-Roman')
            .fontSize(11).text(lossOfincome, 80, 110, { align: 'justify' }).moveDown().addPage()

        //Conclusion
        doc
            .image(imagePath, 70, 30, { width: 100, height: 40 }).moveDown()
            .font('Times-Bold')
            .fontSize(16).text('Conclusion', 100, 80, { align: 'center' }, { align: "justify" }).moveDown()
            .font('Times-Roman')
            .fontSize(11).text(conclusion, 80, 110, { align: 'justify' }).moveDown()

        //end    

        doc.end();

        return `${baseUrl}/pdf/${fileName}`;
    } catch (err) {
        console.log(err)
    }
}


const totalAmountOfBill = (totalAmount, quotedValue) => {
    const amountValue = totalAmount.split('\n');
    for (var i = 0; i < amountValue.length; i++) {
        const convertedAmount = parseInt(totalAmount)
        const finalValues = convertedAmount.toLocaleString();
        quotedValue = [...quotedValue, ...finalValues]
    }

    return quotedValue.join('');
}


const calculateTotalBill = (totalAmount, total_Bill) => {
    const amountValue = totalAmount.split('\n');
    for (var i = 0; i < amountValue.length; i++) {
        const convertedAmount = parseInt(amountValue[i])
        total_Bill = total_Bill += convertedAmount;
    }
    const amount = '$' + total_Bill.toLocaleString();
    return amount;
}




module.exports = { createAndSaveSettlementReportPdf }