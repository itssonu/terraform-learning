const UserSchema = require("../db/models/User");
const BaseController = require('./BaseController');
const UtilityHelpers = require('../UtilityHelpers');
const { uploadPhoto } = require('../miiddleware/UploaadPhoto')
const Token = require('../miiddleware/authMiddleware')
const mongoose = require("mongoose");
const { DbConnection } = require("../routes/dbName");
const UserRecordSchema = require("../db/models/userRecords");
const dbConn = require('../db/dbConnection');
const { useDB } = require("../utils/dbUtil");
const CompaniesSchema = require("../db/models/Companies");
const { getSubscriptionDetail, getCompanyDetail } = require("../utils/dbHelper");
var AWS = require('aws-sdk');
const { createJwtToken } = require("../utils/authHelper");
const s3 = new AWS.S3();

class UserController extends BaseController {

    static async Add(req, res) {
        try {
            const { dbName, domainName } = req.user

            const { firstName, lastName, email, mobileNumber, password, isAdmin } = req.body;
            const db = useDB(dbName);
            const User = db.model("users", UserSchema);

            const [emailExist, mobileNumberExists] = await Promise.all([
                User.findOne({ email }).lean(),
                User.findOne({ mobileNumber }).lean()
            ]);

            if (emailExist) {
                return super.SendErrorResponse(res, {
                    message: { email: "Email Already exists" },
                    success: false
                });
            }

            if (mobileNumberExists) {
                return super.SendErrorResponse(res, {
                    message: { mobileNumber: "Mobile number Already exists" },
                    success: false
                });
            }

            const user = new User({ firstName, lastName, email, mobileNumber, password, isAdmin, domainName });

            await user.save();

            const switchcdb = useDB()
            const UserRecords = switchcdb.model("UserRecords", UserRecordSchema);
            const recordUSer = new UserRecords({
                domainName, email: email
            });
            await recordUSer.save();

            const Companies = switchcdb.model("Companies", CompaniesSchema);
            await Companies.deductUsers(domainName)

            let response = {
                statusCode: 200,
                message: 'User was added successfully.',
                data: UtilityHelpers.GetDocumentId(user)
            }

            return super.SendSuccessResponse(res, response);
        } catch (err) {
            return super.SendErrorsAsResponse(err, res)
        }
    }

    static async GetUsers(req, res, next) {
        try {
            const { domainName, dbName } = req.user;
            const pageNumber = Math.max(1, parseInt(req.query.pageNumber, 10) || 1);
            const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
            const searchText = req.query.searchText?.trim() || '';
            const skip = searchText ? 0 : (pageNumber - 1) * limit;
    
            const db = useDB(dbName);
            const User = db.model("users", UserSchema);
    
            const userQuery = {};
            if (searchText) {
                userQuery.$or = [
                    { firstName: { $regex: searchText, $options: 'i' } },
                    { lastName: { $regex: searchText, $options: 'i' } },
                    { email: { $regex: searchText, $options: 'i' } },
                ];
            }
    
            const pipeline = [
                { $match: userQuery },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "cases",
                        localField: "_id",
                        foreignField: "userId",
                        as: "cases"
                    }
                },
                {
                    $addFields: {
                        casesCount: { $size: "$cases" }
                    }
                },
                {
                    $project: {
                        password: 0,
                        cases: 0
                    }
                }
            ];
    
            let users = await User.aggregate(pipeline);

            if (users.length === 0) {
                const simpleUserQuery = [
                    { $match: userQuery },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $addFields: {
                            casesCount: 0
                        }
                    },
                    {
                        $project: {
                            password: 0
                        }
                    }
                ];
    
