const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getAllPortofolios = async (req, res) => {
    const payload = {worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllPortofoliosParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllPortofoliosByWorkerId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertPortofolios= async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.addPortofoliosParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertPortofolios(validatePayload.data);
    return sendResponse(result,res);
}

const updatePortofolios = async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id, ...req.params};
    const validatePayload = validator.isValidPayload(payload, commandModel.updatePortofoliosParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updatePortofolios(validatePayload.data);
    return sendResponse(result,res);
}

const deletePortofolios = async (req, res) => {
    const payload = {...req.params, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.deletePortofoliosParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deletePortofolios(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getAllPortofolios,
    insertPortofolios,
    updatePortofolios,
    deletePortofolios
}