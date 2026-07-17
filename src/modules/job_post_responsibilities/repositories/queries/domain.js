const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "JobPostResponsibilities-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class JobPostResponsibilities {
  constructor(db) {
    this.query = new Query(db);
  }

  async getAllJobPostResponsibilitiesByJobPostId(payload) {
    const { job_post_id } = payload;

    const result = await this.query.getAllByJobPostId(job_post_id);

    if (result.err) {
      if (result.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }
      logger.error(ctx, "getAllJobPostResponsibilitiesByJobPostId", "No JobPostResponsibilities found", result.err);
      return wrapper.error(new NotFoundError("No JobPostResponsibilities found"));
    }

    return wrapper.data(result.data);
  }
}

module.exports = JobPostResponsibilities;
