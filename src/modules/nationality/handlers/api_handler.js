const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// GET ALL Languages
const getAllLanguages = async (req, res) => {
    const payload = { worker_id: req.userMeta.worker_id };
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllLanguagesParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllLanguagesByWorkerId(validatePayload.data);
    return sendResponse(result, res);
};

// INSERT Languages
const insertLanguages = async (req, res) => {
    const payload = { ...req.body, worker_id: req.userMeta.worker_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.addLanguagesParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertLanguages(validatePayload.data);
    return sendResponse(result, res);
};

// UPDATE Languages
const updateLanguages = async (req, res) => {
    const payload = { ...req.body, worker_id: req.userMeta.worker_id, ...req.params };
    const validatePayload = validator.isValidPayload(payload, commandModel.updateLanguagesParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateLanguages(validatePayload.data);
    return sendResponse(result, res);
};

// DELETE Languages
const deleteLanguages = async (req, res) => {
    const payload = { ...req.params, worker_id: req.userMeta.worker_id };
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteLanguagesParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteLanguages(validatePayload.data);
    return sendResponse(result, res);
};

module.exports = {
    getAllLanguages,
    insertLanguages,
    updateLanguages,
    deleteLanguages
};
