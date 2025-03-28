const CaseSchema = require("../db/models/Case");
const CompaniesSchema = require("../db/models/Companies");
const { useDB } = require("./dbUtil");

const countCases = async ({ DBName, selectedRange }) => {
    const from = selectedRange?.startDate && new Date(selectedRange?.startDate);
    const to = selectedRange?.endDate && new Date(selectedRange?.endDate);

    const companyDB = useDB(DBName)

    const CaseModel = companyDB.model("cases", CaseSchema);

    const matchFilter = {};

    if (selectedRange?.startDate || selectedRange?.endDate) {
        matchFilter.createdAt = {};
        if (selectedRange?.startDate) matchFilter.createdAt.$gte = from;
        if (selectedRange?.endDate) matchFilter.createdAt.$lte = to;
    }

    const data = await CaseModel.aggregate([
        {
            $addFields: {
                createdAt: {
                    $dateFromString: {
                        dateString: "$createdOn"
                    }
                },
                timeTaken: {
                    $dateFromString: {
                        dateString: "$istimetaken"
                    }
                },
            }
        },

        { $match: { ...matchFilter, 'resultProgress.demandLetter_progress': 'Successful' } },

        {
            $addFields: {
                timeDifference: { $subtract: ["$timeTaken", "$createdAt"] }
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
                    $divide: [{$floor: { $multiply: [{ $divide: ["$averageTimeTaken", 60000] }, 100]}}, 100]
                }
            }
        }
    ]);

    return {
        totalCases: data.length > 0 ? data[0].totalCases : 0,
        averageTimeTaken: data.length > 0 ? data[0].averageTimeTaken : 0
    };
};

const getCompanyDetail = async ({ domainName }) => {
    const db = useDB()
    const Companies = db.model("Companies", CompaniesSchema);
    const comapany = await Companies.findOne({ domainName })

    return comapany
};

const getSubscriptionDetail = async ({ domainName }) => {
    try {
        const comapany = await getCompanyDetail({ domainName })
        return comapany.subscription
    } catch (error) {
        return null
    }
};

module.exports = { countCases, getCompanyDetail, getSubscriptionDetail }