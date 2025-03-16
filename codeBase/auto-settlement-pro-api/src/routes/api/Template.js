var router = require('express').Router();
const { TemplateController } = require('../../controllers');

router.get("/getAllDemandTemplates", TemplateController.getAllDemandTemplates)
router.get("/getDemandTemplate/:demandType/:caseType/:state", TemplateController.getDemandTemplate)
router.delete("/deleteDemandTemplate/:demandType/:caseType/:state", TemplateController.deleteDemandTemplate)
router.post("/addUpdateDemandTemplate", TemplateController.addUpdateDemandTemplate)

router.get("/getTemplateSettings", TemplateController.getTemplateSettings)
router.post("/addUpdateTemplateSettings", TemplateController.addUpdateTemplateSettings)

module.exports = router