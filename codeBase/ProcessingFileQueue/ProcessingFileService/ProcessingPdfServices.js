const path = require('path');
const mongoose = require("mongoose");
const { spawn } = require('child_process');
const fs = require('fs');
const CaseSchema = require('../src/db/models/Case');
const { s3Client, textractClient } = require('../src/utils/aws/client');
const crypto = require('crypto');
const os = require('os');
const { getLocalStorevalue } = require('../src/utils/localStore');
const { localStoreObj, gsPath } = require('../Contant');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithExponentialBackoff(operation, maxRetries = 15, initialDelay = 1000) {
    let retries = 0;
    while (true) {
        try {
            return await operation();
        } catch (error) {
            // Log the full error for debugging
            console.log("Operation failed with error:", error);
            
            // Check if error is retryable
            const isThrottling = error.code === 'ProvisionedThroughputExceededException';
            const isNetworkError = [
                'TimeoutError', 'NetworkingError', 'ETIMEDOUT', 
                'ECONNRESET', 'ECONNREFUSED'
            ].includes(error.code);
            
            if ((isThrottling || isNetworkError || error.retryable) && retries < maxRetries) {
                const delay = initialDelay * Math.pow(2, retries);
                const jitteredDelay = delay * (0.8 + Math.random() * 0.4); // Add jitter
                
                console.log(`Request failed with ${error.code}. Retrying in ${Math.round(jitteredDelay)}ms... (Attempt ${retries + 1}/${maxRetries})`);
                await sleep(jitteredDelay);
                retries++;
            } else {
                throw new Error(`Maximum retries (${maxRetries}) exceeded or non-retryable error: ${error.message}`);
            }
        }
    }
}


async function getObjectFromS3(s3FilePath) {
    const params = { Bucket: process.env.AWS_S3_BUCKET, Key: s3FilePath };
    const data = await s3Client.getObject(params).promise();
    return data;
}

async function uploadImagesToS3(imagesBufferArr, s3ExhibitPath, fileIndex) {
    const uploadPromises = imagesBufferArr.map((buffer, pageIndex) => {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            // Ensure consistent ordering by using both file and page index
            Key: `${s3ExhibitPath}-${String(fileIndex).padStart(5, '0')}-${String(pageIndex).padStart(5, '0')}.jpg`,
            Body: buffer,
            ContentType: 'image/jpeg'
        };

        return s3Client.upload(params).promise();
    });

    return Promise.all(uploadPromises);
}

async function convertExhibitFiles(pdfBuffer,exhibitDirectoryName) {
    try {
        console.log("inside convertExhibitFiles");
        
        // First, count the number of pages in the PDF
        const pageCount = await robustCountPdfPages(pdfBuffer);
        console.log(`PDF has ${pageCount} pages`);
        
        // Check if the PDF exceeds the page limit
        if (pageCount > 150) {
            console.log("PDF exceeds 150 page limit, skipping conversion");
            return { tooLarge: true, pageCount, exceededPageLimit: true };
        }
        
        const caseLoadingCalc = getLocalStorevalue(localStoreObj.caseLoadingObj);

        if(exhibitDirectoryName === "medicalRecordsExhibitDirectoryPath"){
            caseLoadingCalc.updateTimer("medicalRecords",pageCount);
        }else if(exhibitDirectoryName === "preMedicalRecordsExhibitDirectoryPath"){
            caseLoadingCalc.updateTimer("preMedicalRecords",pageCount);
        }   

        // Continue with the original conversion process
        return new Promise((resolve, reject) => {
            const gs = spawn(gsPath, [
                '-sDEVICE=jpeg',
                '-dNOPAUSE',
                '-dBATCH',
                '-dSAFER',
                '-r200',
                '-sOutputFile=%stdout',
                '-dNumRenderingThreads=4',
                '-c 3000000000 setvmthreshold',
                '-dBufferSpace=3000000000',
                '-dNOGC',
                '-'
            ]);

            const imageBuffers = [];
            let imageBuffer = Buffer.alloc(0);

            gs.stdout.on('data', (data) => {
                imageBuffer = Buffer.concat([imageBuffer, data]);
            });

            gs.stdout.on('end', () => {
                // Split the buffer into multiple images by detecting JPEG markers
                console.log("splitting gs buffer into jpegs");
                let start = 0;
                for (let i = 0; i < imageBuffer.length - 1; i++) {
                    if (imageBuffer[i] === 0xFF && imageBuffer[i + 1] === 0xD8) {
                        start = i;
                    }
                    if (imageBuffer[i] === 0xFF && imageBuffer[i + 1] === 0xD9) {
                        console.log("saved image ", imageBuffers.length, "from gs buffer");
                        imageBuffers.push(imageBuffer.slice(start, i + 2));
                    }
                }
                resolve(imageBuffers);
            });

            gs.stderr.on('data', data => {
                console.error(`Ghostscript stderr: ${data}`);
            });

            gs.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`Ghostscript process exited with code ${code}`));
                }
            });

            gs.stdin.write(pdfBuffer);
            gs.stdin.end();
        });
    } catch (e) {
        console.log("Error in GhostScript");
        console.log(e);
        throw e;
    }
}

