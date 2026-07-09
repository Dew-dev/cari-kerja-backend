const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getDashboardStats = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getStatsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getDashboardStats();
  return sendResponse(result, res);
};

const getDashboardGrowth = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getDashboardGrowthParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getDashboardGrowth();
  return sendResponse(result, res);
};

const getDashboardJobDistribution = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getDashboardJobDistributionParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getDashboardJobDistribution();
  return sendResponse(result, res);
};

const getDashboardActivities = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getDashboardActivitiesParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getDashboardActivities();
  return sendResponse(result, res);
};

const getUsers = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getUsersParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getUsers(validatePayload.data);
  return sendResponse(result, res);
};

const getEmployers = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getEmployersParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getEmployers(validatePayload.data);
  return sendResponse(result, res);
};

const getJobs = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getJobsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getJobs(validatePayload.data);
  return sendResponse(result, res);
};

const getApplications = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getApplicationsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getApplications(validatePayload.data);
  return sendResponse(result, res);
};

// command
const updateUserStatus = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateUserStatusParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateUserStatus(validatePayload.data);
  return sendResponse(result, res);
};

const verifyEmployer = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.verifyEmployerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.verifyEmployer(validatePayload.data);
  return sendResponse(result, res);
};

const updateJobStatus = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateJobStatusParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateJobStatus(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getDashboardStats,
  getDashboardGrowth,
  getDashboardJobDistribution,
  getDashboardActivities,
  getUsers,
  getEmployers,
  getJobs,
  getApplications,
  updateUserStatus,
  verifyEmployer,
  updateJobStatus
};
