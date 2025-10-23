const job_tags_collection = "job_tags";
const job_post_tags_collection = "job_post_tags";
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const errorQueryMessage = "Error querying PostgreSQL";
const ctx = "InsertOneJobPostTag";

class Command {
    constructor(db) {
        this.db = db;
    }

    async insertOneJobPostTag(tag_id, job_post_id) {
        try {
            const query = `
            INSERT INTO ${job_post_tags_collection} (job_post_id, tag_id)
            SELECT $1, $2
            WHERE NOT EXISTS (
            SELECT 1 FROM ${job_post_tags_collection}
            WHERE job_post_id = $1 AND tag_id = $2
            )
            RETURNING *;
            `;
            // const getJobtagsResult = await this.db.executeQuery(selectjobtagsQuery, [name]);

            const result = await this.db.executeQuery(query, [job_post_id, tag_id]);
            if (!result || result.rows.length === 0) {
                return wrapper.error(ctx, errorQueryMessage, "insertOne", );
            }

            return wrapper.data(result.rows[0]);
        } catch (error) {
            logger.error(ctx, errorQueryMessage, "insertOneJobPostTag", error);
            return wrapper.error(errorQueryMessage);
        }
    }

    async insertJobTag(document) {
        return this.db.insertOne(document, job_tags_collection);
    }

    async deleteJobPostTag(parameter) {
        return this.db.deleteOne(parameter, job_post_tags_collection);
    }

}

module.exports = Command;