// Improved function to count pages in a PDF using Ghostscript
async function countPdfPages(pdfBuffer) {
    return new Promise((resolve, reject) => {
        // Write the PDF buffer to a temporary file
        const tempFilePath = path.join(
            os.tmpdir(),
            `pdf-${crypto.randomBytes(6).toString('hex')}.pdf`
          );
        fs.writeFileSync(tempFilePath, pdfBuffer);

        const escapedPath = tempFilePath.replace(/\\/g, '/');
        
        const gs = spawn(gsPath, [
            '-q',
            '-dNODISPLAY',
            '-c',
            `(${escapedPath}) (r) file runpdfbegin pdfpagecount = quit`
        ]);

        let output = '';
        let errorOutput = '';

        gs.stdout.on('data', (data) => {
            output += data.toString();
        });

        gs.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Page count stderr: ${data}`);
        });

        gs.on('error', (error) => {
            // Clean up the temporary file
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                console.error('Error deleting temporary file:', e);
            }
            reject(error);
        });

        gs.on('close', (code) => {
            // Clean up the temporary file
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                console.error('Error deleting temporary file:', e);
            }
            
            if (code !== 0) {
                return reject(new Error(`Page count process exited with code ${code}: ${errorOutput}`));
            }
            
            // Parse the output to get the page count
            const pageCount = parseInt(output.trim(), 10);
            if (isNaN(pageCount)) {
                return reject(new Error('Failed to determine page count'));
            }
            
            resolve(pageCount);
        });
    });
}

async function splitPdf({ pdfBuffer, fromPageNumber, toPageNumber }) {
    return new Promise((resolve, reject) => {
        // Create unique temporary file names
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const tempInputPath = path.join(os.tmpdir(), `input-${uniqueId}.pdf`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${uniqueId}.pdf`);

        // Helper function to clean up temporary files
        function cleanupFiles() {
            try {
                if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
                if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
            } catch (cleanupError) {
                console.error('Error cleaning up temporary files:', cleanupError);
            }
        }

        try {
            // Write the input PDF to a temporary file
            fs.writeFileSync(tempInputPath, pdfBuffer);

            // Normalize paths for Ghostscript
            const escapedInputPath = tempInputPath.replace(/\\/g, '/');
            const escapedOutputPath = tempOutputPath.replace(/\\/g, '/');

            // Construct Ghostscript command
            const gsProcess = spawn(gsPath, [
                '-q',                         // Quiet mode
                '-dNOPAUSE',                  // Don't pause between pages
                '-dBATCH',                    // Exit after processing
                '-dSAFER',                    // Secure mode
                '-sDEVICE=pdfwrite',          // Output device is PDF
                `-dFirstPage=${fromPageNumber}`,    // Start page
                `-dLastPage=${toPageNumber}`,       // End page
                '-dPDFSETTINGS=/prepress',    // High quality output
                '-dCompatibilityLevel=1.7',   // PDF version compatibility
                `-sOutputFile=${escapedOutputPath}`,
                escapedInputPath
            ]);

            let errorOutput = '';

            // Collect any error output
            gsProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            // Handle process errors
            gsProcess.on('error', (error) => {
                cleanupFiles();
                reject(new Error(`Ghostscript process error: ${error.message}`));
            });

            // Handle process completion
            gsProcess.on('close', (code) => {
                if (code !== 0) {
                    cleanupFiles();
                    return reject(new Error(`Ghostscript exited with code ${code}: ${errorOutput}`));
                }

                try {
                    // Read the output file into a buffer
                    const resultBuffer = fs.readFileSync(tempOutputPath);
                    cleanupFiles();
                    resolve(resultBuffer);
                } catch (readError) {
                    cleanupFiles();
                    reject(new Error(`Failed to read output PDF: ${readError.message}`));
                }
            });

        } catch (error) {
            cleanupFiles();
            reject(new Error(`PDF splitting failed: ${error.message}`));
        }
    });
}

