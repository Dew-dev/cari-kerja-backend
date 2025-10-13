const Query = require("../queries/query");
const Command = require("./command");
const QueryWorker = require("../../../workers/repositories/queries/query");
const { uuidv4 } = require("uuid");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Resume-Command-Domain";

class Resume {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.queryWorker = new QueryWorker(db);
  }

  async addResume(payload) {
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
      return wrapper.error(new InternalServerError("Failed insert resume"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateResume(payload) {
    const { id } = payload;

    if (!id) {
      return wrapper.error(new BadRequestError("id wajib diisi"));
    }

    // Cek apakah resume dengan id tersebut ada
    const resume = await this.query.findOne({ id }, { id: 1 });
    if (resume.err || !resume.data) {
      return wrapper.error(new NotFoundError("Resume not found"));
    }

    // Daftar field yang bisa diupdate
    const updatableFields = ["resume_url", "title", "is_default"];

    const updateData = {};
    for (const field of updatableFields) {
      if (payload[field] !== undefined && payload[field] !== null) {
        updateData[field] = payload[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return wrapper.error(new BadRequestError("Tidak ada data untuk diupdate"));
    }

    // Lakukan update
    const updateResult = await this.command.updateOneNew({ id }, updateData);
    if (updateResult.err) {
      return wrapper.error(new InternalServerError("Update resume failed"));
    }

    return wrapper.data({ id });
  }

  async deleteResume(payload) {
    const { id } = payload;

    const resume = await this.query.findOne({ id }, { id: 1 });
    if (resume.err || !resume.data) {
      return wrapper.error(new NotFoundError("resume not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete resume failed"));
    }

    return wrapper.data("Success deleted resume");
  }
}

module.exports = Resume;
