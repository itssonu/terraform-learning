const path = require('path');
const sgMail = require('@sendgrid/mail');
const { s3Client } = require('./aws/client');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email sending function
const sendInvoiceMail = async (mailReceiver, pdfFilePath) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: pdfFilePath,
        };

        const s3Object = await s3Client.getObject(params).promise();
        const pdfBase64 = s3Object.Body.toString("base64");

        const msg = {
            to: mailReceiver,
            from: process.env.SENDGRID_EMAIL_SENDER,
            subject: 'Demand pro Invoice',
            text: 'Demand pro Invoice',
            attachments: [
                {
                    content: pdfBase64,
                    filename: path.basename(pdfFilePath),
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ],
        };
        const info = await sgMail.send(msg);
        console.log("msg", info)
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendInvoiceMail }