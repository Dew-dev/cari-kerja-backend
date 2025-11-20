const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Recruiter-Query-Domain";

class Recruiter {
  constructor(db) {
    this.query = new Query(db);
  }

  async getRecruiterByUserId(payload) {
    const { user_id } = payload;
    const recruiter = await this.query.findOneByRecruiterUserId(user_id);
    if (recruiter.err) {
      logger.error(
        ctx,
        "getRecruiter",
        "Can not find recruiter",
        recruiter.err
      );
      return wrapper.error(new NotFoundError("Can not find recruiter"));
    }

    logger.info(ctx, "getRecruiter", "Get detail recruiter", payload);
    return wrapper.data(recruiter.data);
  }
}

module.exports = Recruiter;
