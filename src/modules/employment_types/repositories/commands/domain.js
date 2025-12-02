const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "EmploymentTypes-Command-Domain";

class EmploymentTypes {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addEmploymentType(payload) {
    const newPayload = {
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed insert EmploymentTypes"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateEmploymentType(payload) {
    const { id } = payload;

    const employmentType = await this.query.findOne({ id }, { id: 1 });
    if (employmentType.err) {
      return wrapper.error(new NotFoundError("Employment Type not found"));
    }

    const result = await this.command.updateOneNew({ id }, { name: payload.name });
    if (result.err) {
      return wrapper.error(new InternalServerError("Update EmploymentTypes failed"));
    }

    return wrapper.data({ id });
  }

  async deleteEmploymentType(payload) {
    const { id } = payload;

    const employmentType = await this.query.findOne({ id }, { id: 1 });
    if (employmentType.err) {
      return wrapper.error(new NotFoundError("EmploymentType not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete EmploymentType failed"));
    }

    return wrapper.data("Success deleted EmploymentType");
  }
}

module.exports = EmploymentTypes;
