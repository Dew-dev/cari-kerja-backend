const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);
const getJobpostsByRecruiterId = async (payload) => {
  return domain.getJobpostsByRecruiterId(payload);
};

const getJobpostById = async (payload) => {
  return domain.getJobpostById(payload);
};

const getJobposts = async (payload) => {
  return domain.getJobposts(payload);
};

const getCategoriesByName = async (payload) => {
  return domain.getCategoriesByName(payload);
};

const getJobpostsSelf = async (payload) => {
  return domain.getJobpostsSelf(payload);
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
const getJobApplicants = async (payload) => {
  return domain.getJobApplicants(payload);
};
const getWorkerByApplication = async (payload) => {
  return domain.getWorkerByApplication(payload);
};

module.exports = {
  getJobpostsByRecruiterId,
  getJobpostById,
  getJobposts,
  getJobpostsSelf,
  getJobpostQuestions,
  getCurrencyByCode,
  getAppliedJobposts,
  getCategoriesByName,
  getJobApplicants,
  getWorkerByApplication,
};
