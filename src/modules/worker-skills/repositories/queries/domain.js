const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { InternalServerError } = require("../../../../helpers/errors");
const ctx = "WorkerSkills-Query-Domain";

// Sentinel returned by the generic DB helper when a query finds zero rows.
// This is not a real failure, so it must not be surfaced as an error.
const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class WorkerSkills {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Worker Skills By Worker Id
  async getAllWorkerSkillsByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      if (result.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }

      logger.error(ctx, "getAllWorkerSkillsByWorkerId", "Failed to fetch worker skills", result.err);
      return wrapper.error(new InternalServerError("Failed to fetch worker skills"));
    }

    return wrapper.data(result.data || []);
  }
}

module.exports = WorkerSkills;
