const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "WorkerSkills-Query-Domain";

class WorkerSkills {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Worker Skills By Worker Id
  async getAllWorkerSkillsByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      logger.error(ctx, "getAllWorkerSkillsByWorkerId", "No worker skills found", result.err);
      return wrapper.error(new NotFoundError("No worker skills found"));
    }

    logger.info(ctx, "getAllWorkerSkillsByWorkerId", "Success get worker skills", payload);
    return wrapper.data(result.data);
  }
}

module.exports = WorkerSkills;
