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

// const updateJobPostAnswers = async (payload, id) => {
//   return domain.updateJobPostAnswers(payload, id);
// };

module.exports = {
  createJobPost,
  createJobPostQuestions,
  updateJobPostQuestion,
  createJobPostAnswers,
  createJobApplication,
};
