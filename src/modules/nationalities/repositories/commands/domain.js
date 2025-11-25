const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Nationalities-Command-Domain";

class Nationality {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addNationality(payload) {
    const newPayload = {
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed insert Nationality"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateNationality(payload) {
    const { id } = payload;

    const nationality = await this.query.findOne({ id }, { id: 1 });
    if (nationality.err) {
      return wrapper.error(new NotFoundError("Nationality not found"));
    }

    const result = await this.command.updateOneNew({ id }, { name: payload.country_name });
    if (result.err) {
      return wrapper.error(new InternalServerError("Update Nationality failed"));
    }

    return wrapper.data({ id });
  }

  async deleteNationality(payload) {
    const { id } = payload;

    const nationality = await this.query.findOne({ id }, { id: 1 });
    if (nationality.err) {
      return wrapper.error(new NotFoundError("Nationality not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete Nationality failed"));
    }

    return wrapper.data("Success deleted nationality");
  }
}

module.exports = Nationality;
