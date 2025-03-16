const mongoose = require('mongoose')

const SettingSchema = new mongoose.Schema({
    template: {
        firmName: {
            type: String,
            default: ''
        },
        firmAddress: {
            type: String,
            default: ''
        },
        attorneyName: {
            type: String,
            default: ''
        },
        attorneyEmail: {
            type: String,
            default: ''
        },
        companyLogo: {
            type: String,
            default: ''
        },
        billedAmountHeading: {
            type: Boolean
        },
        fontFamily: {
            type: String
        },
    },

    isDefault: {
        type: Boolean,
        default: true,
        unique: true
    }
}, { timestamps: true });


SettingSchema.statics.getSettings = async function () {
    const settings = await this.findOne({ isDefault: true });
    return settings;
};

SettingSchema.statics.updateSettings = async function (templateData) {
    return await this.findOneAndUpdate(
        { isDefault: true },
        { template: templateData },
        { new: true, upsert: true }
    );
};

module.exports = SettingSchema
