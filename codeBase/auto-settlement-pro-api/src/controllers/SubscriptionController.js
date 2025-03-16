const CompaniesSchema = require("../db/models/Companies");
const dbConn = require('../db/dbConnection');
const { useDB } = require("../utils/dbUtil");
const BaseController = require("./BaseController");
const {ChargeBee} = require("chargebee-typescript");

class SubscriptionController extends BaseController {

    static async renewSubscription(req, res, next) {
        try {
            var chargebee = new ChargeBee();
            chargebee.configure({site : "aidemandpro", api_key : "live_06sSQ2XZN1GNZXmoVVvWRCgRextU4ePk"});
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            dbConn.initDb();
            const db = useDB()
            const Companies = db.model("companies", CompaniesSchema);

            const companies = await Companies.find({
                'subscription.subscriptionRenewalDate': {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            console.log('Date of renewal: ', endOfDay.toString())
            console.log("Companies to be processed today: ", companies)

            for (const company of companies) {
                const { monthlyPrice, demandsPerMonth, usersLimit, costPerAdditionalUser, costPerAdditionalDemand, subscriptionRenewalDate, remainingDemand, remainingUser, rollOverCredits, totalAlaCarteCases } = company.subscription
                const extraDemandCreated = remainingDemand < 0 ? Math.abs(remainingDemand) : 0;
                const extraUserCreated = remainingUser < 0 ? Math.abs(remainingUser) : 0;

                const totalBill = (
                    (extraDemandCreated * costPerAdditionalDemand) +
                    (extraUserCreated * costPerAdditionalUser)
                );

                console.log('For comapny: ', company.domainName.split('.').at(0));
                console.log('Total bill of the month is = ', totalBill);

                // reset values
                const nextRenewalDate = new Date(subscriptionRenewalDate);
                nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
                company.subscription.subscriptionRenewalDate = nextRenewalDate;

                company.subscription.remainingDemand = demandsPerMonth;

                if (extraUserCreated) {
                    company.subscription.remainingUser = 0;
                }

                if (!extraDemandCreated) {
                    company.subscription.rollOverCredits += remainingDemand;
                }

                company.subscription.totalAlaCarteCases += extraDemandCreated;

                const listCustomers = () => {
                    return new Promise((resolve, reject) => {
                        chargebee.customer.list({
                            company : { is : company.domainName.split('.').at(0) }
                        }).request((error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        });
                    });
                };

                const createCharge = (customerId, amount) => {
                    if (!amount || amount <= 0) {
                        throw new Error('Invalid amount');
                    }
                
                    const amountInCents = Math.round(amount * 100);
                    
                    return new Promise((resolve, reject) => {
                        chargebee.invoice.create_for_charge_items_and_charges({
                            customer_id : customerId,
                            auto_collection: "on",
                            charges : [
                              {
                                amount: amountInCents,
                                description: `Charge for ${extraDemandCreated} extra demands generated over monthly limit`
                              }]
                          }).request((error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        });
                    });
                };

                try {
                    console.log("In Chargebee processing")
                    const customers = await listCustomers();
                    
                    console.log("Customers matching company domain name, SHOULD ONLY BE 1: ", customers)
                    for (const entry of customers.list) {
                        const customerId = entry.customer.id;
                        const amount = totalBill; // Calculate your variable amount here

                        if (amount > 0) {
                            const chargeResult = await createCharge(customerId, amount);
                            console.log(`Created charge for customer ${customerId}:`, chargeResult.invoice);
                        } else {
                            console.log(`No A la carte charges needed for customer ${customerId}`)
                        }
                        
                    }
                } catch (error) {
                    console.error('Error processing company:', company, error);
                }

                await company.save();
            }

            BaseController.SendSuccessResponse(res, { message: 'subscription renew successfully' })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = SubscriptionController