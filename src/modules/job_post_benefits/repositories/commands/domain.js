const Command = require("./command");
const Query = require("../queries/query");
const JobPostsQueryDomain = require("../../../job_posts/repositories/queries/domain");
const wrapper = require("../../../../helpers/utils/wrapper");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError, UnauthorizedError } = require("../../../../helpers/errors");
const ctx = "JobPostBenefits-Domain";

class JobPostBenefits {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.domain = new JobPostsQueryDomain(db);
  }

  async insertOne(payload) {
    const document = {
      id: uuidv4(),
      job_post_id: payload.job_post_id,
      benefit: payload.requirement,
      order_index: payload.order_index,
    };

    const { recruiter_id } = payload;

    const job_post = await this.domain.getJobpostById({id: document.job_post_id});
    if (recruiter_id !== job_post.data.recruiter_id) {
      return wrapper.error(new UnauthorizedError("Unauthorized"));
    }
    
    const result = await this.command.insertOne(document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to insert JobPostBenefits"));
    }

    return wrapper.data({ id: result.data.id }, "Success insert JobPostBenefits", 201);
  }

  async updateOne(payload) {
    const { id, job_post_id } = payload;

    const existing = await this.query.findOne({ id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("JobPostBenefits not found"));
    }

    const document = {
      benefit: payload.benefit,
      order_index: payload.order_index
    };

    const result = await this.command.updateOneNew({ id, job_post_id }, document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update JobPostBenefits"));
    }

    return wrapper.data({ id }, "Success update JobPostBenefits", 200);
  }

  async deleteOne(payload) {
    const { id, job_post_id } = payload;

    const existing = await this.query.findOne({ id, job_post_id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("JobPostBenefits not found"));
    }

    const result = await this.command.deleteOne({ id, job_post_id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to delete JobPostBenefits"));
    }

    return wrapper.data("Successfully deleted", "Success delete JobPostBenefits", 200);
  }
}

module.exports = JobPostBenefits;
