const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Jobposttags-Query-Domain";

class JobPostTags {
    constructor(db) {
        this.query = new Query(db);
    }

    async getOneTagByName(payload) {
        const {name} = payload;

        const jobtag = await this.query.findOneJobTags({name}, {id: 1, name: 1});
        if (jobtag.err) {
            logger.error(ctx, "getOneTagByName", "Can not find tag", jobtag.err);
            return wrapper.error(new NotFoundError("Can not find tag"));
        }

        logger.info(ctx, "getTag", "Get job tag", payload);
        return wrapper.data(jobtag.data);
    }

    async getTagsPerJobPost(payload) {
        const {job_post_id} = payload;

        const jobposttags = await this.query.findtagsPerJobPost(job_post_id);
        if (jobposttags.err) {
            logger.error(ctx, "getJobposttags", "Can not find tags", jobposttags.err);
            return wrapper.error(new NotFoundError("Can not find tags"));
        }

        logger.info(ctx, "getTags", "Get job post tags", payload);
        return wrapper.data(jobposttags.data);
    }

}

module.exports = JobPostTags;