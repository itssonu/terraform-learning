const express = require('express');
const serverless = require('serverless-http')
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fileUpload = require("express-fileupload");
const { BaseUrl } = require('./AppConfig');
const dbConn = require('./src/db/dbConnection');
//const Case = require("./src/db/models/Case");
const axios = require('axios');
const { verifyToken } = require('./src/miiddleware/authMiddleware');
const app = express()
const server = require('http').createServer(app)
// const { multiplefileProcessing, deleteDirectoryData } = require('./src/services/FileUploadingService');
const FormData = require('form-data');
var AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();
const CaseSchema = require('./src/db/models/Case');
const BaseController = require('./src/controllers/BaseController');
const initMiddleware = require('./src/miiddleware/initMiddleware');
const { useDB } = require('./src/utils/dbUtil');
const { DEMAND_TYPE } = require('./src/utils/enum');
const path = require('path');
const fs = require('fs');

app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 100000 }));
app.use(bodyParser.json({
    limit: "100mb",
    type: ["application/x-www-form-urlencoded", "application/json"],
}));

app.use(
    fileUpload({
        tempFileDir: "/tmp",
        useTempFiles: false,
        createParentPath: true
    })
);
// Array of allowed origins
const allowedOrigins = [process.env.BASE_URL, "https://" + process.env.BASE_URL, "https://www." + process.env.BASE_URL];


const corsOptions = {
    origin: true,
    credentials: true,
    optionSuccessStatus: 200,
};

// Enable cors for all routes
app.use(cors(corsOptions));
app.options('*', cors())
app.use(express.json());
app.use(require('./src/routes'));

app.post('/generate-presigned-urls', verifyToken, async (req, res) => {
    const domainName = req.domainName[0];
    const { preSignedObj } = req.body;
    if (!preSignedObj) { return res.status(400).json({ error: 'Please Upload Files' }); }
    const preSignedObjRes = {};
    const s3UniqueId = uuidv4();
    try {
        for (const objKey in preSignedObj) {
            if (preSignedObj.hasOwnProperty(objKey)) {
                preSignedObjRes[objKey] = await Promise.all(
                    preSignedObj[objKey].map(async (fileObj) => {
                        const s3Params = {
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: `${domainName}/${req.userId}/${s3UniqueId}/${objKey}/${fileObj.fileName}`,
                            ContentType: fileObj.fileType,
                            Metadata: fileObj?.metaData
                        };

                        const signedUrl = await new Promise((resolve, reject) => {
                            s3.getSignedUrl('putObject', s3Params, (err, url) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(url);
                                }
                            });
                        });

                        return { signedUrl, urlKey: s3Params.Key, metaData: fileObj?.metaData };
                    })
                );
            }
        }
        res.json({ preSignedObjRes, s3UniqueId, status: 200 })
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ error: 'Error generating presigned URL' });
    }
})


app.post('/GetErrorLog', verifyToken, async (req, res) => {
    try {
        dbConn.initDb();
        const domainName = req.domainName[0];
        // const domainName = req.dbName;
        const caseId = req.body.caseId;
        const response = await axios.post(process.env.ERRORLOG_PORT, { caseId: caseId, domainName: domainName }).then((resp) => resp.data)
        console.log(response)
        return res.send(response);
    } catch (err) {
        console.log(err)
    } finally {
        mongoose.connection.close();
    }
})

app.delete('/DeleteCase/:id', verifyToken, async (req, res) => {
    try {
        dbConn.initDb();
        const caseId = req.params.id;
        const domainName = req.domainName[0];
        const deleteCaseUrl = process.env.DELETECASE_PROT;

        console.log(`Deleting case with ID: ${caseId} from domain: ${domainName}`);
        console.log(`DELETECASE_PROT URL: ${deleteCaseUrl}`);

        const response = await axios.post(deleteCaseUrl, { caseId: caseId, domainName: domainName }).then((resp) => resp.data);
        console.log(response);

        return res.send(response);
    } catch (err) {
        console.log('Error occurred while deleting case:', err);
        return res.status(500).send({ error: 'Failed to delete the case' });
    }
});

app.post('/generatePdf', verifyToken, initMiddleware, async (req, res, next) => {
    const { dbName } = req.user;
    const { caseId, typeOfDemandDraft } = req.body;
    const db = useDB(dbName);
    const Case = db.model("cases", CaseSchema);
    const caseData = await Case.findById(caseId).lean();

    const docxFileType = DEMAND_TYPE[typeOfDemandDraft]?.key

    if (!caseData) {
        return BaseController.SendErrorResponse(res, { message: `Case Not Found` })
    }

    if (!caseData?.docxFiles?.[docxFileType]) {
        return BaseController.SendErrorResponse(res, { message: `Demand Draft Not Found` })
    }

    let s3FilePath = caseData?.docxFiles?.[docxFileType];

    try {
        const s3DocxSignedUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3FilePath,
        });

        return BaseController.SendSuccessResponse(res, { data: { wordUrl: s3DocxSignedUrl } })

    } catch (error) {
        next(error)
    }
});

const loadJsonFile = (filename) => {
    try {
      const filePath = path.join(__dirname, './demand_pro_initial_db', filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading file ${filename}:`, error);
      throw error;
    }
  };

async function seedCollection(db, collectionName, filename) {
    try {
      const collection = db.collection(collectionName);
      const data = loadJsonFile(filename);
      
      // Insert the data
      await collection.deleteMany({});
      const result = await collection.insertMany(data);
      console.log(`${result.insertedCount} documents inserted into ${db.databaseName}.${collectionName}`);
      
      return result;
    } catch (error) {
      console.error(`Error seeding ${db.databaseName}.${collectionName}:`, error);
      throw error;
    }
  }

app.post('/seed', initMiddleware, async (req, res, next) => {

    try {
        const masterDb = useDB();
        await seedCollection(masterDb, 'companies', 'master.companies.json');
        await seedCollection(masterDb, 'userrecords', 'master.userrecords.json');
        await seedCollection(masterDb, 'users', 'master.users.json');
        const db = useDB('sonu');
        await seedCollection(db, 'demandtemplates', 'sonu.demandtemplates.json');
        await seedCollection(db, 'users', 'sonu.users.json');

        return BaseController.SendSuccessResponse(res, { success: true })

    } catch (error) {
        next(error)
    }
});
// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));

// error handler
app.use(function (err, req, res, next) {
    console.log(err);
    return BaseController.apisResponse(res, {
        message: err.message,
        success: false,
        statusCode: 400
    })
});

app.listen(9005, () => {
    console.log(`api running on 9005`);
});

module.exports.handler = serverless(app);
