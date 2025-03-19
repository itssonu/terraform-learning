// const User = require("../db/models/User");
const UserSchema = require("../db/models/User");
const BaseController = require('./BaseController');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs')
const { MailService, DemadLetterMailService } = require("../utils/mailServices");
const mongoose = require("mongoose");
const dbConn = require('../db/dbConnection');
const UserRecordSchema = require("../db/models/userRecords");
const { useDB } = require("../utils/dbUtil");
const { verifyHashPassword, createJwtToken,verifyToken } = require("../utils/authHelper");
const { getCompanyDetail } = require("../utils/dbHelper");
var AWS = require('aws-sdk');
const s3 = new AWS.S3();
const jwt = require("jsonwebtoken");
class UserController extends BaseController {

    static async generateAuthToken(user) {
        try {
            const domainName = user?.domainName
            const company = await getCompanyDetail({ domainName });

            const userData = {
                id: user?._id,
                email: user?.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin,
                isSuperAdmin: user.isSuperAdmin,
                domainName: domainName,
                subscription: company?.subscription,
                role: user?.role,
                profilepic: user?.profilepic
            };
            const token = createJwtToken({ payload: userData });
            return token;
        } catch (error) {
            throw new Error('Error generating user token: ' + error.message);
        }
    }

    static async signIn(req, res) {
        let { email, password } = req.body;
        email = email.toLowerCase();
        try {
            const db = useDB()
            const UserRecords = db.model("UserRecords", UserRecordSchema);

            if (!email || !password) {
                return res.status(400).json({
                    message: "All input is required",
                    success: false
                });
            }
            let records = await UserRecords.findOne({ "email": { $regex: new RegExp(email, "i") } }).lean();
            if (!records) {
                return super.SendErrorResponse(res, {
                    message: { password: "User not found" },
                    success: false
                })
            }
            const domainParts = records.domainName.split('.');
            const domainName = domainParts[0];
            const switchcdb = mongoose.connection.useDb(domainName);
            const User = switchcdb.model("users", UserSchema);
            let emailExist = await User.findOne({ "email": { $regex: new RegExp(email, "i") } }).lean();

            let passwordExists = await bcrypt.compare(password, emailExist.password)

            if (!passwordExists) {
                return super.SendErrorResponse(res, {
                    message: "Invalid Credentials",
                    success: false
                })
            }

            if (emailExist?.profilepic) {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: emailExist?.profilepic,
                    Expires: 60 * 60 * 24 * 2
                };

                const url = s3.getSignedUrl('getObject', params);
                emailExist.profilepic = Buffer.from(url).toString('base64');
            }

            const token = await UserController.generateAuthToken(emailExist)

            let response = {
                statusCode: 200,
                success: true,
                message: "Welcome",
                data: { token }
            }
            return super.SendSuccessResponse(res, response)
        }

        catch (err) {
            console.log("err", err)
            return super.SendErrorsAsResponse(err, res)
        };
    }

    static async SupersignIn(req, res, next) {
        try {
            let { email, password } = req.body;
            email = email.toLowerCase()
            const db = useDB();
            const User = db.model("users", UserSchema);
            if (!email || !password) {
                return super.apisResponse(res, { statusCode: 400, message: "All input is required", success: false })
            }
            let emailExist = await User.findOne({ email }).lean();
            if (!emailExist) {
                return super.apisResponse(res, { statusCode: 400, message: "Email doesn't exist", success: false })
            }

            let passwordExists = await verifyHashPassword(password, emailExist.password)
            if (!passwordExists) {
                return super.apisResponse(res, { statusCode: 400, message: "Password doesn't exist", success: false })
            }

            if (!emailExist.isSuperAdmin) {
                return super.apisResponse(res, { statusCode: 400, message: "superadmin doesn't exist", success: false })
            }

            if (emailExist?.profilepic) {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: emailExist?.profilepic,
                    Expires: 60 * 60 * 24 * 2
                };

                const url = s3.getSignedUrl('getObject', params);
                emailExist.profilepic = Buffer.from(url).toString('base64');
            }

            const token = await UserController.generateAuthToken(emailExist)

            let response = {
                statusCode: 200,
                success: true,
                message: "Welcome",
                data: { token }
            }

            return super.apisResponse(res, response)
        }

        catch (err) {
            next()
        };
    }
    static async forgotPassword(req, res) {
        let { email } = req.body;
        try {
            if (!email) {
                return res
                    .status(400)
                    .json({ success: false, message: "Email is required" });
            }

            const db = useDB()
            const UserRecords = db.model("UserRecords", UserRecordSchema);
            let records = await UserRecords.findOne({ "email": { $regex: new RegExp(email, "i") } }).lean();
            if (!records) {
                return super.SendErrorResponse(res, {
                    message: "Email doesn't exist" ,
                    success: false
                })
            }

            const domainParts = records.domainName.split('.');
            const domainName = domainParts[0];
            const switchcdb = mongoose.connection.useDb(domainName);
            const User = switchcdb.model("users", UserSchema);

            let user = await User.findOne({ email }).lean();
            if (!user) {
                return super.SendErrorResponse(res, {
                    message: "Email doesn't exist",
                    success: false
                })
            }

            const token = createJwtToken({payload:{id : user._id, domainName : user.domainName},  expiresIn: "15m" });
            let obj = {
                subjectOfEmail: "Password Reset Request - Ai Demand Pro",
                email: email,
                token: token,
            }
            await MailService(obj);
            let response = {
                statusCode: 200,
                success: true,
                message: "Email sent successfully",
            }
            return super.SendSuccessResponse(res, response)
        }
        catch (err) {
            return super.SendErrorsAsResponse(err, res)
        }
    }

    static async changePassword(req, res) {
        const { token, password } = req.body;
        try {
            const decoded = verifyToken(token, process.env.JWT_PRIVATEKEY);
            let domainName = decoded.domainName;
            let userId = decoded.id;
            dbConn.initDb();
            const domainParts = domainName.split('.');
            const domain = domainParts[0];
            const db = mongoose.connection.useDb(domain);
            const User = db.model("users", UserSchema);
            let user = await User.findById(userId);
            if (!user) {
                return super.SendErrorResponse(res, {
                    message: "Email doesn't exist" ,
                    success: false
                })
            }
            user.password = password;
            await user.save();
            let response = {
                statusCode: 200,
                success: true,
                message: "Password is Successfully changed",
            }
            return super.SendSuccessResponse(res, response)
        }
        catch (err) {
            return super.SendErrorsAsResponse(err, res)
        }
    }
}
module.exports = UserController;