const repairPdf = async (pdfBuffer) => {
    // Create a temporary file for the repaired PDF
    const tempRepairedPath = path.join(
        os.tmpdir(),
        `repaired-${crypto.randomBytes(6).toString('hex')}.pdf`
    );
    
    const tempInputPath = path.join(
        os.tmpdir(),
        `input-${crypto.randomBytes(6).toString('hex')}.pdf`
    );
    
    fs.writeFileSync(tempInputPath, pdfBuffer);
    
    return new Promise((resolve, reject) => {
        // Use gs to "repair" the PDF by writing it again
        const gs = spawn(gsPath, [
            "-q", 
            "-dNOPAUSE", 
            "-dBATCH", 
            "-sDEVICE=pdfwrite",
            `-sOutputFile=${tempRepairedPath}`,
            tempInputPath
        ]);
        
        gs.on('error', (error) => {
            fs.unlinkSync(tempInputPath);
            reject(error);
        });
        
        gs.on('close', (code) => {
            fs.unlinkSync(tempInputPath);
            if (code !== 0) {
            return reject(new Error(`PDF repair failed with code ${code}`));
            }
            const repairedBuffer = fs.readFileSync(tempRepairedPath);
            fs.unlinkSync(tempRepairedPath);
            resolve(repairedBuffer);
        });
    });
};

async function robustCountPdfPages(pdfBuffer) {
    try {
        return await countPdfPages(pdfBuffer);
    } catch (error) {
        console.log("Failed with original PDF, attempting repair...");
        const repairedBuffer = await repairPdf(pdfBuffer);
        return countPdfPages(repairedBuffer);
    }
}

const isTextractJobComplete = async (client, jobId, awsServiceName = "getDocumentTextDetection") => {
    const checkStatus = async () => {
        const params = { JobId: jobId };
        const response = await client[awsServiceName](params).promise();
        return response.JobStatus;
    };

    const getResponse = async () => {
        const params = { JobId: jobId };
        const response = await client[awsServiceName](params).promise();
        return response;
    };

    while (true) {
        await sleep(1000); // Base polling interval

        try {
            const status = await retryWithExponentialBackoff(async () => await checkStatus());
            console.log(`Job status: ${status}`);

            if (status !== "IN_PROGRESS") {
                if (status === "SUCCEEDED") {
                    return status
                }
                console.error("Textract job did not succeed")
                const resp = await retryWithExponentialBackoff(async () => await getResponse());
                console.error(resp);
                return null
            }
        } catch (err) {
            console.error("Error checking job status:", err);
            throw err;
        }
    }
};

