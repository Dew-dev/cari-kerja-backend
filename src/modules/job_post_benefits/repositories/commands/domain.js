const Command = require("./command");
const Query = require("../queries/query");
const JobPostsQueryDomain = require("../../../job_posts/repositories/queries/domain");
const wrapper = require("../../../../helpers/utils/wrapper");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} = require("../../../../helpers/errors");
const ctx = "JobPostBenefits-Domain";

class JobPostBenefits {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.domain = new JobPostsQueryDomain(db);
  }

  async #assertRecruiterOwnsJobPost(job_post_id, recruiter_id) {
    const job_post = await this.domain.getJobpostById({ id: job_post_id });
    if (job_post.err || !job_post.data) {
      return wrapper.error(new NotFoundError("Job post not found"));
    }
    if (recruiter_id !== job_post.data.recruiter_id) {
      return wrapper.error(
        new ForbiddenError("You are not allowed to modify benefits for this job post")
      );
    }
    return null;
  }

  async insertOne(payload) {
    const document = {
      id: uuidv4(),
      job_post_id: payload.job_post_id,
      benefit: payload.benefit,
      order_index: payload.order_index,
    };

    const ownershipError = await this.#assertRecruiterOwnsJobPost(
      document.job_post_id,
      payload.recruiter_id
    );
    if (ownershipError) {
      return ownershipError;
    }

    const result = await this.command.insertOne(document);
    if (result.err) {
      logger.error(ctx, "insertOne", "Failed to insert JobPostBenefits", result.err);
      return wrapper.error(new InternalServerError("Failed to insert JobPostBenefits"));
    }

    return wrapper.data({ id: result.data.id }, "Success insert JobPostBenefits", 201);
  }

  async updateOne(payload) {
    const { id, job_post_id, recruiter_id } = payload;

    const existing = await this.query.findOne({ id }, { id: 1 });
    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("JobPostBenefits not found"));
    }

    const ownershipError = await this.#assertRecruiterOwnsJobPost(job_post_id, recruiter_id);
    if (ownershipError) {
      return ownershipError;
    }

    const document = {
      benefit: payload.benefit,
      order_index: payload.order_index,
    };

    const result = await this.command.updateOneNew({ id, job_post_id }, document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update JobPostBenefits"));
    }

    return wrapper.data({ id }, "Success update JobPostBenefits", 200);
  }

  async deleteOne(payload) {
    const { id, job_post_id, recruiter_id } = payload;

    const existing = await this.query.findOne({ id, job_post_id }, { id: 1 });
    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("JobPostBenefits not found"));
    }

    const ownershipError = await this.#assertRecruiterOwnsJobPost(job_post_id, recruiter_id);
    if (ownershipError) {
      return ownershipError;
    }

    const result = await this.command.deleteOne({ id, job_post_id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to delete JobPostBenefits"));
    }

    return wrapper.data("Successfully deleted", "Success delete JobPostBenefits", 200);
  }
}

module.exports = JobPostBenefits;
