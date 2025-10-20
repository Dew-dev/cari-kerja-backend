const job_tags_collection = "job_tags";
const job_post_tags_collection = "job_post_tags";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Jobtags-Query";

class Query {
    constructor(db) {
        this.db = db;
    }

    async findOneJobTags(parameter, projection) {
        return this.db.findOne(parameter, projection, job_tags_collection);
    }

    async findtagsPerJobPost(job_post_id) {
        try {
            const jobposttagsQuery = `
            SELECT jt.id, jt.name
            FROM ${job_tags_collection} jt
            INNER JOIN ${job_post_tags_collection} jpt ON jt.id = jpt.tag_id
            WHERE jpt.job_post_id = $1
            ORDER BY jt.name ASC;
            `;
    
            const jobposttagsResult = await this.db.executeQuery(jobposttagsQuery, [job_post_id]);
            if (!jobposttagsResult || jobposttagsResult.rows.length === 0) {
                return wrapper.error("Tags Not Found");
            }

            const result = jobposttagsResult.rows;
            return wrapper.data(result);
        } catch (error) {
            logger.error(ctx, errorQueryMessage, "findtagsPerJobPost", error);
            return wrapper.error(errorQueryMessage);
        }
        
    }
}

module.exports = Query;

