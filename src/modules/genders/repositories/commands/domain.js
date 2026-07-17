const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  InternalServerError,
  ConflictError,
} = require("../../../../helpers/errors");
const ctx = "Genders-Command-Domain";

class Genders {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addGender(payload) {
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
        return wrapper.error(new ConflictError("Gender name already exists"));
      }
      logger.error(ctx, "addGender", "Failed insert Gender", result.err);
      return wrapper.error(new InternalServerError("Failed insert Gender"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateGender(payload) {
    const { id } = payload;

    const gender = await this.query.findOne({ id }, { id: 1 });
    if (gender.err) {
      return wrapper.error(new NotFoundError("Gender not found"));
    }

    const result = await this.command.updateOneNew(
      { id },
      { gender_name: payload.gender_name }
    );
    if (result.err) {
      const message = result.err.message || "";
      const isDuplicate =
        result.err.code === "23505" ||
        /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(new ConflictError("Gender name already exists"));
      }
      return wrapper.error(new InternalServerError("Update Gender failed"));
    }

    return wrapper.data({ id });
  }

  async deleteGender(payload) {
    const { id } = payload;

    const gender = await this.query.findOne({ id }, { id: 1 });
    if (gender.err) {
      return wrapper.error(new NotFoundError("Gender not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete Gender failed"));
    }

    return wrapper.data("Success deleted gender");
  }
}

module.exports = Genders;
