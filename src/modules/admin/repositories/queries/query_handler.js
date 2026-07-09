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

module.exports = {
  getDashboardStats,
  getUsers,
  getEmployers,
  getJobs,
  getApplications,
  getDashboardGrowth,
  getDashboardJobDistribution,
  getDashboardActivities,
  getSystemSettings
};
