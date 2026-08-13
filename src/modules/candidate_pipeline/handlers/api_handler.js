const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const getStages = async (req, res) => {
  const payload = {
    job_post_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getStagesParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getStages(validatePayload.data);
  return sendResponse(result, res);
};

const createStage = async (req, res) => {
  const payload = {
    job_post_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
    name: req.body.name,
    stage_type: req.body.stage_type,
    position: req.body.position,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.createStageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.createStage(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateStage = async (req, res) => {
  const payload = {
    job_post_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
    stage_id: Number(req.params.stageId),
    name: req.body.name,
    color: req.body.color,
    position: req.body.position,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.updateStageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateStage(validatePayload.data);
  return sendResponse(result, res);
};

const reorderStages = async (req, res) => {
  const payload = {
    job_post_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
    stages: req.body.stages,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.reorderStagesParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.reorderStages(validatePayload.data);
  return sendResponse(result, res);
};

const deleteStage = async (req, res) => {
  const payload = {
    job_post_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
    stage_id: Number(req.params.stageId),
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.deleteStageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteStage(validatePayload.data);
  return sendResponse(result, res);
};

const getPipelineCandidates = async (req, res) => {
  const payload = {
    ...req.query,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getPipelineCandidatesParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getPipelineCandidates(validatePayload.data);
  return paginationResponse(result, res);
};

const getPipelineAnalytics = async (req, res) => {
  const payload = {
    ...req.query,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getPipelineAnalyticsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getPipelineAnalytics(validatePayload.data);
  return sendResponse(result, res);
};

const getApplicationTimeline = async (req, res) => {
  const payload = {
    application_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id, company_id: req.userMeta.company_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getApplicationTimelineParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getApplicationTimeline(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getStages,
  createStage,
  updateStage,
  reorderStages,
  deleteStage,
  getPipelineCandidates,
  getPipelineAnalytics,
  getApplicationTimeline,
};
