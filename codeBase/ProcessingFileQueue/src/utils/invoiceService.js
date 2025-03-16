const pdf = require("pdf-creator-node");
const fs = require("fs");
const fsExtra = require('fs-extra')
const moment = require('moment');
const { s3Client } = require("./aws/client");

const InvoiceService = async (userId, caseID, caseName, date, s3UniqueId, price, domainName, companyName, address) => {
    const pdfPath = `${__dirname}/../../public/invoices/${userId}/${s3UniqueId}/invoice.pdf`;
    const companyLogo = fs.readFileSync(`${__dirname}/../../logo/demandPro.png`).toString('base64');
    let address1 = address.split(",")[0]
    let address2 = address.split(",")[1]
    let address3 = address.split(",")[2]

    try {

        const html = fs.readFileSync(`${__dirname}/../../public/invoiceTemplate.html`, "utf8");
        const document = {
            html: html,
            data: {
                companyLogo: companyLogo ? `data:image/png;base64,${companyLogo}` : "",
                caseName,
                caseID,
                description: "Medical Record Summary",
                date: moment(date).format("MM/DD/YYYY"),
                price,
                companyName,
                address1,
                address2,
                address3
            },
            path: pdfPath,
            type: "",
        };

        await pdf.create(document, { format: "A4" });

        const pdfData = fs.readFileSync(pdfPath);

        // Upload PDF to S3
        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${domainName}/${userId}/${s3UniqueId}/invoice/invoice.pdf`,
            Body: pdfData,
            ContentType: 'application/pdf',
        };

        const uploadResult = await s3Client.upload(s3Params).promise();
        await fsExtra.remove(`${__dirname}/../../public/invoices/${userId}/${s3UniqueId}`);

        return uploadResult.Key;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = InvoiceService;