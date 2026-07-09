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

module.exports = {
  updateUserStatus,
  verifyEmployer,
  updateJobStatus
};
