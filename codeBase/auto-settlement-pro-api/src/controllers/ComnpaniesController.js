const UserSchema = require("../db/models/User");
const CompaniesSchema = require("../db/models/Companies");
const CasesSchema = require("../db/models/Case");
const BaseController = require('./BaseController');
const UtilityHelpers = require('../UtilityHelpers');
const mongoose = require("mongoose");
const { OnBoardingConnectMail } = require("../utils/mailServices");
const UserRecordSchema = require("../db/models/userRecords");
const dbConn = require('../db/dbConnection');
const { getDBName } = require("../utils/helper");
const { useDB } = require("../utils/dbUtil");
var AWS = require('aws-sdk');
const { getObjectSignedUrl } = require("../utils/aws/s3");
const DemandTemplateSchema = require("../db/models/DemandTemplateSchema");
const SettingSchema = require("../db/models/SettingSchema");
const s3 = new AWS.S3();


async function getCasesByCompany(companyName) {
    try {
        //dbConn.initDb();

        const database = mongoose.connection.useDb(companyName);
        const collection = database.model("cases", CasesSchema);

        // Perform a query to get cases based on the company name
        const cases = await collection.find().lean();

        return cases;
    } catch (error) {
        console.error('Error getting cases:', error);
        throw error; // Rethrow the error to be caught by the caller
    }
}

class CompaniesController extends BaseController {

