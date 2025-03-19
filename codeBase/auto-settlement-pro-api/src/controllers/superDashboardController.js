const CompaniesSchema = require("../db/models/Companies");
const { countCases } = require("../utils/dbHelper");
const { useDB } = require("../utils/dbUtil");
const { getDBName } = require("../utils/helper");
const BaseController = require("./BaseController")

const getCompaniesAnalytics = async (req, res, next) => {
    try {
        const { from, to, limit = 10 } = req.body;
        const db = useDB()
        const CompaniesModel = db.model("companies", CompaniesSchema);
        const companies = await CompaniesModel.find({}).lean();

        const caseCountPromises = companies.map(async (company) => {
            const DBName = getDBName({ domainName: company.domainName })
            const { totalCases, averageTimeTaken } = await countCases({ DBName, from, to });

            return { totalCases, averageTimeTaken, companyName: company.companyName, domainName: company.domainName };
        });

        let data = await Promise.all(caseCountPromises);

        data = data.sort((a, b) => b.totalCases - a.totalCases)
        // .slice(0, limit);

        let totalCases = 0;
        let totalAverageTimeTaken = 0;

        const topCompanyAnalytic = data.map((item) => {
            totalCases += item.totalCases;
            totalAverageTimeTaken += item.averageTimeTaken || 0;
            return {
                y: item.totalCases,
                label: item.companyName,
                domainName: item.domainName,
            }
        });

        const averageTimeTakenOverall = totalAverageTimeTaken / data.length;

        return BaseController.apisResponse(res, {
            data: {
                topCompanyAnalytic,
                totalCases,
                averageTimeTaken: +averageTimeTakenOverall.toFixed(2)
            },

        });

    } catch (error) {
        next(error)
    }
}

module.exports = { getCompaniesAnalytics }