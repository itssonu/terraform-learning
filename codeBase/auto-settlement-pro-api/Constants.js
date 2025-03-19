const Constants = {

    chatGpt: {

        config: {
            // uncomment line 7,8,9 if we are using paid ChatGpt API 
            organization: 'org-hau2sd9xBUdOdf7VlcnOCJ8W',
            apiKey: process.env.CHATPGPT_API_KEY,
            model: 'gpt-4o'
        },

        configApi: {
            organization: 'org-hau2sd9xBUdOdf7VlcnOCJ8W',
            apiKey: process.env.CHATPGPT_API_KEY,
            model: 'gpt-4o'
        },
        config1: {
            organization: 'org-gG0oxCkhc1yby3lk2t5OZcLc',
            apiKey: process.env.CHATPGPT_API_KEY,
            model: 'gpt-4o'
        },

        config2: {
            organization: 'org-CWwCIkztU70qNHA1hAU0BaHn',
            apiKey: process.env.CHATPGPT_API_KEY,
            model: 'gpt-4o'
        },

        config3: {
            organization: 'org-CWwCIkztU70qNHA1hAU0BaHn',
            apiKey: process.env.CHATPGPT_API_KEY,
            model: 'gpt-4o'
        },

        promptSpecifications: {
            liabilityAnalysis: `Use the information from the above given story to write the liability section of the settlement demand. Below are the things to be considered :- 
    
            1. It should begin with 1-2 paragraphs describing the 
            date, parties, location, and how the incident occurred.
            2. It should provide the information  to about the law sections which should be held to the faulty driver according to U.S.A legal codes.
            3. It should provide 1-2 paragraphs describing 
            the pertinent law for the the U.S.A and this type of accident, 
            and then analyze why the Defendant is at fault and responsible 
            for the Plaintiff’s injuries and damages.
            4. Pull pertinent information about the incident and who was found at 
            fault to include int he Liability analysis.
            5. State all the legal sections, vehicle codes and legal codes for each illegal action of faulty driver.
            6. State why faulty driver is responsible.
            7. Don't include heading at the top.
            8. Results should be in paragraphs without any heading.`,

            injuryAnalysis: `Use the information from the above given story to write the injury analysis and medical condition of Plaintiff’s, section of the settlement demand. Below are the things to be considered :- 
    
            1. Use the above information and medical records to summarize the Plaintiff’s injuries from the accident and provide a 
            basically chronology of the medical treatment underwent.
            
            2. Final paragraphs should conclude with summary of how Plaintiff’s 
            life continues to be affected by the accident at the present based 
            on info provided.
            
            3. Summary should be in points concluding all ways that Plaintiff’s life continues to be 
            negatively affected by your pain and injuries from this accident. 
            
            4. Summarize in intense, genuine but convincing details.
            
            5. Result should contain vast description and medical details.`,

            medicalBill: ` use the information from the above given story to write medical Bills section of the settlement demand. Below are the things to be considered :-

            1. Use the above information and medical bills to summerize the patients medical bills after patient discharge from the hospital

            2. Medical bills should be represented in tabular form.

            
            `,

            damageAnalysis: `Use the information from the above given story to write the damage analysis section of the settlement demand. Below are the things to be considered
            1. add title "Medical Bills Section" under this title describe all medical bills charged after medical tratment and details should be in list format.
            2. Add title "Loss of Income" under this title describe below details and following details should be list format. 
                1. write down loss all time you missed from work as a result of the
                accident or your medical treatment.
                2. summerize in details  employer, type of work, and your hourly
                income rate
            3. Medical bills should be represented in tabular form.    
            `,

            nonEconimocalDamage: `Use the information from the the given text and wrtie a short summary of nonEconomical damage.`,

            conclusion: `Use above information from the given story and write the conclusion
                1.Based on above info, provide a concluding section with a
                recommended Settlement Demand Amount
                
                2.Calculate the recommended Settlement Demand Amount at 4x the
                combined medical bills and loss of income.
                 
            `
            ,
            // documentFormat:`all above response should be object format like this 
            // {
            //     liability:''
            //     Injury Analysis: '',
            //     Damage Analysis: '',
            //     conclusion:''
            // }.`

        }

    }
}

module.exports = Constants;