const Query = require("../queries/query");
const Command = require("./command");
const QueryWorker = require("../../../workers/repositories/queries/query");
const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  InternalServerError,
  BadRequestError,
} = require("../../../../helpers/errors");
const ctx = "Certification-Command-Domain";

class Certification {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.queryWorker = new QueryWorker(db);
  }

  async addCertification(payload) {
    const { worker_id } = payload;

    const worker = await this.queryWorker.findOne({ id: worker_id }, { id: 1 });
    if (worker.err) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    const newPayload = {
      id: uuidv4(),
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Failed insert certification")
      );
    }

    return wrapper.data(result.data);
  }

  async updateCertification(payload) {
    const { id, worker_id } = payload;

    if (!id || !worker_id) {
      return wrapper.error(new BadRequestError("id dan worker_id wajib diisi"));
    }

    const certification = await this.query.findOne(
      { id, worker_id },
      {
        id: 1,
        worker_id: 1,
        name: 1,
        issuer: 1,
        issue_date: 1,
        expiry_date: 1,
        credential_id: 1,
        is_active: 1,
        updated_at: 1,
        link: 1,
      }
    );
    if (certification.err || !certification.data) {
      return wrapper.error(new NotFoundError("Certification not found"));
    }

    const updatableFields = [
      "name",
      "issuer",
      "issue_date",
      "expiry_date",
      "credential_id",
      "is_active",
    ];

    const updateData = {};
    for (const field of updatableFields) {
      if (payload[field] !== undefined && payload[field] !== null) {
        updateData[field] = payload[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return wrapper.error(
        new BadRequestError("Tidak ada data untuk diupdate")
      );
    }

    const updateResult = await this.command.updateOneNew(
      { id, worker_id },
      updateData
    );
    if (updateResult.err) {
      return wrapper.error(
        new InternalServerError("Update certification failed")
      );
    }

    return wrapper.data(updateData);
  }

  async deleteCertification(payload) {
    const { id } = payload;

    const certification = await this.query.findOne({ id }, { id: 1 });
    if (certification.err || !certification.data) {
      return wrapper.error(new NotFoundError("Certification not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(
        new InternalServerError("Delete certification failed")
      );
    }

    return wrapper.data("Success deleted certification");
  }
}

module.exports = Certification;
