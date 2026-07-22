const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const upsertDraft = (payload) => domain.upsertDraft(payload);
const uploadDocument = (payload) => domain.uploadDocument(payload);
const deleteDocument = (payload) => domain.deleteDocument(payload);
const submitApplication = (payload) => domain.submitApplication(payload);
const requestReactivation = (payload) => domain.requestReactivation(payload);
const reviewApplication = (payload) => domain.reviewApplication(payload);
const markUnderReview = (payload) => domain.markUnderReview(payload);
const runAutoBlockExpired = () => domain.runAutoBlockExpired();

module.exports = {
  upsertDraft,
  uploadDocument,
  deleteDocument,
  submitApplication,
  requestReactivation,
  reviewApplication,
  markUnderReview,
  runAutoBlockExpired,
};