async function pageNumber(s3FilePath, exhibitDirectoryName, fileIndex) {
    try {
        const maxPagesPerChunk = 1000 //modified as requested by client
        const s3PathSplitArr = s3FilePath?.split("/");
        const s3ExhibitPath = s3PathSplitArr?.slice(0, -2)?.join("/");
        const fileName = path.basename(s3FilePath).split(".")[0];

        const object = await getObjectFromS3(s3FilePath);
        const metaData = object.Metadata;
        const pdfBuffer = object.Body;

        const imagesBufferArrPromise = convertExhibitFiles(pdfBuffer,exhibitDirectoryName);

        const chunkProcessingPromises = textractPdfFile(pdfBuffer, maxPagesPerChunk, s3FilePath, metaData);

        const [chunkProcessing, imagesBufferArr] = await Promise.all([chunkProcessingPromises, imagesBufferArrPromise]);
        let combinedTextractResults = chunkProcessing.map(chunk => chunk.textractResult).flat();

        combinedTextractResults = combinedTextractResults.map((v, k) => {
            return { pageNumber: v.pageNumber + k, text: v.text }
        })


        if (imagesBufferArr.exceededPageLimit) {
            console.log(`Skipped conversion for PDF with ${imagesBufferArr.pageCount} pages`);

            return {
                awsExhibitPaths: [],
                providerName: metaData?.providername,
                medicalType: metaData?.medicaltype,
                combinedTextractResults
            };

        } else {
            // Upload with ordered naming
            const uploadResults = await uploadImagesToS3(
                imagesBufferArr,
                `${s3ExhibitPath}/${exhibitDirectoryName}/${fileName}`,
                fileIndex
            );

            return {
                awsExhibitPaths: uploadResults,
                providerName: metaData?.providername,
                medicalType: metaData?.medicaltype,
                combinedTextractResults
            };

        }

        
    } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
    }

    async function textractPdfFile(pdfBuffer, maxPagesPerChunk, s3FilePath, metaData) {

        const pageCount = await robustCountPdfPages(pdfBuffer);
        const chunkProcessingPromises = [];
        if (pageCount > maxPagesPerChunk) {
            const numChunks = Math.ceil(pageCount / maxPagesPerChunk);

            for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
                const fromPageNumber = chunkIndex * maxPagesPerChunk + 1;
                const toPageNumber = Math.min((chunkIndex + 1) * maxPagesPerChunk, pageCount);
                const processChunk = async () => {
                    try {

                        const chunkBuffer = await splitPdf({
                            pdfBuffer,
                            fromPageNumber,
                            toPageNumber
                        });

                        const chunkKey = s3FilePath.replace(/(\.[a-zA-Z0-9]+)$/, `-pages-${fromPageNumber}-${toPageNumber}$1`);

                        await s3Client.putObject({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: chunkKey,
                            Body: chunkBuffer,
                            Metadata: metaData,
                        }).promise();

                        const jobID = await startTextractJob(textractClient, chunkKey);

                        await isTextractJobComplete(textractClient, jobID);

                        const chunkTextractResult = await getTextractJobResults(textractClient, jobID);

                        // Clean up the temporary chunk file
                        console.log(`Cleaning up temporary chunk file: ${chunkKey}`);
                        await s3Client.deleteObject({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: chunkKey
                        }).promise();

                        // Return the Textract results with page information
                        return {
                            pageCount,
                            pageRange: { from: fromPageNumber, to: toPageNumber },
                            textractResult: chunkTextractResult
                        };
                    } catch (error) {
                        console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
                        throw error;
                    }
                };

                chunkProcessingPromises.push(processChunk());
            }
        } else {
            const textractProcessing = async () => {
                const jobID = await startTextractJob(textractClient, s3FilePath);

                await isTextractJobComplete(textractClient, jobID);

                const chunkTextractResult = await getTextractJobResults(textractClient, jobID);

                return {
                    pageCount,
                    pageRange: { from: 1, to: pageCount },
                    textractResult: chunkTextractResult
                };
            };

            chunkProcessingPromises.push(textractProcessing());
        }

        return Promise.all(chunkProcessingPromises);
    }
}


