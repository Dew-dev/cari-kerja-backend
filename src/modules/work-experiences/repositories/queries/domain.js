const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "WorkExperience-Query-Domain";

class WorkExperience {
  constructor(db) {
    this.query = new Query(db);
  }

  // Get All Work Experiences By Worker Id
  async getAllWorkExperiencesByWorkerId(payload) {
    const { worker_id } = payload;

    const result = await this.query.getAllByWorkerId(worker_id);

    if (result.err) {
      logger.error(ctx, "getAllWorkExperiencesByWorkerId", "No work experiences found", result.err);
      return wrapper.error(new NotFoundError("No work experiences found"));
    }

    logger.info(ctx, "getAllWorkExperiencesByWorkerId", "Success get worker experiences", payload);
    return wrapper.data(result.data);
  }

  // Get One Work Experience By Id
  async getWorkExperienceById(payload) {
    const { worker_id, id } = payload;

    const result = await this.query.getOneById(worker_id, id);

    if (result.err) {
      logger.error(ctx, "getWorkExperienceById", "Work experience not found", result.err);
      return wrapper.error(new NotFoundError("Work experience not found"));
    }

    logger.info(ctx, "getWorkExperienceById", "Success get worker experience", payload);
    return wrapper.data(result.data);
  }
}

module.exports = WorkExperience;
