const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getWorkExperienceById = async (req,res) => {
    const payload = {...req.params, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getOneWorkExpParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getWorkExperienceById(validatePayload.data);
    return sendResponse(result,res);
}

const getAllWorkExperiences = async (req, res) => {
    const payload = {worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllWorkExpParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllWorkExperiencesByWorkerId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertWorkExperience = async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id};
    const { created_at, updated_at, ...payloadWithoutTimestamps } = payload;
    const validatePayload = validator.isValidPayload(payloadWithoutTimestamps, commandModel.addWorkExperienceParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertWorkExperience(validatePayload.data);
    return sendResponse(result,res);
}

const updateWorkExperience = async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id, ...req.params};
    const { created_at, updated_at, ...payloadWithoutTimestamps } = payload;
    const validatePayload = validator.isValidPayload(payloadWithoutTimestamps, commandModel.updateWorkExperienceParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateWorkExperience(validatePayload.data);
    return sendResponse(result,res);
}

const deleteWorkExperience = async (req, res) => {
    const payload = { ...req.params };
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkExperienceParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteWorkExperience(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getWorkExperienceById,
    getAllWorkExperiences,
    insertWorkExperience,
    updateWorkExperience,
    deleteWorkExperience
}