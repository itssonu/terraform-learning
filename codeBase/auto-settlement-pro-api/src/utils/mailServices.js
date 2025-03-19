const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const handlebars = require('handlebars');
const config = require('./config.js');
const fs = require('fs');
var readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
            callback(err);
            throw err;

        }
        else {
            callback(null, html);
        }
    });
};

const MailService = (myobj, status) => {
    const configMailOptions = config.mailOptions;
    const url = `${process.env.BASE_URL}/account/reset-password?token=${myobj?.token}`;
    readHTMLFile(
        __dirname +
        `/../resources/emailTemplates/forgot-password.html`,
        function (err, html) {
            var template = handlebars.compile(html);
            const htmlToSend = template({ url });
            const mailOptions = {
                ...configMailOptions,
                subject: myobj.subjectOfEmail,
                to: myobj.email,
                html: htmlToSend,
            };
            sgMail
                .send(mailOptions)
                .then((response) => {
                    console.log("[INFO INDIVIDUAL]: ", response);
                    return response;
                })
                .catch((error) => {
                    console.error("[ERROR INDIVIDUAL]: ", error);
                    return error;
                });

        }
    );
};



const DemadLetterMailService = (myobj, status) => {
    const configMailOptions = config.mailOptions;
    const pdfurl = `${process.env.SERVER_URL}/pdf/${myobj?.pdfUrl}`
    const wordurl = `${process.env.SERVER_URL}/wordDoc/${myobj?.wordUrl}`

    readHTMLFile(
        __dirname +
        `/../resources/emailTemplates/demand-letter-link.html`,
        function (err, html) {
            var template = handlebars.compile(html);
            const htmlToSend = template({ pdfurl, wordurl });
            const mailOptions = {
                ...configMailOptions,
                subject: myobj.subjectOfEmail,
                to: myobj.email,
                html: htmlToSend,
            };
            sgMail
                .send(mailOptions)
                .then((response) => {
                    console.log("[INFO INDIVIDUAL]: ", response);
                    return response;
                })
                .catch((error) => {
                    console.error("[ERROR INDIVIDUAL]: ", error);
                    return error;
                });
        }
    );
};

const OnBoardingConnectMail = (myobj) => {
    const configMailOptions = config.mailOptions;
    const userName = myobj.username
    const password = myobj.password
    const url = myobj.url
    const email = myobj.email
    const supportEmail = "support@demandpro.ai"

    readHTMLFile(
        __dirname +
        `/../resources/emailTemplates/companyCreation-letter.html`,
        function (err, html) {
            var template = handlebars.compile(html);
            const htmlToSend = template({ userName, password,email, url, supportEmail});
            const mailOptions = {
                ...configMailOptions,
                subject: "Welcome to DemandPro AI: Elevate Your Company with Intelligent Solutions - Your Onboarding Journey Begins!",//myobj.subjectOfEmail,
                to: email,//myobj.email,
                html: htmlToSend,
            };
            sgMail
                .send(mailOptions)
                .then((response) => {
                    console.log("[INFO INDIVIDUAL]: ", response);
                    return response;
                })
                .catch((error) => {
                    console.error("[ERROR INDIVIDUAL]: ", error);
                    return error;
                });
        }
    );
}

module.exports = { MailService, DemadLetterMailService, OnBoardingConnectMail };   
