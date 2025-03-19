const AWS = require('aws-sdk');
const Anthropic = require('@anthropic-ai/sdk')


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
    httpOptions: {
      timeout: 300000,      // 5 minutes for request timeout
      connectTimeout: 60000 // 1 minute for connection timeout
    },
    maxRetries: 15
})


const s3Client = new AWS.S3();
const bedrockRuntimeClient = new AWS.BedrockRuntime();
const textractClient = new AWS.Textract();
const anthropicClient = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})

module.exports = {
  s3Client,
  bedrockRuntimeClient,
  textractClient,
  anthropicClient
};
