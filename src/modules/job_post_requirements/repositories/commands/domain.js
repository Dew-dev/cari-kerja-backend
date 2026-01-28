const Command = require("./command");
const Query = require("../queries/query");
const JobPostsQueryDomain = require("../../../job_posts/repositories/queries/domain");
const wrapper = require("../../../../helpers/utils/wrapper");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError, UnauthorizedError } = require("../../../../helpers/errors");
const ctx = "JobPostRequirements-Domain";

class JobPostRequirements {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.domain = new JobPostsQueryDomain(db);
  }

  // INSERT one education
  async insertOne(payload) {
    const document = {
      id: uuidv4(),
      job_post_id: payload.job_post_id,
      requirement: payload.requirement,
      order_index: payload.order_index, 
      recruiter_id: payload.recruiter_id,
    };

    const job_post = await this.domain.getJobpostById({id: document.job_post_id});
    if (document.recruiter_id !== job_post.data.recruiter_id) {
      return wrapper.error(new UnauthorizedError("Unauthorized"));
    }
    
    const result = await this.command.insertOne(document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to insert JobPostRequirements"));
    }

    return wrapper.data({ id: result.data.id }, "Success insert JobPostRequirements", 201);
  }

  // UPDATE one education
  async updateOne(payload) {
    const { id, job_post_id } = payload;

    const existing = await this.query.findOne({ id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("JobPostRequirement not found"));
    }

    const document = {
      requirement: payload.requirement,
      order_index: payload.order_index
    };

    const result = await this.command.updateOneNew({ id, job_post_id }, document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update JobPostRequirement"));
    }

    return wrapper.data({ id }, "Success update JobPostRequirement", 200);
  }

  // DELETE one education
  async deleteOne(payload) {
    const { id, job_post_id } = payload;

    const existing = await this.query.findOne({ id, job_post_id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("JobPostRequirement not found"));
    }

    const result = await this.command.deleteOne({ id, job_post_id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to delete JobPostRequirement"));
    }

    return wrapper.data("Successfully deleted", "Success delete JobPostRequirement", 200);
  }
}

module.exports = JobPostRequirements;
