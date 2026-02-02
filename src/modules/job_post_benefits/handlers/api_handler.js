const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getAllJobPostBenefitsByJobPostId = async (req, res) => {
    const payload = {job_post_id: req.params.job_post_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllJobPostBenefitsParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllJobPostBenefitsByJobPostId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertJobPostBenefit = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.addJobPostBenefitParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertJobPostBenefit(validatePayload.data);
    return sendResponse(result,res);
}

const updateJobPostBenefit = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.updateJobPostBenefitParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateJobPostBenefit(validatePayload.data);
    return sendResponse(result,res);
}

const deleteJobPostBenefit = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteJobPostBenefitParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteJobPostBenefit(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getAllJobPostBenefitsByJobPostId,
    insertJobPostBenefit,
    updateJobPostBenefit,
    deleteJobPostBenefit
}