const policeReportPDF = async (s3FilePath, liability, exhibitDirectoryName, caseId, domainName, fileIndex) => {
    try {
        const [{ awsExhibitPaths, combinedTextractResults: data }] = await Promise.all([
            pageNumber(s3FilePath, exhibitDirectoryName, fileIndex)
        ]);


        let imageTextValue = '';
        for (let i = 0; i < data.length; i++) {
            let extractedText = data[i].text.join(' ');
            const filtered = await filterPersonalInfo(extractedText, liability);
            imageTextValue += filtered;
        }

        // Update database with paths
        const filterAwsExhibitPaths = awsExhibitPaths.map(fileObj => fileObj.Key);
        const DbConnect = mongoose.connection.useDb(domainName);
        const CaseModal = DbConnect.model("cases", CaseSchema);
        await CaseModal.findByIdAndUpdate(caseId, {
            [`result.${exhibitDirectoryName}`]: filterAwsExhibitPaths
        });

        // Return just the text
        return imageTextValue;
    } catch (error) {
        console.log(error);
        return '';
    }
};


const startTextractJob = (client, objectName, pramsObj, awsServiceName = "startDocumentTextDetection") => {
    return retryWithExponentialBackoff(async () => {
        const params = pramsObj || {
            DocumentLocation: {
                S3Object: {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Name: objectName
                }
            }
        };

        const data = await client[awsServiceName](params).promise();
        return data.JobId;
    });
};

const getTextractJobResults = async (client, jobId, awsServiceName = "getDocumentTextDetection") => {
    const pages = [];
    let nextToken = null;

    do {
        try {
            const response = await retryWithExponentialBackoff(async () => {
                const params = { JobId: jobId };
                if (nextToken) params.NextToken = nextToken;
                return await textractClient.getDocumentTextDetection(params).promise();
            });

            const pageBlocks = response.Blocks.filter(block => block.BlockType === 'PAGE');
            const lineBlocks = response.Blocks.filter(block => block.BlockType === 'LINE');

            pageBlocks.forEach(page => {
                const pageNumber = page.Page;
                const linesOnPage = lineBlocks
                    .filter(line => line.Page === pageNumber)
                    .map(line => line.Text);
                pages.push({
                    pageNumber: pageNumber,
                    text: linesOnPage
                });
            });

            nextToken = response.NextToken;
        } catch (err) {
            console.error("Error getting job results:", err);
            throw err;
        }
    } while (nextToken);

    return pages;
};


const convertPDFToImages = async (s3FilePath, liability, exhibitDirectoryName, caseId, domainName, fileIndex) => {
    try {
        // Start both operations in parallel
        const [processedFiles] = await Promise.all([
            pageNumber(s3FilePath, exhibitDirectoryName, fileIndex)
        ]);

        const { awsExhibitPaths, providerName, medicalType, combinedTextractResults: data } = processedFiles;

        const imageTextValue = await Promise.all(
            data.map(async (item) => {
                const extractedText = item.text.join(' ');
                return filterPersonalInfo(extractedText, liability);
            })
        );

        const exhibitPaths = awsExhibitPaths.length > 150 
            ? [] 
            : awsExhibitPaths.map(fileObj => fileObj.Key);

        // Don't update database here anymore, just return the paths
        return {
            imageTextValue,
            providerName,
            medicalType,
            exhibitPaths
        };
    } catch (err) {
        console.log(err, "error in extraction");
        throw err;
    }
};

