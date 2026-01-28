const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getAllJobPostRequirementsByJobPostId = async (req, res) => {
    const payload = {job_post_id: req.params};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllJobPostRequirementsParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllJobPostRequirementsByJobPostId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertJobPostRequirements = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params.job_post_id, recruiter_id: req.userMeta.recruiter_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.addJobPostRequirementParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertJobPostRequirements(validatePayload.data);
    return sendResponse(result,res);
}

const updateJobPostRequirements = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params, recruiter_id: req.userMeta.recruiter_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.updateJobPostRequirementParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateJobPostRequirements(validatePayload.data);
    return sendResponse(result,res);
}

const deleteJobPostRequirements = async (req, res) => {
    const payload = {...req.body, job_post_id: req.params, recruiter_id: req.userMeta.recruiter_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteJobPostRequirementParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteJobPostRequirements(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getAllJobPostRequirementsByJobPostId,
    insertJobPostRequirements,
    updateJobPostRequirements,
    deleteJobPostRequirements
}