const Domain = require("./domain");

const updateUserStatus = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateUserStatus(payload);
};

const verifyEmployer = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.verifyEmployer(payload);
};

const updateJobStatus = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateJobStatus(payload);
};

const updateSystemSettings = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateSystemSettings(payload);
};

const insertLookupTable = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertLookupTable(payload);
};


const updateLookupTable = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateLookupTable(payload);
};

const deleteLookupTable = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteLookupTable(payload);
};

const insertUser = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertUser(payload);
};

const updateUser = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateUser(payload);
};

const deleteUser = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteUser(payload);
};

const updateWorker = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateWorker(payload);
};

const deleteWorker = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorker(payload);
};

const updateEmployer = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateEmployer(payload);
};

const deleteEmployer = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteEmployer(payload);
};

const updateJob = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateJob(payload);
};

const deleteJob = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteJob(payload);
};

const updateApplication = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateApplication(payload);
};

const deleteApplication = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteApplication(payload);
};

const insertPlan = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertPlan(payload);
};

const updatePlan = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updatePlan(payload);
};

const deletePlan = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deletePlan(payload);
};

const insertProvince = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertProvince(payload);
};

const updateProvince = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateProvince(payload);
};

const deleteProvince = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteProvince(payload);
};

const insertCity = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertCity(payload);
};

const updateCity = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateCity(payload);
};

const deleteCity = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteCity(payload);
};

module.exports = {
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
  updateWorker,
  deleteWorker,
  updateEmployer,
  deleteEmployer,
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
  insertPlan,
  updatePlan,
  deletePlan
};
