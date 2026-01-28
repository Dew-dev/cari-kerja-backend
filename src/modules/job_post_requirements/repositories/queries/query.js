const collection = "job_post_requirements";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Job_Post_Requirements-Query";

class Query {
  constructor(db) {
    this.db = db;
  }
  
  // parameter: nyari berdasarkan apa
  // projection: kolom apa aja yang mau diambil

    async findOne(parameter, projection) {
        return this.db.findOne(parameter, projection, collection);
    }

    // Get All Job Post Requirements By Job Post Id
    async getAllByJobPostId(job_post_id) {
        try {
            const query = `
            SELECT 
                id,
                requirement,
            FROM job_post_requirements
            WHERE job_post_id = $1
            ORDER BY order_index ASC;
            `;

            const result = await this.db.executeQuery(query, [job_post_id]);

            if (!result || result.rows.length === 0) {
            return wrapper.error(errorEmptyMessage);
            }

            return wrapper.data(result.rows);
        } catch (error) {
            logger.error(ctx, errorQueryMessage, "getAllByJobPostId", error);
            return wrapper.error(errorQueryMessage);
        }
    }
}

module.exports = Query;
