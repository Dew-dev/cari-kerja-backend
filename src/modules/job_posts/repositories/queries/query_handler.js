const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);


const getJobpostById = async (payload) => {
  return domain.getJobpostById(payload);
};

const getJobpostsByRecruiterId = async (payload) => {
  return domain.getJobPostsLogic(payload);
};

const getJobposts = async (payload) => {
  return domain.getJobPostsLogic(payload);
};

const getJobpostsSelf = async (payload) => {
  return domain.getJobPostsLogic(payload);
};
const getAppliedJobposts = async (payload) => {
  return domain.getAppliedJobposts(payload);
};
const getJobpostQuestions = async (payload, ctx) => {
  return domain.getJobpostQuestions(payload, ctx);
};
const getCurrencyByCode = async (payload) => {
  return domain.getCurrencyByCode(payload);
};
module.exports = {
  getJobpostById,
  getJobpostsByRecruiterId,
  getJobposts,
  getJobpostsSelf,
  getJobpostQuestions,
  getCurrencyByCode,
  getAppliedJobposts,
};
