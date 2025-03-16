module.exports = {
    mailOptions: {
        // from: 'eastonapp2023@gmail.com',
        from: process.env.SENDGRID_EMAIL_SENDER,
        to: 'to@email.com',
        subject: 'Subject of your email',
        html: '<p>Your html here</p>'
    },
    emailconfig: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: true,
        service: 'gmail',
        auth: {
            user: 'eastonapp2023@gmail.com',
            pass: 'pqvfombxhrtfvjxo'
        },
    },
    saltRound: 10,
    subscription: {
        costPerAdditionalDemand: 300,
        costPerAdditionalUser: 50
    }

}
// eastonapp2023@gmail.com