const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  InternalServerError,
  ConflictError,
} = require("../../../../helpers/errors");
const ctx = "ExperienceLevels-Command-Domain";

class ExperienceLevels {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addExperienceLevel(payload) {
    const newPayload = {
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      const message = result.err.message || "";
      const isDuplicate =
        result.err.code === "23505" ||
        /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(new ConflictError("Experience level name already exists"));
      }
      logger.error(ctx, "addExperienceLevel", "Failed insert ExperienceLevels", result.err);
      return wrapper.error(new InternalServerError("Failed insert ExperienceLevels"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateExperienceLevel(payload) {
    const { id } = payload;

    const experienceLevels = await this.query.findOne({ id }, { id: 1 });
    if (experienceLevels.err) {
      return wrapper.error(new NotFoundError("Experience Level not found"));
    }

    const result = await this.command.updateOneNew({ id }, { name: payload.name });
    if (result.err) {
      const message = result.err.message || "";
      const isDuplicate =
        result.err.code === "23505" ||
        /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(new ConflictError("Experience level name already exists"));
      }
      return wrapper.error(new InternalServerError("Update ExperienceLevel failed"));
    }

    return wrapper.data({ id });
  }

  async deleteExperienceLevel(payload) {
    const { id } = payload;

    const experienceLevel = await this.query.findOne({ id }, { id: 1 });
    if (experienceLevel.err) {
      return wrapper.error(new NotFoundError("Experience Level not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete Experience Level failed"));
    }

    return wrapper.data("Success deleted Experience Level");
  }
}

module.exports = ExperienceLevels;
