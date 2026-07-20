const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const login = async (payload) => {
  return domain.login(payload);
};

const loginWithGoogle = async (payload) => {
  return domain.loginWithGoogle(payload);
};

const loginWithTelegram = async (payload) => {
  return domain.loginWithTelegram(payload);
};

const registerWorker = async (payload) => {
  return domain.registerWorker(payload);
};

const registerRecruiter = async (payload) => {
  return domain.registerRecruiter(payload);
};

const updateOneUser = async (payload) => {
  return domain.updateOneUser(payload);
}

const logout = async (payload) => {
  return domain.logout(payload);
};

const deleteUser = async (payload) => {
  return domain.deleteUser(payload);
};

const refreshToken = async (payload) => {
  return domain.refreshToken(payload);
};

const forgotPassword = async (payload) => {
  return domain.forgotPassword(payload);
};

const resetPassword = async (payload) => {
  return domain.resetPassword(payload);
};

const changePassword = async (payload) => {
  return domain.changePassword(payload);
};

const changeEmail = async (payload) => {
  return domain.changeEmail(payload);
};

const linkTelegramNotification = async (payload) => {
  return domain.linkTelegramNotification(payload);
};

const sendVerifyEmail = async (payload) => domain.sendVerifyEmail(payload);
const verifyEmail = async (payload) => domain.verifyEmail(payload);
const resendVerifyEmail = async (payload) => domain.resendVerifyEmail(payload);


module.exports = {
  login,
  loginWithGoogle,
  loginWithTelegram,
  registerWorker,
  registerRecruiter,
  updateOneUser,
  logout,
  deleteUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  changeEmail,
  linkTelegramNotification,
  sendVerifyEmail,
  verifyEmail,
  resendVerifyEmail,
};
