const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const listTemplates = async (req, res) => {
  const payload = { recruiter_id: req.userMeta.recruiter_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.listTemplatesParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.listTemplates(validatePayload.data);
  return sendResponse(result, res);
};

const createTemplate = async (req, res) => {
  const payload = {
    recruiter_id: req.userMeta.recruiter_id,
    name: req.body.name,
    subject: req.body.subject,
    body: req.body.body,
    channel: req.body.channel,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.createTemplateParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.createTemplate(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateTemplate = async (req, res) => {
  const payload = {
    id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id,
    name: req.body.name,
    subject: req.body.subject,
    body: req.body.body,
    channel: req.body.channel,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.updateTemplateParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateTemplate(validatePayload.data);
  return sendResponse(result, res);
};

const deleteTemplate = async (req, res) => {
  const payload = {
    id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.deleteTemplateParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteTemplate(validatePayload.data);
  return sendResponse(result, res);
};

const bulkSend = async (req, res) => {
  const payload = {
    recruiter_id: req.userMeta.recruiter_id,
    channel: req.body.channel,
    template_id: req.body.template_id,
    subject: req.body.subject,
    body: req.body.body,
    application_ids: req.body.application_ids,
    job_post_id: req.body.job_post_id,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.bulkSendParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.bulkSend(validatePayload.data);
  return sendResponse(result, res, 201);
};

const listCampaigns = async (req, res) => {
  const payload = {
    ...req.query,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.listCampaignsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.listCampaigns(validatePayload.data);
  return paginationResponse(result, res);
};

const getCampaign = async (req, res) => {
  const payload = {
    id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getCampaignParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getCampaign(validatePayload.data);
  return sendResponse(result, res);
};

const getWorkerPreferences = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkerPreferencesParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getWorkerPreferences(validatePayload.data);
  return sendResponse(result, res);
};

const updateWorkerPreferences = async (req, res) => {
  const payload = {
    worker_id: req.userMeta.worker_id,
    email_opt_out: req.body.email_opt_out,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateWorkerPreferencesParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateWorkerPreferences(validatePayload.data);
  return sendResponse(result, res);
};

const unsubscribe = async (req, res) => {
  const payload = { token: req.params.token };

  const validatePayload = validator.isValidPayload(payload, commandModel.unsubscribeParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.unsubscribeByToken(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  bulkSend,
  listCampaigns,
  getCampaign,
  getWorkerPreferences,
  updateWorkerPreferences,
  unsubscribe,
};
