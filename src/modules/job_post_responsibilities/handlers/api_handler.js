const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getAllJobPostResponsibilitiesByJobPostId = async (req, res) => {
    const payload = {job_post_id: req.params.job_post_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllJobPostResponsibilitiesParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllJobPostResponsibilitiesByJobPostId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertJobPostResponsibility = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.addJobPostResponsibilityParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertJobPostResponsibility(validatePayload.data);
    return sendResponse(result,res);
}

const updateJobPostResponsibility = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.updateJobPostResponsibilityParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateJobPostResponsibility(validatePayload.data);
    return sendResponse(result,res);
}

const deleteJobPostResponsibility = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteJobPostResponsibilityParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteJobPostResponsibility(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getAllJobPostResponsibilitiesByJobPostId,
    insertJobPostResponsibility,
    updateJobPostResponsibility,
    deleteJobPostResponsibility
}