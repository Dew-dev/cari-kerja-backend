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

const getDashboardTrustStats = async (req, res) => {
  const result = await queryHandler.getDashboardTrustStats();
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

const getFraudEvents = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getFraudEventsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getFraudEvents(validatePayload.data);
  return paginationResponse(result, res);
};

const getFraudEventById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getFraudEventByIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getFraudEventById(validatePayload.data);
  return sendResponse(result, res);
};

const resolveFraudEvent = async (req, res) => {
  const payload = {
    ...req.params,
    ...req.body,
    admin_user_id: req.userMeta?.id,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.resolveFraudEventParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.resolveFraudEvent(validatePayload.data);
  return sendResponse(result, res);
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
  const payload = { ...req.query, ...req.params };
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

// worker sub-resources
// GET list generik: worker_id dari path
const makeGetWorkerSubResource = (queryFn) => async (req, res) => {
  const payload = { worker_id: req.params.worker_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.getWorkerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler[queryFn](validatePayload.data);
  return sendResponse(result, res);
};

const getWorkerWorkExperiences = makeGetWorkerSubResource("getWorkerWorkExperiences");
const getWorkerEducations = makeGetWorkerSubResource("getWorkerEducations");
const getWorkerCertifications = makeGetWorkerSubResource("getWorkerCertifications");
const getWorkerPortfolios = makeGetWorkerSubResource("getWorkerPortfolios");
const getWorkerLanguages = makeGetWorkerSubResource("getWorkerLanguages");
const getWorkerResumes = makeGetWorkerSubResource("getWorkerResumes");
const getWorkerSkills = makeGetWorkerSubResource("getWorkerSkills");
const getWorkerApplications = makeGetWorkerSubResource("getWorkerApplications");
const getWorkerJobPostAnswers = makeGetWorkerSubResource("getWorkerJobPostAnswers");
const getWorkerSavedJobs = makeGetWorkerSubResource("getWorkerSavedJobs");

// insert/update/delete generik untuk work_experiences, educations, certifications, portfolios
const makeInsertWorkerSubResource = (resource) => async (req, res) => {
  const payload = { resource, worker_id: req.params.worker_id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertWorkerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.insertWorkerSubResource(validatePayload.data);
  return sendResponse(result, res, 201);
};

const makeUpdateWorkerSubResource = (resource) => async (req, res) => {
  const payload = { resource, worker_id: req.params.worker_id, id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateWorkerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateWorkerSubResource(validatePayload.data);
  return sendResponse(result, res);
};

const makeDeleteWorkerSubResource = (resource) => async (req, res) => {
  const payload = { resource, worker_id: req.params.worker_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerSubResource(validatePayload.data);
  return sendResponse(result, res);
};

const insertWorkerWorkExperience = makeInsertWorkerSubResource("work_experiences");
const updateWorkerWorkExperience = makeUpdateWorkerSubResource("work_experiences");
const deleteWorkerWorkExperience = makeDeleteWorkerSubResource("work_experiences");
const insertWorkerEducation = makeInsertWorkerSubResource("educations");
const updateWorkerEducation = makeUpdateWorkerSubResource("educations");
const deleteWorkerEducation = makeDeleteWorkerSubResource("educations");
const insertWorkerCertification = makeInsertWorkerSubResource("certifications");
const updateWorkerCertification = makeUpdateWorkerSubResource("certifications");
const deleteWorkerCertification = makeDeleteWorkerSubResource("certifications");
const insertWorkerPortfolio = makeInsertWorkerSubResource("portfolios");
const updateWorkerPortfolio = makeUpdateWorkerSubResource("portfolios");
const deleteWorkerPortfolio = makeDeleteWorkerSubResource("portfolios");

const insertWorkerLanguage = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertWorkerLanguageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.insertWorkerLanguage(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateWorkerLanguage = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateWorkerLanguageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateWorkerLanguage(validatePayload.data);
  return sendResponse(result, res);
};

const deleteWorkerLanguage = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerLanguageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerLanguage(validatePayload.data);
  return sendResponse(result, res);
};

const updateWorkerResume = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateWorkerResumeParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateWorkerResume(validatePayload.data);
  return sendResponse(result, res);
};

const deleteWorkerResume = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerResumeParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerResume(validatePayload.data);
  return sendResponse(result, res);
};

const insertWorkerSkill = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.insertWorkerSkillParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.insertWorkerSkill(validatePayload.data);
  return sendResponse(result, res, 201);
};

const deleteWorkerSkill = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, skill_id: req.params.skill_id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerSkillParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerSkill(validatePayload.data);
  return sendResponse(result, res);
};

const updateWorkerApplication = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateWorkerApplicationParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateWorkerApplication(validatePayload.data);
  return sendResponse(result, res);
};

