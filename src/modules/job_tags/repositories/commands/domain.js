const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const queryHandler = require("../queries/query_handler");
const queryHandlerJobPosts = require("../../../job_posts/repositories/queries/query_handler");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
  ConflictError,
} = require("../../../../helpers/errors");
const ctx = "Jobtags-Command-Domain";

const RECRUITER_ROLE_ID = 2;
const SUPER_ADMIN_ROLE_ID = 3;

const isRecruiterOrSuperAdmin = (role_id) =>
  role_id === RECRUITER_ROLE_ID || role_id === SUPER_ADMIN_ROLE_ID;

class JobPostTags {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createJobPostTag(payload) {
    const { job_post_id, name, role_id, recruiter_id } = payload;
    let tag_id = null;

    const getJobPostResult = await queryHandlerJobPosts.getJobpostById({
      id: job_post_id,
    });
    if (
      getJobPostResult.err ||
      !getJobPostResult.data ||
      !isRecruiterOrSuperAdmin(role_id) ||
      (role_id === RECRUITER_ROLE_ID &&
        getJobPostResult.data.recruiter_id !== recruiter_id)
    ) {
      logger.error(
        ctx,
        "Create Job Post Tag: Unauthorized",
        "Job Tags Command Domain",
        getJobPostResult.err
      );
      return wrapper.error(
        new UnauthorizedError("Create Job Post Tag Failed due to Unauthorized")
      );
    }

    const getJobtagsResult = await queryHandler.getOneTagByName({ name });
    // Tag missing when lookup errors OR returns null/empty data (do not touch .id on null)
    if (getJobtagsResult.err || !getJobtagsResult.data) {
      const insertJobTagResult = await this.createJobTag({ name });
      if (insertJobTagResult.err) {
        return insertJobTagResult;
      }
      tag_id = insertJobTagResult.data.id;
    } else {
      tag_id = getJobtagsResult.data.id;
    }

    const insertJobPostTagResult = await this.command.insertOneJobPostTag(
      tag_id,
      job_post_id
    );
    if (insertJobPostTagResult.err) {
      const message = insertJobPostTagResult.err.message || String(insertJobPostTagResult.err);
      const isDuplicate =
        insertJobPostTagResult.err.code === "23505" ||
        /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(
          new ConflictError("Tag is already linked to this job post")
        );
      }
      logger.error(
        ctx,
        "Create Job Post Tag",
        "Job Tags Command Domain",
        insertJobPostTagResult.err
      );
      return wrapper.error(
        new InternalServerError("Create Job Post Tag Failed")
      );
    }
    return wrapper.data({ tag_id, job_post_id });
  }

  async createJobTag(payload) {
    const { name, role_id } = payload;

    // Standalone create must be recruiter-only (role_id 2). Internal calls omit role_id.
    if (role_id !== undefined && role_id !== RECRUITER_ROLE_ID) {
      return wrapper.error(
        new UnauthorizedError("Only recruiters can create tags")
      );
    }

    const existing = await queryHandler.getOneTagByName({ name });
    if (existing?.data) {
      return wrapper.error(
        new ConflictError("Create Job Tag Failed: Tag already exists")
      );
    }

    const data = {
      id: uuidv4(),
      name,
    };

    const insertJobTagResult = await this.command.insertJobTag(data);
    if (insertJobTagResult.err) {
      const message = insertJobTagResult.err.message || String(insertJobTagResult.err);
      const isDuplicate =
        insertJobTagResult.err.code === "23505" ||
        /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(
          new ConflictError("Create Job Tag Failed: Tag already exists")
        );
      }
      logger.error(
        ctx,
        "Create Job Tag",
        "Job Tags Command",
        insertJobTagResult.err
      );
      return wrapper.error(new InternalServerError(insertJobTagResult.err));
    }

    return wrapper.data(data);
  }

  async deleteJobPostTag(payload) {
    const { tag_id, job_post_id, role_id, recruiter_id } = payload;

    const getJobPostResult = await queryHandlerJobPosts.getJobpostById({
      id: job_post_id,
    });
    if (
      getJobPostResult.err ||
      !getJobPostResult.data ||
      !isRecruiterOrSuperAdmin(role_id) ||
      (role_id === RECRUITER_ROLE_ID &&
        getJobPostResult.data.recruiter_id !== recruiter_id)
    ) {
      logger.error(
        ctx,
        "Delete Job Post Tag: Unauthorized",
        "Job Tags Command Domain",
        getJobPostResult.err
      );
      return wrapper.error(
        new UnauthorizedError("Delete Job Post Tag Failed due to Unauthorized")
      );
    }
    const getJobPostTagResult =
      await queryHandler.getOneJobPostTagByTagIdAndJobPostId({
        tag_id,
        job_post_id,
      });
    if (getJobPostTagResult.err) {
      logger.error(
        ctx,
        "Delete Job Post Tag: Can not find tag",
        "Job Tags Command Domain",
        getJobPostTagResult.err
      );
      return wrapper.error(
        new NotFoundError("Delete Job Post Tag Failed due to tag Not Found")
      );
    }
    const deleteJobPostTagResult = await this.command.deleteJobPostTag({
      tag_id,
      job_post_id,
    });
    if (deleteJobPostTagResult.err) {
      logger.error(
        ctx,
        "Delete Job Post Tag",
        "Job Tags Command",
        deleteJobPostTagResult.err
      );
      return wrapper.error(
        new InternalServerError("Delete Job Post Tag Failed")
      );
    }

    return wrapper.data({ tag_id, job_post_id });
  }
}

module.exports = JobPostTags;
