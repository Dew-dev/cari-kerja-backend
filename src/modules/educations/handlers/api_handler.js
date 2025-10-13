const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getEducationsById = async (req,res) => {
    const payload = {...req.params, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getOneEducationParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getEducationsById(validatePayload.data);
    return sendResponse(result,res);
}

const getAllEducations = async (req, res) => {
    const payload = {worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllEducationsParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllEducationsByWorkerId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertEducations = async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.addEducationsParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertEducations(validatePayload.data);
    return sendResponse(result,res);
}

const updateEducations = async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id, ...req.params};
    const validatePayload = validator.isValidPayload(payload, commandModel.updateEducationsParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateEducations(validatePayload.data);
    return sendResponse(result,res);
}

const deleteEducations = async (req, res) => {
    const payload = {...req.params, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteEducationsParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteEducations(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getEducationsById,
    getAllEducations,
    insertEducations,
    updateEducations,
    deleteEducations
}