const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");

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

const getSystemSettings = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getSystemSettingsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getSystemSettings();
  return sendResponse(result, res);
};

const getAuditLogs = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getAuditLogsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getAuditLogs(validatePayload.data);
  return paginationResponse(result, res);
};

const getUsers = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getUsersParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getUsers(validatePayload.data);
  return paginationResponse(result, res);
};

const getUserById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getUserByIdParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getUserById(validatePayload.data);
  return sendResponse(result, res);
};

const getWorkerById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getWorkerByIdParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getWorkerById(validatePayload.data);
  return sendResponse(result, res);
};

const getEmployers = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getEmployersParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getEmployers(validatePayload.data);
  return paginationResponse(result, res);
};

const getEmployerById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getEmployerByIdParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getEmployerById(validatePayload.data);
  return sendResponse(result, res);
};

const getJobs = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getJobsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getJobs(validatePayload.data);
  return paginationResponse(result, res);
};

const getJobById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getJobByIdParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getJobById(validatePayload.data);
  return sendResponse(result, res);
};

const getApplications = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getApplicationsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getApplications(validatePayload.data);
  return paginationResponse(result, res);
};

const getWorkers = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getWorkersParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getWorkers(validatePayload.data);
  return paginationResponse(result, res);
};

const getLookupTable = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getLookupTableParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await queryHandler.getLookupTable(validatePayload.data);
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

const updateSystemSettings = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateSystemSettingsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateSystemSettings(validatePayload.data);
  return sendResponse(result, res);
};

const insertLookupTable = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertLookupTableParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.insertLookupTable(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateLookupTable = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateLookupTableParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateLookupTable(validatePayload.data);
  return sendResponse(result, res);
};

const deleteLookupTable = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteLookupTableParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.deleteLookupTable(validatePayload.data);
  return sendResponse(result, res);
};

const insertUser = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertUserParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.insertUser(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateUser = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateUserParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateUser(validatePayload.data);
  return sendResponse(result, res);
};

const deleteUser = async (req, res) => {
  const payload = { ...req.params, ...req.query };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteUserParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.deleteUser(validatePayload.data);
  return sendResponse(result, res);
};

const updateWorker = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateWorkerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateWorker(validatePayload.data);
  return sendResponse(result, res);
};

const deleteWorker = async (req, res) => {
  const payload = { ...req.params, ...req.query };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.deleteWorker(validatePayload.data);
  return sendResponse(result, res);
};

const updateEmployer = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateEmployerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateEmployer(validatePayload.data);
  return sendResponse(result, res);
};

const deleteEmployer = async (req, res) => {
  const payload = { ...req.params, ...req.query };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteEmployerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.deleteEmployer(validatePayload.data);
  return sendResponse(result, res);
};

const updateJob = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateJobParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateJob(validatePayload.data);
  return sendResponse(result, res);
};

const deleteJob = async (req, res) => {
  const payload = { ...req.params, ...req.query };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteJobParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.deleteJob(validatePayload.data);
  return sendResponse(result, res);
};

const updateApplication = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateApplicationParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.updateApplication(validatePayload.data);
  return sendResponse(result, res);
};

const deleteApplication = async (req, res) => {
  const payload = { ...req.params, ...req.query };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteApplicationParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  
  const result = await commandHandler.deleteApplication(validatePayload.data);
  return sendResponse(result, res);
};

// payment orders
const getPaymentOrders = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getPaymentOrdersParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getPaymentOrders(validatePayload.data);
  return paginationResponse(result, res);
};

const getPaymentOrderById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getPaymentOrderByIdParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getPaymentOrderById(validatePayload.data);
  return sendResponse(result, res);
};

const updatePaymentOrderStatus = async (req, res) => {
  const payload = {
    id: req.params.id,
    ...req.body,
    admin_user_id: req.userMeta.id,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"]
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.updatePaymentOrderStatusParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updatePaymentOrderStatus(validatePayload.data);
  return sendResponse(result, res);
};

// plans
const getAllPlans = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getAllPlansParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getAllPlans();
  return sendResponse(result, res);
};

const getPlansByType = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getPlansByTypeParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getPlansByType(validatePayload.data);
  return sendResponse(result, res);
};

const insertPlan = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertPlanParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.insertPlan(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updatePlan = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updatePlanParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updatePlan(validatePayload.data);
  return sendResponse(result, res);
};

const deletePlan = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, commandModel.deletePlanParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deletePlan(validatePayload.data);
  return sendResponse(result, res);
};

// locations
const insertProvince = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertProvinceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.insertProvince(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateProvince = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateProvinceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateProvince(validatePayload.data);
  return sendResponse(result, res);
};

const deleteProvince = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteProvinceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteProvince(validatePayload.data);
  return sendResponse(result, res);
};

const insertCity = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertCityParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.insertCity(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateCity = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateCityParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateCity(validatePayload.data);
  return sendResponse(result, res);
};

const deleteCity = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteCityParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteCity(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getDashboardStats,
  getDashboardGrowth,
  getDashboardJobDistribution,
  getDashboardActivities,
  getSystemSettings,
  getAuditLogs,
  getUsers,
  getUserById,
  getEmployers,
  getJobs,
  getApplications,
  getLookupTable,
  updateUserStatus,
  verifyEmployer,
  updateJobStatus,
  updateSystemSettings,
  insertLookupTable,
  updateLookupTable,
  deleteLookupTable,
  insertUser,
  updateUser,
  deleteUser,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  getJobById,
  updateJob,
  deleteJob,
  updateApplication,
  deleteApplication,
  insertProvince,
  updateProvince,
  deleteProvince,
  insertCity,
  updateCity,
  deleteCity,
  getAllPlans,
  getPlansByType,
  insertPlan,
  updatePlan,
  deletePlan,
  getPaymentOrders,
  getPaymentOrderById,
  updatePaymentOrderStatus
};
