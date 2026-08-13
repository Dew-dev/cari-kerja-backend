const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Educations-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Educations {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Educations By Worker Id
  async getAllEducationsByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      if (result.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }
      logger.error(ctx, "getAllEducationsByWorkerId", "No educations found", result.err);
      return wrapper.error(new NotFoundError("No educations found"));
    }

    return wrapper.data(result.data);
  }

  // Get One Education By Id
  async getEducationsById(payload) {
    const { worker_id, id } = payload;

    const result = await this.query.getOneById(worker_id, id);

    if (result.err) {
      logger.error(ctx, "getEducationsById", "Educations not found", result.err);
      return wrapper.error(new NotFoundError("Educations not found"));
    }

    return wrapper.data(result.data);
  }
}

module.exports = Educations;
