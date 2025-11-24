const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Industries-Command-Domain";

class Industry {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addIndustry(payload) {
    const newPayload = {
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed insert Industry"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateIndustry(payload) {
    const { id } = payload;

    const industry = await this.query.findOne({ id }, { id: 1 });
    if (industry.err) {
      return wrapper.error(new NotFoundError("Industry not found"));
    }

    const result = await this.command.updateOneNew({ id }, { name: payload.name });
    if (result.err) {
      return wrapper.error(new InternalServerError("Update Industry failed"));
    }

    return wrapper.data({ id });
  }

  async deleteIndustry(payload) {
    const { id } = payload;

    const industry = await this.query.findOne({ id }, { id: 1 });
    if (industry.err) {
      return wrapper.error(new NotFoundError("Industry not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete Industry failed"));
    }

    return wrapper.data("Success deleted industry");
  }
}

module.exports = Industry;
