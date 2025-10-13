const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Portofolios-Domain";

class Portofolios {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  // INSERT one portofolio
  async insertOne(payload) {
    const document = {
      worker_id: payload.worker_id,
      title: payload.title,
      description: payload.description || null,
      link: payload.link,
      is_public: payload.is_public || false,
    };
    const result = await this.command.insertOne(document);
    if (!result.data) {
      return wrapper.error(new InternalServerError("Failed to insert portofolio"));
    }
    return wrapper.data({ id: result.data.id }, "Success insert portofolio", 201);
  }

  // UPDATE one portofolio
  async updateOne(payload) {
    const { id, worker_id } = payload;
    const existing = await this.query.findOne({ id }, { id: 1 });
    if (!existing.data) {
      return wrapper.error(new NotFoundError("Portofolio not found"));
    }

    const document = {
      title: payload.title,
      description: payload.description || null,
      link: payload.link,
      is_public: payload.is_public || false,
    };

    const result = await this.command.updateOneNew({ id, worker_id }, document);
    if (!result.data) {
      return wrapper.error(new InternalServerError("Failed to update portofolio"));
    }

    return wrapper.data({ id }, "Success update portofolio", 200);
  }

  // DELETE one portofolio
  async deleteOne(payload) {
    const existing = await this.query.findOne({ id: payload.id, worker_id: payload.worker_id }, { id: 1 });
    if (!existing.data) {
      return wrapper.error(new NotFoundError("Portofolio not found"));
    }

    const result = await this.command.deleteOne({ id: payload.id, worker_id: payload.worker_id });
    if (!result.data) {
      return wrapper.error(new InternalServerError("Failed to delete portofolio"));
    }

    return wrapper.data("Successfully deleted", "Success delete portofolio", 200);
  }
}

module.exports = Portofolios;
