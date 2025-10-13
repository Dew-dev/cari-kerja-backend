const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Languages-Query-Domain";

class Languages {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Languages By Worker Id
  async getAllLanguagesByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      logger.error(ctx, "getAllLanguagesByWorkerId", "No languages found", result.err);
      return wrapper.error(new NotFoundError("No languages found"));
    }

    logger.info(ctx, "getAllLanguagesByWorkerId", "Success get languages", payload);
    return wrapper.data(result.data);
  }
}

module.exports = Languages;