    static async AddCompanies(req, res, next) {
        try {
            const { companyAddress, companyName, companyPhoneNumber, contactNumber, dataBasePassword,
                domainName, contactEmail, firstName, lastName, taxiationID, accountantname, accountantemail, monthlyPrice, demandsPerMonth, usersLimit, } = req.body;
            const currentDate = new Date();
            const subscriptionRenewalDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
            const dbName = getDBName({ domainName })

            const db = useDB()
            const Companies = db.model("Companies", CompaniesSchema);
            const UserRecords = db.model("UserRecords", UserRecordSchema)

            const [companyDomainNameExists, companyEmailExists] = await Promise.all([
                Companies.findOne({ domainName }).lean(),
                Companies.findOne({ contactEmail }).lean()
            ]);

            if (companyDomainNameExists) {
                return super.SendErrorResponse(res, {
                    message: { email: "Domain Already exists" },
                    success: false
                });
            }

            if (companyEmailExists) {
                return super.SendErrorResponse(res, {
                    message: { email: "Email Already exists" },
                    success: false
                });
            }

            const companyDB = useDB(dbName);
            const User = companyDB.model("users", UserSchema)

            const newcompanies = new Companies({
                companyAddress, companyName, companyPhoneNumber, contactNumber, dataBasePassword,
                domainName, contactEmail, firstName, lastName, taxiationID, accountantname, accountantemail,
                subscription: {
                    monthlyPrice,
                    demandsPerMonth,
                    usersLimit,
                    subscriptionRenewalDate,
                    remainingDemand: demandsPerMonth,
                    remainingUser: usersLimit,
                }
            });

            if (req?.files?.companyLogo) {
                const profileImg = req.files?.companyLogo;
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: `${dbName}/company-logo/${profileImg.name}`,
                    Body: profileImg.data,
                    ContentType: profileImg.mimetype,
                };
                try {
                    const s3Result = await s3.upload(s3Params).promise();
                    newcompanies.companyLogo = s3Result.Key;
                } catch (error) {
                    console.log("Updating Profile error", error)
                }
            }

            await newcompanies.save();

            const recordUSer = new UserRecords({
                domainName, email: contactEmail
            });
            await recordUSer.save();

            const myobj = {
                username: firstName,
                password: dataBasePassword,
                url: domainName,
                email: contactEmail,
            }
            OnBoardingConnectMail(myobj)

            const newuser = new User({
                firstName: firstName,
                lastName: lastName,
                email: contactEmail,
                mobileNumber: contactNumber,
                password: dataBasePassword,
                isAdmin: true,
                isSuperAdmin: true,
                domainName: domainName,
            });
            await newuser.save()

            //deduct user from subscription
            await Companies.deductUsers(domainName)

            // copy DB
            await this.copyDefaultDB({ dbName })


            let response = {
                statusCode: 200,
                message: 'Comapany added successfully.',
                data: UtilityHelpers.GetDocumentId(newcompanies)
            }
            return super.SendSuccessResponse(res, response);
        } catch (err) {
            next(err)
        }
    }

    static async GetCompanies(req, res, next) {
        try {
            const pageNumber = Math.max(1, parseInt(req.query.pageNumber, 10) || 1);
            const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
            const searchText = req.query.searchText?.trim() || '';
            const skip = searchText ? 0 : (pageNumber - 1) * limit;

            const db = useDB();
            const Companies = db.model("Companies", CompaniesSchema);

            const companyQuery = {};

            if (searchText) {
                companyQuery.$or = [
                    { firstName: { $regex: searchText, $options: 'i' } },
                    { lastName: { $regex: searchText, $options: 'i' } },
                    { contactEmail: { $regex: searchText, $options: 'i' } },
                    { companyName: { $regex: searchText, $options: 'i' } },
                    { companyPhoneNumber: { $regex: searchText, $options: 'i' } },
                ];
            }

            const companies = await Companies.find(companyQuery)
                .skip(skip)
                .limit(limit)
                .sort({ _id: -1 })
                .lean();

            // Process company logo
            companies.map(async (company) => {
                if (company?.companyLogo) {
                    company.companyLogo = getObjectSignedUrl({ path: company.companyLogo });
                }
                return company;
            })

            const totalCompaniesCount = await Companies.countDocuments(companyQuery);

            super.SendSuccessResponse(res, {
                data: {
                    companies,
                    totalCount: totalCompaniesCount,
                    totalPages: Math.ceil(totalCompaniesCount / limit),
                    currentPage: searchText ? 1 : pageNumber
                }
            });

        } catch (err) {
            next(err)
        }
    }

    static async UpdateCompanies(req, res, next) {
        try {
            const {
                accountantEmail,
                accountantName,
                companyAddress,
                companyName,
                companyPhoneNumber,
                contactEmail,
                contactNumber,
                firstName,
                companyId,
                lastName,
                subscription,
            } = req.body;
            const { monthlyPrice, usersLimit, demandsPerMonth, costPerAdditionalDemand, costPerAdditionalUser, remainingDemand, rollOverCredits } = JSON.parse(subscription)

            const db = useDB();
            const Companies = db.model("Companies", CompaniesSchema);
            const company = await Companies.findById(companyId);
            const domainName = company.domainName
            const dbName = getDBName({ domainName })
            const previousContactEmail = company.contactEmail;

            if (!company) {
                return super.SendErrorResponse(res, {
                    message: "Company not found",
                });
            }

            const [companyEmailExists] = await Promise.all([
                Companies.findOne({ contactEmail, _id: { $ne: companyId } }).lean()
            ]);

            if (companyEmailExists) {
                return super.SendErrorResponse(res, {
                    message: "Email Already exists",
                });
            }


            if (req?.files?.companyLogo) {
                const profileImg = req.files?.companyLogo;
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: `${dbName}/company-logo/${profileImg.name}`,
                    Body: profileImg.data,
                    ContentType: profileImg.mimetype,
                };
                try {
                    const s3Result = await s3.upload(s3Params).promise();
                    company.companyLogo = s3Result.Key;
                } catch (error) {
                    console.log("Updating Profile error", error)
                }
            }


            company.companyAddress = companyAddress;
            company.companyName = companyName;
            company.companyPhoneNumber = companyPhoneNumber;
            company.contactNumber = contactNumber;
            company.contactEmail = contactEmail;
            company.firstName = firstName;
            company.lastName = lastName;
            company.accountantname = accountantName;
            company.accountantemail = accountantEmail;
            company.subscription.monthlyPrice = monthlyPrice;
            company.subscription.demandsPerMonth = demandsPerMonth;
            company.subscription.usersLimit = usersLimit;
            company.subscription.costPerAdditionalUser = costPerAdditionalUser;
            company.subscription.costPerAdditionalDemand = costPerAdditionalDemand;
            company.subscription.remainingDemand = remainingDemand;
            company.subscription.rollOverCredits = rollOverCredits;

            await company.save();

            const UserRecords = db.model("UserRecords", UserRecordSchema);
            const userRecord = await UserRecords.findOne({ domainName, email: previousContactEmail });
            if (userRecord) {
                userRecord.email = contactEmail;
                await userRecord.save();
            }

            const companyDB = useDB(dbName);
            const User = companyDB.model("users", UserSchema);
            const user = await User.findOne({ email: previousContactEmail });

            if (user) {
                user.firstName = firstName;
                user.lastName = lastName;
                user.email = contactEmail;
                user.mobileNumber = contactNumber;
                await user.save();
            }

            return super.SendSuccessResponse(res, { message: 'companies updated successfully' });

        } catch (err) {
            next(err)
        }
    }

    static async FilterCompanies(req, res) {
        try {
            dbConn.initDb();
            let params = { ...req.body };
            const db = mongoose.connection.useDb("master");
            const Companies = db.model("Companies", CompaniesSchema);
            const pageNumber = parseInt(req.query.pageNumber) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip_page = req.query.searchText && req.query.searchText.trim() !== '' ? 0 : (pageNumber - 1) * limit;
            let querySearch = {};

            if (req.query.searchText && req.query.searchText.trim() !== '') {
                querySearch.$or = [
                    { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: `${req.query.searchText.trim()}`, options: 'i' } } },
                    { "email": { $regex: `${req.query.searchText.trim()}`, $options: 'i' } },
                ];
            }

            const users = await Companies.find(querySearch).skip(skip_page).limit(limit).sort({ _id: -1 }).lean();

            const startDate = req.query.startDate ? new Date(req.query.startDate) : null; // Assuming startDate is passed as a query parameter
            const endDate = req.query.endDate ? new Date(req.query.endDate) : null; // Assuming endDate is passed as a query parameter

            const updatedUsers = []; // Array to store updated users

            for (const user of users) {
                try {
                    if (user && user.domainName) {
                        const companyName = user.domainName.split('.')[0];
                        const cases = await getCasesByCompany(companyName);
                        console.log(`Cases for ${companyName}:`, cases);

                        let totalTimeTaken = 0; // Initialize total time taken for all cases
                        const casesWithTime = []; // Array to store cases with time taken

                        for (const caseItem of cases) {
                            const startTime = new Date(caseItem.createdOn); // Assuming createdOn is stored as a Date object
                            const endTime = new Date(caseItem.istimetaken); // Assuming istimetaken is stored as a Date object

                            // Check if the case falls within the specified date range
                            if ((!startDate || startTime >= startDate) && (!endDate || endTime <= endDate)) {
                                const timeTaken = endTime.getTime() - startTime.getTime(); // Time difference in milliseconds
                                totalTimeTaken += timeTaken; // Accumulate the total time taken

                                // Push the case with time taken into the array
                                casesWithTime.push({
                                    ...caseItem,
                                    timeTaken: timeTaken / 1000 // Convert milliseconds to seconds
                                });
                            }
                        }

                        console.log(`Total time taken for all cases: ${totalTimeTaken} milliseconds`);

                        user.caseCount = casesWithTime.length; // Update the caseCount property
                        user.totalTimeTaken = totalTimeTaken; // Update totalTimeTaken
                        user.cases = casesWithTime; // Add the cases with time taken to the user object

                        // Push the updated user into the updatedUsers array
                        updatedUsers.push(user);
                    } else {
                        console.log('User or domainName not found.');
                    }
                } catch (error) {
                    console.error('Error fetching cases:', error);
                }
            }

            // Now updatedUsers contains all the users with the updated information
            console.log('Updated users:', updatedUsers);

            // Close the MongoDB connection
            await mongoose.connection.close();

            // Reconnect to the "master" database
            //await mongoose.connect('mongodb://localhost:27017/master');
            const newDB = mongoose.connection.useDb("master");
            Companies = newDB.model("Companies", CompaniesSchema);
            console.log('MongoDB client reconnected to "master" database.');

            const countDocuments = await Companies.countDocuments(querySearch);
            const response = {
                statusCode: 200,
                data: updatedUsers, // Ensure updated users are returned
                totalCount: countDocuments,
                totalPages: Math.ceil(countDocuments / limit),
            };
            return super.SendSuccessResponse(res, response);
        } catch (err) {
            return super.SendErrorsAsResponse(err, res);
        }
    }

    static async copyDefaultDB({dbName}) {
        try {
    
            const sourceDb = useDB('easton');
            const targetDb = useDB(dbName);
    
            const DemandTemplateSource = sourceDb.model('demandtemplates', DemandTemplateSchema);
            const SettingsSource = sourceDb.model('settings', SettingSchema);
    
            const DemandTemplateTarget = targetDb.model('demandtemplates', DemandTemplateSchema);
            const SettingsTarget = targetDb.model('settings', SettingSchema);
    
            // Copy settings
            const sourceSettings = await SettingsSource.findOne({ isDefault: true }).lean();
            if (sourceSettings) {
                const settingsData = {
                    ...sourceSettings,
                    _id: undefined,
                    template: {
                        ...sourceSettings.template,
                    }
                };
                await SettingsTarget.findOneAndUpdate(
                    { isDefault: true },
                    settingsData,
                    { upsert: true, new: true }
                );
            }
    
            // Get all California templates from Easton
            const sourceTemplates = await DemandTemplateSource.find({ 
                state: 'California' 
            }).lean();
    
            // Copy each template to new company's database
            const copyPromises = sourceTemplates.map(async (template) => {
                const templateData = {
                    ...template,
                };
    
                await DemandTemplateTarget.create(templateData);
            });
    
            await Promise.all(copyPromises);
    
            return {
                statusCode: 200,
                success: true,
                message: `Successfully copied ${sourceTemplates.length} templates and settings to ${dbName}`
            };
    
        } catch (error) {
            throw new Error('error during copyDefaultDB')
        }
    }

}

module.exports = CompaniesController;