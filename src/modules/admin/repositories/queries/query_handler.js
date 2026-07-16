const Domain = require("./domain");

const getDashboardStats = async () => {
  const adminQuery = new Domain();
  return await adminQuery.getDashboardStats();
};

const getUsers = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getUsers(payload);
};

const getEmployers = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getEmployers(payload);
};

const getJobs = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getJobs(payload);
};

const getApplications = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getApplications(payload);
};

const getDashboardGrowth = async () => {
  const adminQuery = new Domain();
  return await adminQuery.getDashboardGrowth();
};

const getDashboardJobDistribution = async () => {
  const adminQuery = new Domain();
  return await adminQuery.getDashboardJobDistribution();
};

const getDashboardActivities = async () => {
  const adminQuery = new Domain();
  return await adminQuery.getDashboardActivities();
};


const getSystemSettings = async () => {
  const adminQuery = new Domain();
  return await adminQuery.getSystemSettings();
};

const getAuditLogs = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getAuditLogs(payload);
};

const getUserById = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getUserById(payload);
};

const getWorkers = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkers(payload);
};

const getWorkerById = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerById(payload);
};

const getEmployerById = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getEmployerById(payload);
};

const getJobById = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getJobById(payload);
};

const getLookupTable = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getLookupTable(payload);
};

const getWorkerWorkExperiences = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerWorkExperiences(payload);
};

const getWorkerEducations = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerEducations(payload);
};

const getWorkerCertifications = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerCertifications(payload);
};

const getWorkerPortfolios = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerPortfolios(payload);
};

const getWorkerLanguages = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerLanguages(payload);
};

const getWorkerResumes = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerResumes(payload);
};

const getWorkerSkills = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerSkills(payload);
};

const getWorkerApplications = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerApplications(payload);
};

const getWorkerJobPostAnswers = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerJobPostAnswers(payload);
};

const getWorkerSavedJobs = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getWorkerSavedJobs(payload);
};

const getEmployerJobPosts = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getEmployerJobPosts(payload);
};

const getEmployerSubscriptions = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getEmployerSubscriptions(payload);
};

const getEmployerPaymentOrders = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getEmployerPaymentOrders(payload);
};

const getPaymentOrders = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getPaymentOrders(payload);
};

const getPaymentOrderById = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getPaymentOrderById(payload);
};

const getPlansByType = async (payload) => {
  const adminQuery = new Domain();
  return await adminQuery.getPlansByType(payload);
};

const getAllPlans = async () => {
  const adminQuery = new Domain();
  return await adminQuery.getAllPlans();
};

module.exports = {
  getDashboardStats,
  getUsers,
  getEmployers,
  getJobs,
  getApplications,
  getDashboardGrowth,
  getDashboardJobDistribution,
  getDashboardActivities,
  getSystemSettings,
  getAuditLogs,
  getUserById,
  getWorkers,
  getWorkerById,
  getEmployerById,
  getJobById,
  getLookupTable,
  getPlansByType,
  getAllPlans,
  getPaymentOrders,
  getPaymentOrderById,
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
  getEmployerJobPosts,
  getEmployerSubscriptions,
  getEmployerPaymentOrders
};
