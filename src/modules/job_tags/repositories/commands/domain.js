const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const queryHandler = require("../queries/query_handler");
const queryHandlerJobPosts = require("../../../job_posts/repositories/queries/query_handler");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, InternalServerError, UnauthorizedError } = require("../../../../helpers/errors");
const ctx = "Jobtags-Command-Domain";

class JobPostTags {
    constructor(db) {
        this.command = new Command(db);
        this.query = new Query(db);
    }

    async createJobPostTag(payload) {
        const {job_post_id, name, role_id, recruiter_id} = payload;
        let tag_id = null;
        // Check first if the job post belong to the logged in recruiter id
        const getJobPostResult = await queryHandlerJobPosts.getJobpostById({id: job_post_id});
        if (getJobPostResult.err || role_id !== 2 || getJobPostResult.data.recruiter_id !== recruiter_id) {
            logger.error(ctx, "Create Job Post Tag: Unauthorized", "Job Tags Command Domain", getJobPostResult.err);
            return wrapper.error(new UnauthorizedError("Create Job Post Tag Failed due to Unauthorized"));
        }
        const getJobtagsResult = await queryHandler.getOneTagByName({name});
        if (getJobtagsResult.err || (!getJobtagsResult && getJobtagsResult.rows.length === 0)) {
            // const insertJobtagsResult = await this.db.executeQuery(insertjobtagsQuery, [tag_id, name]);
            const insertJobTagResult = await this.createJobTag({name});
            tag_id = insertJobTagResult.data.id;
        } else {
            tag_id = getJobtagsResult.data.id;
        }

        const insertJobPostTagResult = await this.command.insertOneJobPostTag(tag_id, job_post_id);
        if (insertJobPostTagResult.err) {
            logger.error(ctx, "Create Job Post Tag", "Job Tags Command Domain", insertJobPostTagResult.err);
            return wrapper.error(new InternalServerError("Create Job Post Tag Failed"));
        }
        return wrapper.data({tag_id, job_post_id});

    }

    async createJobTag(payload) {
        const {name} = payload;
        const data = {
            id: uuidv4(),
            name
        }
        const insertJobTagResult = await this.command.insertJobTag(data);
        if (insertJobTagResult.err) {
            logger.error(ctx, "Create Job Tag", "Job Tags Command", insertJobTagResult.err);
            return wrapper.error(new InternalServerError("Create Job Tag Failed"));
        }
        return wrapper.data(data);
    }

}

module.exports = JobPostTags;