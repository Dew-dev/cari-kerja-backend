const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createJobPost = async (payload) => {
  return domain.createJobPost(payload);
};

const createJobPostQuestions = async (payloadArray, id) => {
  return domain.createJobPostQuestions(payloadArray, id);
};

const updateJobPostQuestion = async (payload, id) => {
  return domain.updateJobPostQuestion(payload, id);
};

const createJobPostAnswers = async (payloadArray, id) => {
  return domain.createJobPostAnswers(payloadArray, id);
};

const createJobApplication = async (payload) => {
  return domain.createJobApplication(payload);
};

const updateJobPostStatus = async (payload, id) => {
  return domain.updateJobPostStatus(payload, id);
};
// const updateJobPostAnswers = async (payload, id) => {
//   return domain.updateJobPostAnswers(payload, id);
// };
const deleteAppliedJobpost = async (payload) => {
  return domain.deleteAppliedJobpost(payload);
};
const updateApplicationStatus = async (payload) => {
  return domain.updateApplicationStatus(payload);
};

const updateJobPost = async (payload) => {
  return domain.updateJobPost(payload);
};

module.exports = {
  createJobPost,
  createJobPostQuestions,
  updateJobPostQuestion,
  createJobPostAnswers,
  createJobApplication,
  updateJobPostStatus,
  deleteAppliedJobpost,
  updateApplicationStatus,
  updateJobPost,
};
