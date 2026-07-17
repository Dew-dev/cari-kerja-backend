const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Portofolios-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Portofolios {
  constructor(db) {
    this.query = new Query(db);
  }

  async getAllPortfoliosByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      if (result.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }
      logger.error(ctx, "getAllPortofoliosByWorkerId", "No portofolio found", result.err);
      return wrapper.error(new NotFoundError("No portofolio found"));
    }

    return wrapper.data(result.data);
  }
}

module.exports = Portofolios;
