const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { InternalServerError } = require("../../../../helpers/errors");
const ctx = "SavedJobs-Command-Domain";
const commandModel = require("../../repositories/commands/command_model");
const validator = require("../../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../../helpers/utils/response");

class SavedJobs {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createSavedJob(payload) {
    const {
      job_post_id,
      worker_id,
    } = payload;

    const data = {
      id: uuidv4(),
      job_post_id,
      worker_id
    };

    const result = await this.command.insertOne(data);
    if (result.err) {
      logger.error(ctx, "Create Saved Jobs", "SavedJobs Commands", result.err);
      return wrapper.error(new InternalServerError("Create Saved Jobs Failed"));
    }

    return wrapper.data(data);
  }

  async deleteSavedJob(payload) {
    const { id } = payload;

    const savedJob = await this.query.findOne({ id }, { id: 1, job_post_id: 1, worker_id: 1, created_at: 1 });
    if (savedJob.err) {
      return wrapper.error(new NotFoundError("Saved Job not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete Saved Job failed"));
    }

    return wrapper.data("Success deleted Saved Job");
  }
}

module.exports = SavedJobs;
