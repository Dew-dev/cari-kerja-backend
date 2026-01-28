const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Job_Post_Requirements-Query-Domain";

class JobPostRequirements {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Educations By Worker Id
  async getAllJobPostRequirementsByJobPostId(payload) {
    const { job_post_id } = payload;

    const result = await this.query.getAllByJobPostId(job_post_id);

    if (result.err) {
      logger.error(ctx, "getAllJobPostRequirementsByJobPostId", "No job_post_requirements found", result.err);
      return wrapper.error(new NotFoundError("No job_post_requirements found"));
    }

    logger.info(ctx, "getAllJobPostRequirementsByJobPostId", "Success get JobPostRequirements", payload);
    return wrapper.data(result.data);
  }
}

module.exports = JobPostRequirements;
