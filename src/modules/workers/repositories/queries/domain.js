const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Worker-Query-Domain";

class Worker {
  constructor(db) {
    this.query = new Query(db);
  }

  async getWorkerByUserId(payload) {
    const { user_id } = payload;

    const worker = await this.query.findOneByUserId(user_id);
    if (worker.err) {
      logger.error(ctx, "getWorker", "Can not find worker", worker.err);
      return wrapper.error(new NotFoundError("Can not find worker"));
    }

    logger.info(ctx, "getWorker", "get detail worker", payload);
    return wrapper.data(worker.data);
  }
}

module.exports = Worker;
