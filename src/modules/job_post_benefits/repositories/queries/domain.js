const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "JobPostBenefits-Query-Domain";

class JobPostBenefits {
  constructor(db) {
    this.query = new Query(db);
  }

  async getAllJobPostBenefitsByJobPostId(payload) {
    const { job_post_id } = payload;

    const result = await this.query.getAllByJobPostId(job_post_id);

    if (result.err) {
      logger.error(ctx, "getAllJobPostBenefitsByJobPostId", "No JobPostBenefits found", result.err);
      return wrapper.error(new NotFoundError("No JobPostBenefits found"));
    }

    logger.info(ctx, "getAllJobPostBenefitsByJobPostId", "Success get JobPostBenefits", payload);
    return wrapper.data(result.data);
  }
}

module.exports = JobPostBenefits;
