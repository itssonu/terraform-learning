const { promisify } = require('util');
const { anthropicClient } = require('../src/utils/aws/client');
const sleep = promisify(setTimeout);

const cleanJsonResponse = (response) => {
    if (!response) return response;    

    try {
        JSON.parse(response);
        return response;
    } catch (error) {
        console.log("Initial JSON parse failed:", error.message);
    }

    try {
        if (typeof response === 'string' && response.trim().startsWith('```')) {
            // Extract content between triple backticks
            const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match && match[1]) {
                response = match[1].trim();
                return response
            }
        }
    } catch (error) {
        console.log("Couldn't manually parse out ```json ``` and preserve json object")
    }
    
    if (response.trim().startsWith('```')) {
        const tripleBacktickMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (tripleBacktickMatch && tripleBacktickMatch[1]) {
            const extracted = tripleBacktickMatch[1].trim();
            try {
                JSON.parse(extracted);
                return extracted;
            } catch (e) {
                console.log("Parsing extracted content failed:", e.message);
            }
        }
    }
    
    let cleaned = response.replace(/`/g, '');
    cleaned = cleaned.replace(/^\s*json\s*/, '');
    
    try {
        JSON.parse(cleaned);
        return cleaned;
    } catch (e) {
        console.log("Parsing after backtick removal failed:", e.message);
    }
    
    // Extract JSON object directly using braces
    const startBrace = cleaned.indexOf('{');
    const endBrace = cleaned.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && startBrace < endBrace) {
        const extractedJson = cleaned.substring(startBrace, endBrace + 1);
        try {
            JSON.parse(extractedJson);
            return extractedJson;
        } catch (e) {
            console.log("Parsing extracted JSON failed:", e.message);
        }
    }
    
    // Last resort: try to fix common JSON syntax errors
    try {
        // Replace single quotes with double quotes
        let fixedJson = cleaned.replace(/'/g, '"');
        // Ensure property names are double-quoted
        fixedJson = fixedJson.replace(/(\w+):/g, '"$1":');
        JSON.parse(fixedJson);
        return fixedJson;
    } catch (e) {
        console.log("Final JSON fixing attempt failed:", e.message);
    }
    
    console.error("All JSON extraction methods failed for response:", response);
    return '{"error": "Failed to parse JSON response"}';
};

const processFilesTotalRequest = async (chunkSize, subjective) => {
    let index = 0;
    let totalRequests = 0;
    while (index < subjective.length) {
        totalRequests += 1;
        index += chunkSize;
    }
    return totalRequests
}

const processAi = async ({content, jsonValidator = null, model_temperature = 0, max_output_tokens = 64000, model_id = "claude-3-7-sonnet-20250219", thinking = false}) => {
    const retries = 20;
    const delay = 1000;
    const rateLimitDelay = 4000
    const timeout = 1000000;

    let rateLimitRetries = 0
    let previouscontent = "";
    let jsonfailed = false;
    let jsonfailcount = 0;
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            if (jsonfailcount > 3) {
                return '{"objectiveFindings": "no-data"}';
            }

            if (jsonValidator && attempt === 0) {
                content += "\n\nCRITICAL: Your response MUST be a raw JSON object WITHOUT any markdown formatting. DO NOT include backticks (`) or code block indicators (```json). Return ONLY the raw JSON object starting with { and ending with }.";
            }

            if (attempt > 0) {
                console.log(`Retry attempt ${attempt + 1} for LLM call`);
                console.log(`JSON Format Retry attempt ${jsonfailcount} for LLM call`);
            }

            // Add feedback for JSON validation if it's not the first attempt
            if (attempt > 0 && attempt < 3 && jsonValidator && jsonfailed) {
                content = content + `
                LLM RESPONSE:
                ` + previouscontent + "\n\nERROR: The previous response included markdown formatting with backticks. DO NOT include any backticks (`) or code block indicators (```json). Your response must be ONLY the raw JSON object starting with { and ending with }.";
                jsonfailcount = jsonfailcount + 1;
            }

            let converseInput = {};
    
            converseInput = {
                model: model_id,
                messages: [
                    {
                        role: "user",
                        content: content,
                    },
                ],
                max_tokens: max_output_tokens,
                temperature: thinking ? 1 : model_temperature
            };

            if (thinking) {
                converseInput.thinking = {
                    type: "enabled",
                    budget_tokens: parseInt(max_output_tokens/2)
                };
            }

            let result = await anthropicClient.messages.create(converseInput);
            let data = result?.content?.at(-1)?.text || "No-Data";

            // Clean any JSON responses
            if (jsonValidator) {
                data = cleanJsonResponse(data);
            }

            // Now validate if needed
            if (jsonValidator) {
                try {
                    JSON.parse(data);
                } catch (error) {
                    console.log("JSON validation failed. Error:", error.message);
                    console.log("Failed JSON data:", data);
                    jsonfailed = true;
                    previouscontent = data;
                    await sleep(delay * Math.pow(attempt, 2));
                    continue;
                }
            }

            return data;
        } catch (error) {
            console.log(`Error in ProcessAi (attempt ${attempt + rateLimitRetries + 1}):`, error);
            
            // Safer rate limit detection
            const isRateLimit = 
                error.status === 429 || 
                (error.message && typeof error.message === 'string' && error.message.toLowerCase().includes('rate limit')) ||
                (error.error && typeof error.error === 'string' && error.error.toLowerCase().includes('rate limit')) ||
                (error.error && error.error.type && typeof error.error.type === 'string' && error.error.type.toLowerCase().includes('rate_limit')) ||
                (error.type && typeof error.type === 'string' && error.type.toLowerCase().includes('rate_limit'));
            
            if (attempt === retries - 1) {
                return '{"error": "no-data"}';
            }
            
            if (isRateLimit) {
                console.log("Rate limit detected, waiting before retry without incrementing attempt count");
                rateLimitRetries++;
                await sleep(rateLimitDelay * Math.pow(rateLimitRetries, 2));
            } else {
                await sleep(delay * Math.pow(attempt, 2));
            }
        }
    }
    return '{"error": "no-data"}';
};

module.exports = {
    processAi,
    processFilesTotalRequest
}
