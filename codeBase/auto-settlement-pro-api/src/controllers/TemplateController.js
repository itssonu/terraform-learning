

const BaseController = require('./BaseController')
const { useDB } = require('../utils/dbUtil');

var AWS = require('aws-sdk');
const { putObjectSignedUrl } = require('../utils/aws/s3');
const { separateFilenameAndExtension } = require('../utils/helper');
const DemandTemplateSchema = require('../db/models/DemandTemplateSchema');
const SettingSchema = require('../db/models/SettingSchema');
const { DEMAND, CASE_TYPE, CASE_TYPE_DEMANDS } = require('../utils/enum');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

const getImageFromS3 = async (path) => {
    try {
        const params = { Bucket: process.env.AWS_S3_BUCKET, Key: path }
        const url = await s3.getObject(params).promise()
        return url.Body;
    } catch (e) {
        console.log(e)
    }
}

const convertBufferToBase64 = (bufferData) => {
    const buffer = Buffer.from(bufferData);
    const base64String = buffer.toString('base64');
    return base64String
}

class TemplateController extends BaseController {

    static async getDemandTemplate(req, res, next) {
        const { dbName } = req.user;
        const { state, caseType, demandType } = req.params;

        if (!state || !caseType || !demandType) {
            return super.apisResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Missing required parameters'
            });
        }

        const queryParams = {
            state,
            caseType,
            demandType
        };

        const getTemplateFromDB = async (dbInstance, query) => {
            const Template = dbInstance.model('demandtemplates', DemandTemplateSchema);
            return await Template.findOne(query).lean();
        };

        try {
            const userDB = useDB(dbName);
            let template = await getTemplateFromDB(userDB, queryParams);

            if (template) {
                return super.apisResponse(res, {
                    statusCode: 200,
                    success: true,
                    data: template
                });
            }

            const eastonDB = useDB('easton');
            template = await getTemplateFromDB(eastonDB, queryParams);

            if (!template) {
                template = await getTemplateFromDB(eastonDB, {
                    ...queryParams,
                    state: 'California'
                });
            }

            if (template) {
                delete template._id
                template.state = state

                getTemplateFromDB(userDB, queryParams).then(existingTemplate => {
                    if (!existingTemplate) {
                        const Template = userDB.model('demandtemplates', DemandTemplateSchema);
                        Template.create(template).catch(err =>
                            console.error(`Failed to save template to ${dbName}:`, err)
                        );
                    }
                });

                return super.apisResponse(res, {
                    statusCode: 200,
                    success: true,
                    data: template
                });
            }

            return super.apisResponse(res, {
                statusCode: 404,
                success: false,
                message: `No template found for ${state} - ${caseType} - ${demandType}`
            });

        } catch (error) {
            next(error);
        }

    }

    static async deleteDemandTemplate(req, res, next) {
        const { dbName } = req.user;
        const { state, caseType, demandType } = req.params;

        if (!state || !caseType || !demandType) {
            return super.apisResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Missing required parameters'
            });
        }

        const queryParams = {
            state,
            caseType,
            demandType
        };

        try {
            const userDB = useDB(dbName);
            const Template = userDB.model('demandtemplates', DemandTemplateSchema);

            const template = await Template.findOne(queryParams);

            if (!template) {
                return super.apisResponse(res, {
                    statusCode: 404,
                    success: false,
                    message: `No template found for ${state} - ${caseType} - ${demandType}`
                });
            }

            await Template.deleteOne(queryParams);

            return super.apisResponse(res, {
                statusCode: 200,
                success: true,
                message: `Template for ${state} - ${caseType} - ${demandType} successfully deleted`
            });

        } catch (error) {
            next(error);
        }
    }

    static async getAllDemandTemplates(req, res, next) {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1);
            const limit = Math.max(parseInt(req.query.limit) || 10, 1);
            const state = req.query.state || 'California';
            const demandType = req.query.demandType;
            const caseType = req.query.caseType;
            const skip = (page - 1) * limit;

            const { dbName } = req.user;

            const filters = {};
            if (state) filters.state = state;
            if (demandType) filters.demandType = demandType;
            if (caseType) filters.caseType = caseType;

            const db = useDB(dbName);
            const Template = db.model('demandtemplates', DemandTemplateSchema);
            // Fetch existing templates from DB
            const templates = await Template.find(filters).lean();
            const templatesSet = {};
            templates.forEach((row) => {
                templatesSet[`${row.demandType}-${row.caseType}-${row.state}`] = row;
            });

            // Build all possible template combinations with pagination
            const allPossibleTemplateCombinations = [];
            let count = 0;


            const caseTypeList = caseType ? [caseType] : Object.values(CASE_TYPE)
            for (const caseTypeKey of caseTypeList) {
                const caseType = CASE_TYPE[caseTypeKey];
                const demandTypeList = demandType ? [demandType] : CASE_TYPE_DEMANDS[caseType]
                for (const demandTypeKey of demandTypeList) {
                    const demandType = DEMAND[demandTypeKey];
                    if (count >= skip && count < skip + limit) {
                        allPossibleTemplateCombinations.push({
                            demandType,
                            caseType,
                            state,
                            exists: !!((templatesSet[`${demandType}-${caseType}-${state}`]?.liabilityTitle ||
                                templatesSet[`${demandType}-${caseType}-${state}`]?.templateFile)),
                            data: templatesSet[`${demandType}-${caseType}-${state}`] || null
                        });
                    }
                    count++;
                }
            }


            const totalCount = count;
            const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return super.apisResponse(res, {
                statusCode: 200,
                success: true,
                data: {
                    templates: allPossibleTemplateCombinations,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalCount,
                        hasNextPage,
                        hasPrevPage,
                        limit
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async addUpdateDemandTemplate(req, res, next) {
        try {
            const { dbName } = req.user;
            const { state, caseType, demandType, templateFile, ...updateData } = req.body;
            const payload = { ...updateData }

            if (!state || !caseType || !demandType) {
                return super.SendErrorResponse(res, {
                    error: 'State, case type, and demand type are required'
                });
            }

            const db = useDB(dbName);
            const DemandTemplate = db.model("demandtemplates", DemandTemplateSchema);

            // Handle template file
            let putTemplateFileSignedUrl
            if (templateFile === "remove") {
                payload.templateFile = '';
                payload.templateFileName = '';
            }

            if (templateFile?.name && templateFile?.mimetype) {
                payload.templateFileName = templateFile.name;
                const { ext } = separateFilenameAndExtension(templateFile.name);
                const path = `${dbName}/template/${demandType}-${caseType}-${state}-file.${ext}`;

                putTemplateFileSignedUrl = await putObjectSignedUrl({
                    path,
                    metaData: {
                        originalfilename: templateFile.name,
                        demandType,
                        caseType,
                        state,
                        description: `template file for overall template`
                    },
                    contentType: templateFile.mimetype
                });

                payload.templateFile = path;
            }

            const templateData = await DemandTemplate.findOneAndUpdate(
                {
                    state,
                    caseType,
                    demandType
                },
                {
                    $set: {
                        ...payload,
                        state,
                        caseType,
                        demandType
                    }
                },
                {
                    new: true,
                    upsert: true
                }
            );

            return super.apisResponse(res, {
                data: { templateData, putTemplateFileSignedUrl },
                message: 'Template updated successfully'
            });

        } catch (error) {
            next(error);
        }
    }

    static async getTemplateSettings(req, res, next) {
        try {
            const { dbName } = req.user;
            const db = useDB(dbName);
            const Setting = db.model('settings', SettingSchema);

            const settings = await Setting.findOne({
                isDefault: true
            }).lean();

            const settingTemplate = settings?.template

            if (!settings) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No settings found'
                });
            }

            if (settingTemplate?.companyLogo) {
                try {
                    const logoImage = await getImageFromS3(settingTemplate.companyLogo);
                    const base64Logo = convertBufferToBase64(logoImage);
                    settingTemplate.companyLogo = `data:image/png;base64,${base64Logo}`;
                } catch (error) {
                    console.error('Error processing logo:', error);
                    settingTemplate.companyLogo = null;
                }
            }

            return super.apisResponse(res, {
                statusCode: 200,
                success: true,
                data: settingTemplate
            });

        } catch (error) {
            next(error);
        }
    }

    static async addUpdateTemplateSettings(req, res, next) {
        try {
            const { dbName } = req.user;
            let { companyLogo, ...updateData } = req.body;
            let templateUpdate = {};

            Object.keys(updateData).forEach(key => {
                templateUpdate[`template.${key}`] = updateData[key];
            });

            const db = useDB(dbName);
            const Setting = db.model("settings", SettingSchema);
            let putCompanyLogoSignedUrl;

            // Handle company logo
            if (companyLogo === "removeLogo") {
                templateUpdate['template.companyLogo'] = "";
            }

            if (companyLogo?.name && companyLogo?.mimetype) {
                const { ext } = separateFilenameAndExtension(companyLogo.name);
                const path = `${dbName}/template/logo.${ext}`;

                putCompanyLogoSignedUrl = await putObjectSignedUrl({
                    path,
                    metaData: {
                        originalfilename: companyLogo.name,
                        description: `settings template logo`
                    },
                    contentType: companyLogo.mimetype
                });

                templateUpdate['template.companyLogo'] = path;
            }

            // Update or create settings
            const updatedSettings = await Setting.findOneAndUpdate(
                { isDefault: true },
                { $set: templateUpdate },
                { new: true, upsert: true }
            );

            const updatedTemplateSettings = updatedSettings.template

            if (updatedTemplateSettings?.companyLogo) {
                try {
                    const logoImage = await getImageFromS3(updatedTemplateSettings.companyLogo);
                    const base64Logo = convertBufferToBase64(logoImage);
                    updatedTemplateSettings.companyLogo = `data:image/png;base64,${base64Logo}`;
                } catch (error) {
                    console.error('Error processing logo:', error);
                    updatedTemplateSettings.companyLogo = null;
                }
            }

            return super.apisResponse(res, {
                data: {
                    updatedTemplateSettings,
                    putCompanyLogoSignedUrl
                },
                message: 'Settings updated successfully'
            });

        } catch (error) {
            next(error);
        }
    }

}


module.exports = TemplateController