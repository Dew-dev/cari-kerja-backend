const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Portofolios-Query-Domain";

class Portofolios {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Portofolios By Worker Id
  async getAllPortofoliosByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      logger.error(ctx, "getAllPortofoliosByWorkerId", "No portofolio found", result.err);
      return wrapper.error(new NotFoundError("No portofolio found"));
    }

    logger.info(ctx, "getAllPortofoliosByWorkerId", "Success get portofolio", payload);
    return wrapper.data(result.data);
  }
}

module.exports = Portofolios;
