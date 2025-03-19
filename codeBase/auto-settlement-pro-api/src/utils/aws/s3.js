const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
})


const s3Client = new AWS.S3();

const uploadFileToS3 = async ({ path, metaData, file, bucketName = process.env.AWS_S3_BUCKET }) => {
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: path,
            ContentType: file.mimetype,
            Metadata: metaData,
            Body: file.buffer,
        };

        uploadResult = await s3Client.upload(uploadParams).promise();
        return uploadResult;
    } catch (error) {
        throw error;
    }
};

const getObjectSignedUrl = ({ path, expireIn = 60 * 60 * 24 * 2, bucketName = process.env.AWS_S3_BUCKET }) => {
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: path,
            Expires: expireIn
        };

        const url = s3Client.getSignedUrl('getObject', uploadParams);

        return url;
    } catch (error) {
        throw error;
    }
};

const putObjectSignedUrl = async ({ path, bucketName = process.env.AWS_S3_BUCKET, metaData, contentType }) => {
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: path,
            ContentType: contentType,
            Metadata: metaData,
        };

        const url = s3Client.getSignedUrl('putObject', uploadParams);

        return url;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    uploadFileToS3,
    getObjectSignedUrl,
    putObjectSignedUrl
};