const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} = require("../../../../helpers/errors");
const ctx = "Portofolios-Domain";

class Portofolios {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async insertOne(payload) {
    const document = {
      id: uuidv4(),
      worker_id: payload.worker_id,
      title: payload.title,
      description: payload.description || null,
      link: payload.link,
      is_public: payload.is_public || false,
    };
    const result = await this.command.insertOne(document);
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Failed to insert portofolio")
      );
    }
    return wrapper.data(result.data);
  }

  async updateOne(payload) {
    const { id, worker_id } = payload;
    const existing = await this.query.findOne(
      { id, worker_id },
      { id: 1, worker_id: 1 }
    );
    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("Portofolio not found"));
    }

    if (existing.data.worker_id && existing.data.worker_id !== worker_id) {
      return wrapper.error(
        new ForbiddenError("You are not allowed to update this portfolio")
      );
    }

    const document = {
      title: payload.title,
      description: payload.description || null,
      link: payload.link,
      is_public: payload.is_public || false,
    };

    const result = await this.command.updateOneNew({ id, worker_id }, document);
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Failed to update portofolio")
      );
    }

    return wrapper.data({ id });
  }

  async deleteOne(payload) {
    const existing = await this.query.findOne(
      { id: payload.id, worker_id: payload.worker_id },
      { id: 1 }
    );
    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("Portofolio not found"));
    }

    const result = await this.command.deleteOne({
      id: payload.id,
      worker_id: payload.worker_id,
    });
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Failed to delete portofolio")
      );
    }

    return wrapper.data("Successfully deleted");
  }
}

module.exports = Portofolios;
