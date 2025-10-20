const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require ("../../../helpers/utils/response");


const getOneTagByName = async(req, res) => {
    const payload = req.params;
    const validatePayload = validator.isValidPayload(payload, queryModel.getOneTagByNameParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getOneTagByName(validatePayload.data);
    return sendResponse(result, res);
}

const getTagsPerJobPost = async(req, res) => {
    const payload = req.params;
    const validatePayload = validator.isValidPayload(payload, queryModel.getTagsPerJobPostParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getTagsPerJobPost(validatePayload.data);
    return sendResponse(result, res);
}

const createJobPostTag = async(req, res) => {
    const {
        job_post_id,
    } = req.params;
    const {
        name,
    } = req.body;
    const {
        role_id,
        recruiter_id
    } = req.userMeta;
    const payload = {name, job_post_id, role_id, recruiter_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.createJobPostTagParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.createJobPostTag(validatePayload.data);
    return sendResponse(result, res);
}


module.exports = {
    getTagsPerJobPost,
    getOneTagByName,
    createJobPostTag,
}