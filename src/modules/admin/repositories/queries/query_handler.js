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

module.exports = {
  getDashboardStats,
  getUsers,
  getEmployers,
  getJobs,
  getApplications
};
