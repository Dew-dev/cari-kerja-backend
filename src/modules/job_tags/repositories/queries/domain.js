const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Jobposttags-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class JobPostTags {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneTagByName(payload) {
    const { name } = payload;

    const jobtag = await this.query.findOneJobTag({ name }, { id: 1, name: 1 });
    if (jobtag.err) {
      logger.error(ctx, "getOneTagByName", "Can not find tag", jobtag.err);
      return wrapper.error(new NotFoundError("Can not find tag"));
    }

    return wrapper.data(jobtag.data);
  }

  async getTagByName(payload) {
    const { name } = payload ?? "";
    const jobtag = await this.query.findJobTag({ name }, { id: 1, name: 1 });
    if (jobtag.err) {
      logger.error(ctx, "getTagByName", "Can not find tag", jobtag.err);
      return wrapper.error(new NotFoundError("Can not find tag"));
    }

    return wrapper.data(jobtag.data);
  }

  async getOneJobPostTagByTagIdAndJobPostId(payload) {
    const { tag_id, job_post_id } = payload;
    const jobtag = await this.query.findOneJobPostTag(
      { tag_id, job_post_id },
      { tag_id: 1, job_post_id: 1 }
    );
    if (jobtag.err) {
      logger.error(
        ctx,
        "getOneJobPostTagByTagIdAndJobPostId",
        "Can not find tag",
        jobtag.err
      );
      return wrapper.error(new NotFoundError("Can not find tag"));
    }

    return wrapper.data(jobtag.data);
  }

  async getTagsPerJobPost(payload) {
    const { job_post_id } = payload;

    const jobposttags = await this.query.findtagsPerJobPost(job_post_id);
    if (jobposttags.err) {
      if (jobposttags.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }
      logger.error(ctx, "getJobposttags", "Can not find tags", jobposttags.err);
      return wrapper.error(new NotFoundError("Can not find tags"));
    }

    return wrapper.data(jobposttags.data);
  }
}

module.exports = JobPostTags;
