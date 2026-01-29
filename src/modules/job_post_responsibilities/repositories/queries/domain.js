const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "JobPostResponsibilities-Query-Domain";

class JobPostResponsibilities {
  constructor(db) {
    this.query = new Query(db);
  }

  async getAllJobPostResponsibilitiesByJobPostId(payload) {
    const { job_post_id } = payload;

    const result = await this.query.getAllByJobPostId(job_post_id);

    if (result.err) {
      logger.error(ctx, "getAllJobPostResponsibilitiesByJobPostId", "No JobPostResponsibilities found", result.err);
      return wrapper.error(new NotFoundError("No JobPostResponsibilities found"));
    }

    logger.info(ctx, "getAllJobPostResponsibilitiesByJobPostId", "Success get JobPostResponsibilities", payload);
    return wrapper.data(result.data);
  }
}

module.exports = JobPostResponsibilities;