const filterPersonalInfo = async (subjective, liability) => {
    const name = liability ? liability.name : "";
    const email = liability ? liability.email : "";
    const phonePattern =
        /(\+\d{1,2}\s?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})\b/g;
    const faxPattern =
        /^(\+\d{1,3}\s?)?(\(\d{1,4}\)|\d{1,4})[-.\s]?\d{1,10}[-.\s]?\d{1,10}$/g;

    const findName = subjective.includes(name);
    if (findName) {
        subjective = subjective.replace(name, "NAME_PLACEHOLDER");
    }

    if (name) {
        const upperCase = name.toLocaleUpperCase();
        if (upperCase) {
            subjective = subjective.replace(upperCase, "NAME_PLACEHOLDER");
        }
    }

    const findEmail = subjective.includes(email);
    if (findEmail) {
        subjective = subjective.replace(email, "EMAIL_PLACEHOLDER");
    }

    subjective = subjective.replace(faxPattern, "FAX_PLACEHOLDER");

    subjective = subjective.replace(phonePattern, "PHONENUMBER_PLACEHOLDER");

    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const dobPattern =
        /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}/g;
    const DOB =
        /(DATE|DATO) OF BIRTH:\s*(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}/g;
    const dateOfBirth =
        /DOB:\s*(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}/g;
    const dateOfBirth1 =
        /DOB\s*(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}/g;
    const dateOfBirth2 =
        /Date of Birth:\s*(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}/g;
    const DOB1 = /Dato of Birth:\s*(.*)/g;
    const datePattern1 = /,\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/g;
    const datePattern =
        /D:,(0[1-9]|1[0-2])\/(0[1-9]|1[0-9]|2[0-9]|3[0-1])\/\d{2},T:,(0[1-9]|1[0-2])\/(0[1-9]|1[0-9]|2[0-9]|3[0-1])\/\d{2}/g;

    subjective = subjective.replace(DOB1, "[_DOB]");
    subjective = subjective.replace(dateOfBirth2, "[_DOB]");
    subjective = subjective.replace(dobPattern, "[_DOB]");
    subjective = subjective.replace(DOB, "[_DOB]");
    subjective = subjective.replace(dateOfBirth1, "[_DOB]");
    subjective = subjective.replace(dateOfBirth, "[_DOB]");
    subjective = subjective.replace(datePattern1, "[Date_pattern]");
    subjective = subjective.replace(datePattern, "[Date_pattern1]");

    // subjective = subjective.replace(namePattern, '[_NAME]');
    // subjective = subjective.replace(paientName3, '[_NAME]');
    // subjective = subjective.replace(patient3, '[_NAME]');
    // subjective = subjective.replace(patient1, '[_PATIENT_NAME]')
    // subjective = subjective.replace(phone1, '[_PHONE]')
    // subjective = subjective.replace(phone2, '[_PHONE]')
    // subjective = subjective.replace(patient2, '[_PATIENT_NAME]')
    // subjective = subjective.replace(patient4, '[_PATIENT_NAME]')
    // subjective = subjective.replace(patient5, '[_PATIENT_NAME]')
    // subjective = subjective.replace(patientName1, '[_PATIENT_NAME]')
    // subjective = subjective.replace(emailPattern, '[_EMAIL]');
    // subjective = subjective.replace(phonePattern, '[_PHONE]');
    // subjective = subjective.replace(patientName, '[_PATIENT_NAME]');
    // subjective = subjective.replace(addressPattern, '[_ADDRESS]')
    // subjective = subjective.replace(pationtName, '[_NAME]')
    // subjective = subjective.replace(doctorAddressPattern, '[_DOCADDRESS]')
    //
    // subjective = subjective.replace(mr, '[_NAME]');
    // subjective = subjective.replace(mrs, '[_NAME]');

    return subjective.trim();
};

const getTextAndExhibit = async (s3FilePath, liability, exhibitDirectoryName, caseId, domainName) => {
    try {
        const { awsExhibitPaths, combinedTextractResults: data } = await pageNumber(s3FilePath, exhibitDirectoryName);


        let imageTextValue = '';
        for (let i = 0; i < data.length; i++) {
            let extractedText = data[i].text.join(' ');
            const filtered = await filterPersonalInfo(extractedText, liability);
            imageTextValue += filtered;
        }

        try {

            if (awsExhibitPaths.length > 0) {
                const filterAwsExhibitPaths = awsExhibitPaths.map((fileObj) => {
                    return fileObj.Key
                })
                const DbConnect = mongoose.connection.useDb(domainName);
                const CaseModal = DbConnect.model("cases", CaseSchema);
                await CaseModal.findByIdAndUpdate(caseId, {
                    $push: {
                        [`result.${exhibitDirectoryName}`]: { $each: filterAwsExhibitPaths }
                    }
                })

            }
        } catch (error) {
            console.log("Error to convert PDf to Image", error)
        }

        return imageTextValue;
    } catch (error) {
        console.log(error);
        return;
    }
};

module.exports = {
    policeReportPDF,
    convertPDFToImages,
    getTextAndExhibit,
    splitPdf,
    robustCountPdfPages,
    isTextractJobComplete,
    pageNumber
};
