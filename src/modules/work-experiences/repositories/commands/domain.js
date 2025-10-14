const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "WorkerExperience-Domain";

class WorkExperience {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  // INSERT one work experience
  async insertOne(payload) {
    const document = {
      id: uuidv4(),
      worker_id: payload.worker_id,
      company_name: payload.company_name,
      job_title: payload.job_title,
      start_date: payload.start_date,
      end_date: payload.end_date || null,
      is_current: payload.is_current || false,
      description: payload.description || null,
    };
    const result = await this.command.insertOne(document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to insert work experience"));
    }
    return wrapper.data({ id: result.data.id });
  }

  // UPDATE one work experience
  async updateOne(payload) {
    const { id, worker_id } = payload;
    const existing = await this.query.findOne({ id }, { id: 1 });
    if (!existing.data) {
      return wrapper.error(new NotFoundError("Worker experience not found"));
    }

    const document = {
      company_name: payload.company_name,
      job_title: payload.job_title,
      start_date: payload.start_date,
      end_date: payload.end_date || null,
      is_current: payload.is_current || false,
      description: payload.description || null,
    };

    const result = await this.command.updateOneNew({ id, worker_id }, document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update worker experience"));
    }

    return wrapper.data({ id });
  }

  // DELETE one work experience
  async deleteOne(payload) {
    const { id } = payload;
    const existing = await this.query.findOne({ id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("Worker experience not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      logger.error(ctx, "Failed delete exp", "Domain", result.err);
      return wrapper.error(new InternalServerError("Failed to delete worker experience"));
    }

    return wrapper.data("Successfully deleted");
  }
}

module.exports = WorkExperience;
