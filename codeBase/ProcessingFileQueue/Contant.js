const Constants = {
    localStoreObj :{
      caseLoadingObj : "caseLoadingCalc",  
    },
    chunkSize: {
        "ER": 40000,
        "Hospital": 40000,
        "Consultation Reports": 40000,
        "MRI Other Imaging": 40000,
        "Surgery Center Reports": 40000,
        "All Other Medical Records": 40000
    },
    chatGpt: {

        config: {
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
            liabilityAnalysis: `Use the information from the above given report to write the liability section of a settlement demand. Below are the things to be considered :- 
    
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
             
        `,
            conclusionWithMedicalBills: `Use above information from the given story and write the conclusion
                1.Based on above info, provide a concluding section with a
                recommended Settlement Demand Amount.
                2.Calculate the recommended Settlement Demand Amount at 4x the
                combined medical bills.
                `,
            painAndSufferingPrePrompt: `Here is an example of a previously written pain and suffering section for a personal injury demand letter:
            
            Ms. Castro will be entitled to a significant award for her emotional distress from having a near death experience due to Ms. Ramirez, and from witnessing the horrific accident and injuries that your insured inflicted on her husband. 
Ms. Castro may be compensated for all mental suffering including her “fright, nervousness, grief, anxiety, worry, mortification, shock, humiliation and indignity.” (Burgess v. Sup.Ct., (1992) 2 Cal.4th 1064, 1985) There is no legal standard that existing for deciding these damages, and a jury will be asked to use their judgment to decide a reasonable amount and their common sense. (CACI 3905A) 
Although there is no fixed standard, the “per diem” argument that is based on the premise that a plaintiff has suffered and/or will suffer because of negligence and thus asks the jury to compensate the plaintiff with a certain sum for each day of suffering is widely accepted by the courts and is recognized by the California Supreme Court as a viable way to calculate these damages. 
Ms. Castro was forced to live through a very traumatic experience. On the night of the accident, as she was sitting with Mr. Figueroa, Ms. Ramirez’s car came barreling towards her at a high rate of speed. If it was not for Mr. Figueroa’s quick thinking and reflexes, Ms. Castro would have been completely run over, suffering death or serious bodily injury — needless to say, her life flashed before her eye. 
But her nightmare did not end there. Moments later, she looked towards Mr. Figueroa and discovered his gruesome injury that is forever burned in her memory. 
Ms. Castro lives with this nightmare Every Single Day. She has lost sleep, is constantly anxious, constantly worried, and constantly frightened about what happened to her and what happened to Mr. Figueroa. She has had to work hard to take care of Mr. Figueroa on a daily basis and has not overcome the shock of witnessing his injury and witnessing how much it has taken away from him. The magnitude of her distress is immeasurable and is even more significant when you consider that Ms. Castro is a police officer who has been able to cope and remain levelheaded even after going through all the stressful events in her line of work. For Ms. Castro, risking her life at work and seeing the things she sees at work has always been manageable because she was able to compartmentalize work from her home life — but to see something as terrible as this happen to someone she loves and holds dearly — it has been nothing less than traumatic. 
While there is no set formula to calculate her tremendous grief, we believe that starting at her work salary provides a solid basis. After all, Ms. Castro is a police officer, which is a highly stressful environment. As a police officer, Ms. Castro also has to deal with life threatening events as well, which is comparable to the life-threatening event she encountered when your insured charged at her with her vehicle. As such, Ms. Castro’s approximately $54 per hour provides a basis to measure her emotional distress damages. 
Now although Ms. Castro works a set amount of time as a police officer during the day/week, she is forced to endure her emotional distress on a daily basis at every waking hour of her day. The trauma of the event stays with her as soon as she wakes and does not stop until she is asleep. Even then, Ms. Castro is plagued with nightmares that wake her up where she sees a rush of car lights racing towards her or Mr. Figueroa’s broken leg. Because she only gets about six (6) good hours of sleep a night, she is suffering the emotional trauma for about 18 hours per day. 
As you are reading this demand, it has been about 220 days since the date of the accident. That is 220 days where Ms. Castro has suffered about 18 hours per day with the torment of the emotional distress she has been suffering from. 

`

        },
        chunkSize: 25000
    }
}

module.exports = Constants;
