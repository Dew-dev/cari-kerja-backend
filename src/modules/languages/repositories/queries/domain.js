const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Languages-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Languages {
  constructor(db) {
    this.query = new Query(db);
  }

  async getAllMasterLanguages(payload) {
    const { search } = payload || {};

    const result = await this.query.findAllMasterLanguages(search);

    if (result.err) {
      if (result.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }
      logger.error(ctx, "getAllMasterLanguages", "Failed to get master languages", result.err);
      return wrapper.error(new NotFoundError("Cannot find languages"));
    }

    return wrapper.data(result.data);
  }

  async getAllLanguagesByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      if (result.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }
      logger.error(ctx, "getAllLanguagesByWorkerId", "No languages found", result.err);
      return wrapper.error(new NotFoundError("No languages found"));
    }

    return wrapper.data(result.data);
  }
}

module.exports = Languages;
