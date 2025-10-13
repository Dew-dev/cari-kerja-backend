const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Jobposts-Query-Domain";

class Jobposts {
    constructor(db) {
        this.query = new Query(db);
    }

    async getJobpostsByRecruiterId(payload) {
        const jobposts = await this.query.findAllByRecruiterId(payload);

        if (jobposts.err) {
            logger.error(ctx, "getJobpostsByRecruiterId", "Can not find jobposts", jobposts.err);
            return wrapper.error(new NotFoundError("Can not find jobposts"));
        }

        logger.info(ctx, "getJobpostsByRecruiterId", "Get Jobposts", payload);
        return wrapper.data(jobposts.data);
    }

    async getJobpostById(payload) {
        const { id } = payload;
        const jobpost = await this.query.findOneByJobpostsId(id);

        if (jobpost.err) {
            logger.error(ctx, "getJobpostById", "Job Post Query", jobpost.err);
            return wrapper.error(new NotFoundError("Can not find the job post"));
        }

        logger.info(ctx, "getJobpostById", "Job Post Query", payload);
        return wrapper.data(jobpost.data);
    }
}

module.exports = Jobposts;