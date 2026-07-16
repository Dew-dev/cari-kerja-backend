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

const insertWorkerSubResource = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertWorkerSubResource(payload);
};

const updateWorkerSubResource = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateWorkerSubResource(payload);
};

const deleteWorkerSubResource = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerSubResource(payload);
};

const insertWorkerLanguage = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertWorkerLanguage(payload);
};

const updateWorkerLanguage = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateWorkerLanguage(payload);
};

const deleteWorkerLanguage = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerLanguage(payload);
};

const updateWorkerResume = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateWorkerResume(payload);
};

const deleteWorkerResume = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerResume(payload);
};

const insertWorkerSkill = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.insertWorkerSkill(payload);
};

const deleteWorkerSkill = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerSkill(payload);
};

const updateWorkerApplication = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateWorkerApplication(payload);
};

const deleteWorkerApplication = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerApplication(payload);
};

const updateWorkerJobPostAnswer = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updateWorkerJobPostAnswer(payload);
};

const deleteWorkerJobPostAnswer = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerJobPostAnswer(payload);
};

const deleteWorkerSavedJob = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.deleteWorkerSavedJob(payload);
};

const updatePaymentOrderStatus = async (payload) => {
  const adminCommand = new Domain();
  return await adminCommand.updatePaymentOrderStatus(payload);
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
  deletePlan,
  updatePaymentOrderStatus,
  insertWorkerSubResource,
  updateWorkerSubResource,
  deleteWorkerSubResource,
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
  deleteWorkerSavedJob
};
