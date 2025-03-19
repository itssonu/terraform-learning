const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');
const { subscription } = require('../../utils/config');

const subscriptionSchema = new mongoose.Schema({
    monthlyPrice: { type: Number, required: true },
    demandsPerMonth: { type: Number, required: true },
    usersLimit: { type: Number, required: true },
    costPerAdditionalUser: { type: Number, default: subscription.costPerAdditionalUser },
    costPerAdditionalDemand: { type: Number, default: subscription.costPerAdditionalDemand },
    subscriptionRenewalDate: { type: Date },
    remainingDemand: { type: Number, default: 0 },
    remainingUser: { type: Number, default: 0 },
    rollOverCredits: { type: Number, default: 0 },
    totalAlaCarteCases: { type: Number, default: 0 }, 
});


const CompaniesSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required.'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required.'],
    },
    companyName: {
        type: String,
        required: [true, 'Last name is required.'],
    },
    companyAddress: {
        type: String,
        required: [true, 'Last name is required.'],
    },
    companyPhoneNumber: {
        type: String,
        required: [true, 'Mobile number is required.'],
        // unique: [true, 'Mobile number is already registered!']
    },
    domainName: {
        type: String,
        default: "",
        // required: [true, 'domain Nmae is required.'],
        // unique: [true, 'domain Nmae is already registered!']
    },
    taxiationID: {
        type: String,
        // required: [true, 'taxiation ID is required.'],
        // unique: [true, 'taxiation ID is already registered!']
    },
    contactNumber: {
        type: String,
        required: [true, 'Mobile number is required.'],
        // unique: [true, 'Mobile number is already registered!']
    }, accountantname: {
        type: String,
    },
    accountantemail: {
        type: String,
        index: true,
    },
    contactEmail: {
        type: String,
        required: [true, 'Email is required.'],
        index: true,
        unique: [true, 'Email is already registered!']
    },
    dataBasePassword: {
        type: String,
        required: [true, 'Password is required.']
    },
    isSuperAdmin: {
        type: Boolean,
        default: true
    },
    companyLogo: {
        type: String,
        default: ""
    },
    resetTokenExpiry: {
        type: Date
    },
    resetToken: {
        type: String
    },
    resetPassword: {
        type: Boolean,
        default: false,
    },
    subscription: subscriptionSchema,
})

CompaniesSchema.plugin(uniqueValidator);
CompaniesSchema.pre('save', function (next) {
    if (!this.isModified('password')) {
        // If password field is not being modified, move to the next middleware
        return next();
    }

    if (!this.resetPassword) {
        // If resetPassword flag is not set, hash the password
        bcrypt
            .hash(this.password, Number(process.env.BCRYPT_HASH))
            .then((hash) => {
                this.password = hash;
                next();
            })
            .catch((err) => {
                next(err);
            });
    } else {
        // If resetPassword flag is set, move to the next middleware without hashing
        next();
    }
});
// const Companies = mongoose.model(
//     'Companies',
//     CompaniesSchema
// )

// module.exports = Companies;

CompaniesSchema.statics.deductDemands = async function (domainName, demandsUsed = 1) {
    const company = await this.findOne({ domainName });

    if (!company) {
        throw new Error('Company not found');
    }

    const update = {};

    if (demandsUsed > 0) {
        if (company.subscription.rollOverCredits >= demandsUsed) {
            update['$inc'] = {
                'subscription.rollOverCredits': -demandsUsed
            };
        } else {
            const remainingDemandToDeduct = demandsUsed - company.subscription.rollOverCredits;
            update['$inc'] = {
                'subscription.rollOverCredits': -company.subscription.rollOverCredits,
                'subscription.remainingDemand': -remainingDemandToDeduct
            };
        }
    }

    await this.updateOne({ domainName }, update);
    return this.findOne({ domainName });
};

CompaniesSchema.statics.deductUsers = async function (domainName, usersUsed = 1) {
    const company = await this.findOne({ domainName });

    if (!company) {
        throw new Error('Company not found');
    }

    const update = {
        $inc: {
            'subscription.remainingUser': -usersUsed
        }
    };

    await this.updateOne({ domainName }, update);
    return this.findOne({ domainName });
};

module.exports = CompaniesSchema;