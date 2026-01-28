const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

// GET ALL JobPostRequirements by JobPosts ID
const getAllJobPostRequirementsByJobPostId = async (payload) => {
  return domain.getAllJobPostRequirementsByJobPostId(payload);
};

module.exports = {
  getAllJobPostRequirementsByJobPostId,
};
