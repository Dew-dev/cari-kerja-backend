const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  InternalServerError,
  BadRequestError,
} = require("../../../../helpers/errors");
const { enqueueRecomputeWorkerMatches } = require("../../../../helpers/queues/matching.queue");
const {
  resolveJobTitle,
  JobTitleResolveError,
} = require("../../../job_titles/helpers/resolve_job_title");
const ctx = "WorkerExperience-Domain";

class WorkExperience {
  constructor(db) {
    this.db = db;
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async _resolveTitleFields(payload) {
    try {
      const resolved = await resolveJobTitle(
        {
          id: payload.job_title_id,
          name: payload.job_title,
          category_id: payload.category_id,
        },
        this.db
      );
      return {
        job_title_id: resolved?.id || null,
        job_title: resolved?.name || payload.job_title,
      };
    } catch (err) {
      if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
        throw err;
      }
      throw err;
    }
  }

  // INSERT one work experience
  async insertOne(payload) {
    let titleFields;
    try {
      titleFields = await this._resolveTitleFields(payload);
    } catch (err) {
      if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
        return wrapper.error(new BadRequestError(err.message));
      }
      throw err;
    }
    const document = {
      id: uuidv4(),
      worker_id: payload.worker_id,
      company_name: payload.company_name,
      job_title: titleFields.job_title,
      job_title_id: titleFields.job_title_id,
      start_date: payload.start_date,
      end_date: payload.is_current ? null : (payload.end_date || null),
      is_current: payload.is_current || false,
      description: payload.description || null,
    };
    const result = await this.command.insertOne(document);
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Failed to insert work experience")
      );
    }
    await enqueueRecomputeWorkerMatches(payload.worker_id);
    return wrapper.data(result.data);
  }

  // UPDATE one work experience
  async updateOne(payload) {
    const { id, worker_id } = payload;
    const existing = await this.query.findOne({ id }, { id: 1, worker_id: 1 });
    if (!existing.data || existing.data.worker_id !== worker_id) {
      return wrapper.error(new NotFoundError("Worker experience not found"));
    }

    let titleFields;
    try {
      titleFields = await this._resolveTitleFields(payload);
    } catch (err) {
      if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
        return wrapper.error(new BadRequestError(err.message));
      }
      throw err;
    }
    const document = {
      company_name: payload.company_name,
      job_title: titleFields.job_title,
      job_title_id: titleFields.job_title_id,
      start_date: payload.start_date,
      end_date: payload.is_current ? null : (payload.end_date || null),
      is_current: payload.is_current || false,
      description: payload.description || null,
    };

    const result = await this.command.updateOneNew({ id, worker_id }, document);
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Failed to update worker experience")
      );
    }

    await enqueueRecomputeWorkerMatches(worker_id);
    return wrapper.data({ id });
  }

  // DELETE one work experience
  async deleteOne(payload) {
    const { id, worker_id } = payload;
    const existing = await this.query.findOne({ id, worker_id }, { id: 1 });
    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("Worker experience not found"));
    }

    const result = await this.command.deleteOne({ id, worker_id });
    if (result.err) {
      logger.error(ctx, "Failed delete exp", "Domain", result.err);
      return wrapper.error(
        new InternalServerError("Failed to delete worker experience")
      );
    }

    await enqueueRecomputeWorkerMatches(worker_id);
    return wrapper.data("Successfully deleted");
  }
}

module.exports = WorkExperience;