                users = await User.aggregate(simpleUserQuery);
            }
    
            const totalUsersCount = await User.countDocuments(userQuery);
    
            const subscription = await getSubscriptionDetail({ domainName });
    
            super.SendSuccessResponse(res, {
                data: {
                    users,
                    totalCount: totalUsersCount,
                    totalPages: Math.ceil(totalUsersCount / limit),
                    currentPage: searchText ? 1 : pageNumber,
                    subscription
                }
            });
        } catch (err) {
            next(err);
        }
    }


    static async UpdateProfile(req, res) {
        try {
            const { dbName } = req.user
            let params = { ...req.body }
            const db = useDB(dbName);
            const User = db.model("users", UserSchema);
            if (req.files?.profilepic) {
                const profileImg = req.files?.profilepic;
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: `${req.domainName[0]}/${req.userId}/company-logo/${profileImg.name}`,
                    Body: profileImg.data,
                    ContentType: profileImg.mimetype,
                };
                try {
                    const s3Result = await s3.upload(s3Params).promise();
                    params.profilepic = s3Result?.Key;
                } catch (error) {
                    console.log("Updating Profile error", error)
                }
            }
            if (params?.domainName) {
                delete params.domainName;
            }
            const user = await User.findByIdAndUpdate(req.userId, params, { new: true });
            if (user?.profilepic) {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: user?.profilepic,
                    Expires: 60 * 60 * 24 * 2
                };

                const url = s3.getSignedUrl('getObject', params);
                user.profilepic = Buffer.from(url).toString('base64');
            }
            const domainName = user?.domainName
            const company = await getCompanyDetail({ domainName })

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

            let response = {
                statusCode: 200,
                message: 'Profile updated successfully',
                token
            }

            return super.SendSuccessResponse(res, response);
        } catch (err) {
            console.log(err)
            return super.SendErrorsAsResponse(err, res)
        }
    }
    static async UpdateUser(req, res) {
        try {
            const { dbName } = req.user
            let { _id, firstName, lastName, email, mobileNumber, password, isAdmin } = req.body
            const db = useDB(dbName);
            const User = db.model("users", UserSchema);
            const user = await User.findById(_id);

            if (user) {
                user.firstName = firstName
                user.lastName = lastName
                user.email = email
                user.mobileNumber = mobileNumber
                user.password = password
                user.isAdmin = isAdmin
                user.resetPassword = false
                await user.save();
            }

            if (user?.profilepic) {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: user?.profilepic,
                    Expires: 60 * 60 * 24 * 2
                };

                const url = s3.getSignedUrl('getObject', params);
                user.profilepic = Buffer.from(url).toString('base64');
            }

            const domainName = user?.domainName
            const company = await getCompanyDetail({ domainName })

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
            let response = {
                statusCode: 200,
                message: 'Profile updated successfully',
                token
            }

            return super.SendSuccessResponse(res, response);
        } catch (err) {
            console.log(err)
            return super.SendErrorsAsResponse(err, res)
        }
    }
    static async filterUser(req, res) {
        try {
            const { dbName } = req.user
            let params = { ...req.body }
            const db = useDB(dbName);
            const User = db.model("users", UserSchema);
            const querySearch = {};
            const skip_page = 0;
            const limit = 10;
            const users = await User.aggregate([
                { $match: querySearch },
                { $skip: skip_page },
                { $limit: limit },
                { $sort: { _id: -1 } },
                {
                    $lookup: {
                        from: "cases",
                        localField: "_id",
                        foreignField: "userId",
                        as: "cases"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        mobileNumber: 1,
                        email: 1,
                        password: 1,
                        isAdmin: 1,
                        isSuperAdmin: 1,
                        profilepic: 1,
                        resetPassword: 1,
                        numCases: {
                            $size: {
                                $filter: {
                                    input: "$cases",
                                    as: "case",
                                    cond: {
                                        $and: [
                                            { $gte: ["$$case.createdOn", params.startDate] },
                                            { $lt: ["$$case.createdOn", params.endDate] }
                                        ]
                                    }
                                }
                            }
                        },
                        // Calculate time taken for each case
                        cases: {
                            $map: {
                                input: "$cases",
                                as: "case",
                                in: {
                                    $mergeObjects: [
                                        "$$case",
                                        {
                                            timeTaken: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            { $toDate: "$$case.istimetaken" }, // Convert istimetaken to date object
                                                            { $toDate: "$$case.createdOn" } // Convert createdOn to date object
                                                        ]
                                                    },
                                                    60000 // Convert milliseconds to minutes
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                // Match users based on the count of cases within the specified date range
                {
                    $match: {
                        numCases: { $gt: 0 } // Filter users with at least one case in the date range
                    }
                }
            ]);
            console.log(users);

            let response = {
                statusCode: 200,
                data: users,
            }
            return super.SendSuccessResponse(res, response);
        } catch (err) {
            console.log(err)
            return super.SendErrorsAsResponse(err, res)
        }
    }
    static async filterMonth(req, res) {
        try {
            const { dbName } = req.user
            let params = { ...req.body };
            const db = useDB(dbName);
            const User = db.model("users", UserSchema);

            const startDate = new Date(params.startDate);
            const endDate = new Date(params.endDate);

            // Log the dates for debugging
            console.log('Start Date:', startDate);
            console.log('End Date:', endDate);

            const value = await User.aggregate([
                { $match: {} },
                {
                    $lookup: {
                        from: "cases",
                        localField: "_id",
                        foreignField: "userId",
                        as: "cases"
                    }
                },
                { $unwind: "$cases" },
                {
                    $addFields: {
                        createdOn: {
                            $cond: {
                                if: { $isArray: "$cases.createdOn" },
                                then: { $arrayElemAt: ["$cases.createdOn", 0] },
                                else: "$cases.createdOn"
                            }
                        }
                    }
                },
                { $match: { "createdOn": { $gte: params.startDate, $lte: params.endDate } } }, // Filter cases by date
                {
                    $project: {
                        userId: 1,
                        month: {
                            $month: {
                                date: {
                                    $cond: [
                                        { $eq: [{ $type: "$createdOn" }, "date"] },
                                        "$createdOn",
                                        { $toDate: "$createdOn" }
                                    ]
                                },
                                timezone: "UTC"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: { userId: "$userId", month: "$month" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.month",
                        totalCases: { $sum: "$count" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const months = [
                "January", "February", "March", "April",
                "May", "June", "July", "August",
                "September", "October", "November", "December"
            ];

            const dataPoints = months.map((month, index) => ({
                label: month,
                value: 0
            }));

            value.forEach(({ _id, totalCases }) => {
                const monthIndex = _id - 1;
                dataPoints[monthIndex].value = totalCases;
            });

            // Calculate the start month index
            const startMonthIndex = new Date(params.startDate).getUTCMonth();

            // Reorder the array starting from the start month index and wrap around the year
            const reorderedDataPoints = [
                ...dataPoints.slice(startMonthIndex),
                ...dataPoints.slice(0, startMonthIndex)
            ];

            console.log(reorderedDataPoints);

            const countDocuments = await User.countDocuments({});

            let response = {
                statusCode: 200,
                dataPoints: reorderedDataPoints,
                totalCount: countDocuments,
            };
            return super.SendSuccessResponse(res, response);
        } catch (err) {
            console.log(err);
            return super.SendErrorsAsResponse(err, res);
        }
    }


}

module.exports = UserController;