const deleteWorkerApplication = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerApplicationParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerApplication(validatePayload.data);
  return sendResponse(result, res);
};

const updateWorkerJobPostAnswer = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateWorkerJobPostAnswerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateWorkerJobPostAnswer(validatePayload.data);
  return sendResponse(result, res);
};

const deleteWorkerJobPostAnswer = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerJobPostAnswerParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerJobPostAnswer(validatePayload.data);
  return sendResponse(result, res);
};

const deleteWorkerSavedJob = async (req, res) => {
  const payload = { worker_id: req.params.worker_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteWorkerSavedJobParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteWorkerSavedJob(validatePayload.data);
  return sendResponse(result, res);
};

// employer sub-resources
const makeGetEmployerSubResource = (queryFn) => async (req, res) => {
  const payload = { employer_id: req.params.employer_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.getEmployerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler[queryFn](validatePayload.data);
  return sendResponse(result, res);
};

const getEmployerJobPosts = makeGetEmployerSubResource("getEmployerJobPosts");
const getEmployerSubscriptions = makeGetEmployerSubResource("getEmployerSubscriptions");
const getEmployerPaymentOrders = makeGetEmployerSubResource("getEmployerPaymentOrders");

const deleteEmployerJobPost = async (req, res) => {
  const payload = { employer_id: req.params.employer_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteEmployerJobPostParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteEmployerJobPost(validatePayload.data);
  return sendResponse(result, res);
};

const updateEmployerSubscription = async (req, res) => {
  const payload = { employer_id: req.params.employer_id, id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateEmployerSubscriptionParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateEmployerSubscription(validatePayload.data);
  return sendResponse(result, res);
};

const deleteEmployerSubscription = async (req, res) => {
  const payload = { employer_id: req.params.employer_id, id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteEmployerSubscriptionParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteEmployerSubscription(validatePayload.data);
  return sendResponse(result, res);
};

// chat moderation
const getWorkerConversations = async (req, res) => {
  const payload = { worker_id: req.params.worker_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.getWorkerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getWorkerConversations(validatePayload.data);
  return sendResponse(result, res);
};

const getEmployerConversations = async (req, res) => {
  const payload = { employer_id: req.params.employer_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.getEmployerSubResourceParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getEmployerConversations(validatePayload.data);
  return sendResponse(result, res);
};

const getConversationMessages = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getConversationMessagesParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getConversationMessages(validatePayload.data);
  return sendResponse(result, res);
};

const deleteConversationMessage = async (req, res) => {
  const payload = {
    conversation_id: req.params.id,
    message_id: req.params.message_id,
    admin_user_id: req.userMeta.id,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"]
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteConversationMessageParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteConversationMessage(validatePayload.data);
  return sendResponse(result, res);
};

const bulkDeleteConversationMessages = async (req, res) => {
  const payload = {
    conversation_id: req.params.id,
    message_ids: req.body?.message_ids,
    admin_user_id: req.userMeta.id,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.bulkDeleteConversationMessagesParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.bulkDeleteConversationMessages(validatePayload.data);
  return sendResponse(result, res);
};

const updateConversationStatus = async (req, res) => {
  const payload = {
    id: req.params.id,
    ...req.body,
    admin_user_id: req.userMeta.id,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateConversationStatusParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updateConversationStatus(validatePayload.data);
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
  const payload = { ...req.query, ...req.params };
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

const employerVerificationCommandHandler = require("../../employer_verification/repositories/commands/command_handler");
const employerVerificationQueryHandler = require("../../employer_verification/repositories/queries/query_handler");
const employerVerificationCommandModel = require("../../employer_verification/repositories/commands/command_model");
const employerVerificationQueryModel = require("../../employer_verification/repositories/queries/query_model");

const listEmployerVerificationApplications = async (req, res) => {
  const payload = {
    status: req.query.status,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    employerVerificationQueryModel.listApplicationsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await employerVerificationQueryHandler.listApplications(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const getEmployerVerificationApplicationById = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    employerVerificationQueryModel.getApplicationByIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await employerVerificationQueryHandler.getApplicationById(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const reviewEmployerVerificationApplication = async (req, res) => {
  const payload = {
    id: req.params.id,
    action: req.body.action,
    admin_note: req.body.admin_note,
    rejection_reason: req.body.rejection_reason,
    reviewed_by: req.userMeta.id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    employerVerificationCommandModel.reviewApplicationParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await employerVerificationCommandHandler.reviewApplication(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const markEmployerVerificationUnderReview = async (req, res) => {
  const payload = {
    id: req.params.id,
    reviewed_by: req.userMeta.id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    employerVerificationCommandModel.markUnderReviewParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await employerVerificationCommandHandler.markUnderReview(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const listAccountReactivationRequests = async (req, res) => {
  const payload = {
    status: req.query.status,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    employerVerificationQueryModel.listReactivationRequestsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result =
    await employerVerificationQueryHandler.listReactivationRequests(
      validatePayload.data
    );
  return sendResponse(result, res);
};

module.exports = {
  getDashboardStats,
  getDashboardTrustStats,
  getDashboardGrowth,
  getDashboardJobDistribution,
  getDashboardActivities,
  getSystemSettings,
  getAuditLogs,
  getFraudEvents,
  getFraudEventById,
  resolveFraudEvent,
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
  updatePaymentOrderStatus,
  getWorkerWorkExperiences,
  getWorkerEducations,
  getWorkerCertifications,
  getWorkerPortfolios,
  getWorkerLanguages,
  getWorkerResumes,
  getWorkerSkills,
  getWorkerApplications,
  getWorkerJobPostAnswers,
  getWorkerSavedJobs,
  insertWorkerWorkExperience,
  updateWorkerWorkExperience,
  deleteWorkerWorkExperience,
  insertWorkerEducation,
  updateWorkerEducation,
  deleteWorkerEducation,
  insertWorkerCertification,
  updateWorkerCertification,
  deleteWorkerCertification,
  insertWorkerPortfolio,
  updateWorkerPortfolio,
  deleteWorkerPortfolio,
  insertWorkerLanguage,
  updateWorkerLanguage,
  deleteWorkerLanguage,
  updateWorkerResume,
  deleteWorkerResume,
  insertWorkerSkill,
  deleteWorkerSkill,
  updateWorkerApplication,
  deleteWorkerApplication,
  updateWorkerJobPostAnswer,
  deleteWorkerJobPostAnswer,
  deleteWorkerSavedJob,
  getEmployerJobPosts,
  getEmployerSubscriptions,
  getEmployerPaymentOrders,
  deleteEmployerJobPost,
  updateEmployerSubscription,
  deleteEmployerSubscription,
  getWorkerConversations,
  getEmployerConversations,
  getConversationMessages,
  deleteConversationMessage,
  bulkDeleteConversationMessages,
  updateConversationStatus,
  listEmployerVerificationApplications,
  getEmployerVerificationApplicationById,
  reviewEmployerVerificationApplication,
  markEmployerVerificationUnderReview,
  listAccountReactivationRequests,
};
