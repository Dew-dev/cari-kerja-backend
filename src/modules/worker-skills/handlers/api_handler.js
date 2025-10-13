const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getAllWorkerSkills = async (req, res) => {
    const payload = {worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, queryModel.getAllWorkerSkillsParam);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getAllWorkerSkillsByWorkerId(validatePayload.data);
    return sendResponse(result,res);
}

// command
const insertWorkerSkills = async (req, res) => {
    const payload = {...req.body, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.addWorkerSkillsParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.insertWorkerSkills(validatePayload.data);
    return sendResponse(result,res);
}

const deleteWorkerSkills = async (req, res) => {
    const payload = {...req.params, worker_id: req.userMeta.worker_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerSkillsParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.deleteWorkerSkills(validatePayload.data);
    return sendResponse(result,res);
}

module.exports = {
    getAllWorkerSkills,
    insertWorkerSkills,
    deleteWorkerSkills
}