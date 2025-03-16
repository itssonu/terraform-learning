const { processAi } = require("./ChatGptPdfProcessor");
const { saveErrorLog } = require("./SaveChatGptResponse");

const policeReportChatGptProcessor = async (fileText, liability, caseId, userId, domainName) => {
  try {
    const maxTokensSize = 90000
    let combinedObject = [];

    const prompt =
      `This is a police report that requires analysis and the generation of a summary.
            Additionally, the cause of the accident, along with the corresponding legal code, needs to be provided.
            Please ensure that the output is presented in one paragraph and exclude the time conversion portion from the final text.
            It's not necessary to pick an area of impact.

           "Please extract information about the gender of the parties. Use honorifics before a name according to their gender."
            No need to mention vehicle 1 or vehicle 2. Simply refer to them as 'vehicle'
            Kindly mention the party name instead of using a number or hashtag. Additionally, provide the lane number instead of a hashtag followed by a number.
            Give me the output without any additional text or explanation.
          `;


    for (let i = 0; i < fileText.length; i += maxTokensSize) {
      const textChunk = fileText.substr(i, maxTokensSize); // Get text according size
      let conncatString = `${prompt} ${textChunk}`;
      let responseData = await processAi({content: conncatString});
      combinedObject.push(responseData)
    }
    const policeReportSummary = combinedObject.join('').replace(/P-1/g, liability?.name).replace(/P-2/g, liability?.faulterName)
    console.log('Refinning Done policeReportSummary', policeReportSummary)
    return policeReportSummary
  } catch (e) {
    console.log(e)
    const errorCode = 500
    const errorDescription = e.message
    await saveErrorLog(caseId, userId, errorCode, errorDescription, domainName);
  }
}


module.exports = {
  policeReportChatGptProcessor
}