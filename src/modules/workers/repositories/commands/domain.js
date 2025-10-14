const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, ConflictError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Worker-Command-Domain";

class Worker {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async updateOneWorker(payload) {
    const { id } = payload;

    const worker = this.query.findOne({ id }, { id: 1 });
    if (worker.err) {
      return wrapper.error(new NotFoundError("Worker Not Found"));
    }

    const updatableFields = [
      "name",
      "avatar_url",
      "telephone",
      "date_of_birth",
      "gender_id",
      "nationality_id",
      "religion_id",
      "marriage_status_id",
      "address",
      "profile_summary",
      "current_salary",
      "expected_salary",
    ];

    const updateData = {};
    for (const field of updatableFields) {
      if (payload[field] !== undefined && payload[field] !== null) {
        updateData[field] = payload[field];
      }
    }

    const updateResult = await this.command.updateOneNew({ id }, updateData);
    if (updateResult.err) {
      return wrapper.error(new InternalServerError("Update worker failed"));
    }
    return wrapper.data({ id });
  }
}

module.exports = Worker;
