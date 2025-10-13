const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getRecruiterByUserId = async(req, res) => {
    const payload = req.params;
    const validatePayload = validator.isValidPayload(payload, queryModel.getRecruiterByUserIdParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getRecruiterByUserId(validatePayload.data);
    return sendResponse(result, res);
};

const updateOneRecruiter = async (req, res) => {
    const payload = {...req.body, ...req.params};
    const validatePayload = validator.isValidPayload(payload, commandModel.updateRecruiterParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateOneRecruiter(validatePayload.data);
    return sendResponse(result, res);
};

const updateOneRecruiterSelf = async (req, res) => {
    const payload = {user_id: req.userMeta.id, id: req.userMeta.recruiter_id, ...req.body};
    console.log(payload.id);
    const validatePayload = validator.isValidPayload(payload, commandModel.updateRecruiterParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.updateOneRecruiter(validatePayload.data);
    return sendResponse(result, res);
}

module.exports = {
    getRecruiterByUserId,
    updateOneRecruiter,
    updateOneRecruiterSelf
}

