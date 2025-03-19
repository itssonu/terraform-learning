const CaseSchema = require("../db/models/Case");
const UserSchema = require("../db/models/User");
const { monthMap } = require("../utils/constant");
const { getCompanyDetail } = require("../utils/dbHelper");
const { useDB } = require("../utils/dbUtil");
const BaseController = require("./BaseController")

const getUsersAnalytics = async (req, res, next) => {
    try {
        let { from, to, limit = 10, userIds = [], selectedRange, databaseName } = req.body;
        const { dbName, isSuperAdmin } = req.user

        const modifiedDbName = isSuperAdmin ? databaseName || dbName : dbName
        const db = useDB(modifiedDbName)
        const modifiedDomainName = `${databaseName || dbName}.demandpro.law`;

        const company = await getCompanyDetail({ domainName: modifiedDomainName })

        const dateFilter = {};
        if (selectedRange?.startDate) dateFilter.$gte = new Date(selectedRange?.startDate);
        if (selectedRange?.endDate) dateFilter.$lte = new Date(selectedRange?.endDate);

        const matchFilter = {
            istimetaken: { $exists: true },
        };
        if (userIds.length > 0) matchFilter.userId = { $in: userIdArray };
        if (selectedRange?.startDate || selectedRange?.endDate) matchFilter.createdAt = dateFilter;

        const CaseModel = db.model("cases", CaseSchema);

        const caseOverview = await CaseModel.aggregate([
            {
                $addFields: {
                    createdAt: {
                        $dateFromString: {
                            dateString: "$createdOn"
                        }
                    },
                    startTime: {
                        $cond: {
                            if: { $ne: [{ $type: "$updatedOn" }, "missing"] },
                            then: { $dateFromString: { dateString: "$updatedOn" } },
                            else: { $dateFromString: { dateString: "$createdOn" } }
                        }
                    },
                    timeTaken: {
                        $dateFromString: {
                            dateString: "$istimetaken"
                        }
                    }
                }
            },
            { $match: { ...matchFilter, 'resultProgress.demandLetter_progress': 'Successful' } },
            {
                $project: {
                    startTime: 1,
                    timeTaken: 1,
                    updatedOn: 1,
                    createdOn: 1,
                    istimetaken: 1,
                    timeDifference: { $subtract: ["$timeTaken", "$startTime"] }
                }
            },
            {
                $match: {
                    timeDifference: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCases: { $sum: 1 },
                    averageTimeTaken: { $avg: "$timeDifference" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCases: 1,
                    averageTimeTaken: {
                        $divide: [{ $floor: { $multiply: [{ $divide: ["$averageTimeTaken", 60000] }, 100] } }, 100]
                    }
                }
            }
        ]);

        const data = await CaseModel.aggregate([
            {
                $addFields: {
                    createdAt: {
                        $dateFromString: {
                            dateString: "$createdOn"
                        }
                    }
                }
            },
            { $match: { ...matchFilter, 'resultProgress.demandLetter_progress': 'Successful' } },
            { $group: { _id: "$userId", caseCount: { $sum: 1 } } },
            { $sort: { caseCount: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    userId: "$_id",
                    caseCount: 1,
                    userDetails: { firstName: 1, lastName: 1, email: 1 }
                }
            }
        ]);

        const topUserAnalytics = data.map(item => {
            const { firstName, lastName } = item.userDetails
            const formattedLabel = `${firstName.charAt(0).toUpperCase()}. ${lastName}`;
            return {
                y: item.caseCount,
                label: formattedLabel
            }
        });

        const response = {
            data: {
                topUserAnalytics,
                caseOverview: caseOverview[0] || { totalCases: 0, averageTimeTaken: 0 },
                companyDetail: company?.subscription,
            }
        };

        return BaseController.apisResponse(res, response)

    } catch (error) {
        console.error('ERROR in getUsersAnalytics:', error);
        next(error)
    }
}

const getComapnyMonthlyCasesAnalytics = async (req, res, next) => {
    try {
        const { databaseName } = req.body;
        const { dbName, isSuperAdmin } = req.user
        const modifiedDbName = isSuperAdmin ? databaseName || dbName : dbName
        const modifiedDomainName = `${databaseName || dbName}.demandpro.law`
        const db = useDB(modifiedDbName)

        const today = new Date();
        const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

        const CaseModel = db.model("cases", CaseSchema);

        const data = await CaseModel.aggregate([

            {
                $addFields: {
                    createdAt: {
                        $dateFromString: {
                            dateString: "$createdOn"
                        }
                    }
                }
            },

            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                    'resultProgress.demandLetter_progress': 'Successful'
                }
            },

            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    caseCount: { $sum: 1 }
                }
            },

            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },

            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    caseCount: 1,
                    _id: 0
                }
            }
        ]);

        const dataMap = new Map(data.map(item => [`${item.year}-${item.month}`, item.caseCount]));

        const startDate = data.length > 0
            ? new Date(Math.max(new Date(data[0].year, data[0].month - 1, 1).getTime(), twelveMonthsAgo.getTime()))
            : today;

        const last12MonthData = [];
        for (let i = 0; i < 12; i++) {
            const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const key = `${year}-${month}`;
            last12MonthData.push({
                label: `${monthMap[month]}`,
                value: dataMap.get(key) || 0
            });
        }


        const User = db.model("users", UserSchema);
        const totalUsers = await User.countDocuments()

        const comapany = await getCompanyDetail({ domainName: modifiedDomainName })
        const subscription = comapany.subscription
        const monthlyAlaCarteDemand = Math.max(0, -subscription.remainingDemand)
        const monthlyRemainingDemand = Math.max(0, subscription?.remainingDemand)
        const cardDetail = {
            demandsPerMonth: subscription.demandsPerMonth,
            monthlyRemainingDemand,
            monthlyAlaCarteDemand,
            totalAlaCarteDemand: subscription.totalAlaCarteCases + monthlyAlaCarteDemand,
            rollOverCredits: subscription.rollOverCredits,
            totalUsers,
        }
        return BaseController.apisResponse(res, { data: { last12MonthData, cardDetail } })

    } catch (error) {
        next(error)
    }
}

module.exports = { getUsersAnalytics, getComapnyMonthlyCasesAnalytics }