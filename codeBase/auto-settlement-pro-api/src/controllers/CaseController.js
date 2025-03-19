const CaseSchema = require("../db/models/Case");
const BaseController = require('./BaseController');
const { getSubscriptionDetail } = require("../utils/dbHelper");
const { useDB } = require("../utils/dbUtil");
var AWS = require('aws-sdk');
const s3 = new AWS.S3();
class CaseController extends BaseController {
    static async GetCases(req, res, next) {
        try {
            const { domainName, dbName } = req.user
            const pageNumber = Math.max(1, parseInt(req.query.pageNumber, 10) || 1);
            const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
            const searchText = req.query.searchText?.trim() || '';
            const skip = searchText ? 0 : (pageNumber - 1) * limit;

            const db = useDB(dbName);
            const Case = db.model("cases", CaseSchema);

            const query = {};
            query['userId'] = req.userId
            if (searchText) {
                query.$or = [
                    { 'detailsInput.caseInfo.caseName': { $regex: searchText, $options: 'i' } },
                    { 'detailsInput.liability.caseName': { $regex: searchText, $options: 'i' } }
                ];
            }

            const cases = await Case.find(query)
                .sort({ updatedOn: -1 })
                .skip(skip)
                .limit(limit)
                .select({
                    _id: 1,
                    'detailsInput.caseInfo.caseName': 1,
                    'detailsInput.liability.caseName': 1,  //old case name
                    'detailsInput.caseInfo.caseType': 1,
                    createdOn: 1,
                    resultProgress: 1,
                    isCaseGeneratedSccessfuly: 1,
                    isCaseNeedtoShow: 1,
                    isDraftCase: 1,
                    isCaseEdited: 1,
                    updatedOn: 1
                });
    
            // Map the results to use the new location if available, otherwise use the old location
            const mappedCases = cases.map(caseItem => {
                const caseDoc = caseItem.toObject();
                if (!caseDoc.detailsInput?.caseInfo?.caseName && caseDoc.detailsInput?.liability?.caseName) {
                    // If new location is empty but old location has value, set it in the new location
                    caseDoc.detailsInput.caseInfo = {
                        ...caseDoc.detailsInput.caseInfo,
                        caseName: caseDoc.detailsInput.liability.caseName
                    };
                }
                // Remove the old location from the response
                if (caseDoc.detailsInput?.liability) {
                    delete caseDoc.detailsInput.liability;
                }
                return caseDoc;
            });
    
            const totalCount = await Case.countDocuments(query);
            const subscription = await getSubscriptionDetail({ domainName });
    
            BaseController.SendSuccessResponse(res, {
                data: {
                    cases: mappedCases,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: searchText ? 1 : pageNumber,
                    subscription
                }
            });
        } catch (err) {
            next(err);
        }
    }

    static async getCaseById(req, res, next) {
        try {
            const { dbName } = req.user;
            const caseId = req.params.id;

            if (!caseId) {
                throw new Error('Case ID is required');
            }

            const db = useDB(dbName);
            const Case = db.model("cases", CaseSchema);

            const query = {
                _id: caseId
            };

            const caseDetail = await Case.findOne(query);

            if (!caseDetail) {
                throw new Error('Case not found');
            }


            
            const signedUrlFunc = (key) => {
                return new Promise((resolve, reject) => {
                    s3.getSignedUrl('getObject', { Bucket: process.env.AWS_S3_BUCKET, Key: key }, (err, url) => {
                        if (err) reject(err);
                        else resolve(url);
                    });
                });
            };

            const updateFilesWithSignedUrls = async (files) => {
                if (!files) return null;
                try {
                    return await Promise.all(
                        files.map(async (file) => ({
                            ...file,
                            url: await signedUrlFunc(file.s3UrlPath),
                        }))
                    );
                } catch (error) {
                    console.error("Error fetching signed URLs:", error);
                    return files; 
                }
            };

            const { detailsInput } = caseDetail || {};
            const { liability, painAndSuffering } = detailsInput || {};


            if (liability) {
                liability.accidentSceneFiles = await updateFilesWithSignedUrls(liability?.accidentSceneFiles);
                liability.productImageFiles = await updateFilesWithSignedUrls(liability?.productImageFiles);
            }

            if (painAndSuffering) {
                painAndSuffering.bodilyInjuriesImageFiles = await updateFilesWithSignedUrls(painAndSuffering?.bodilyInjuriesImageFiles);
            }

            BaseController.SendSuccessResponse(res, {
                data: caseDetail
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = CaseController;