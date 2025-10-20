const collection = "resumes"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Resumes-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAll(worker_id, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const query = `
          SELECT 
            id,
            worker_id,
            resume_url,
            title,
            is_default,
            updated_at
          FROM ${collection}
          WHERE worker_id = $1
          ORDER BY updated_at DESC
          LIMIT $2 OFFSET $3;
        `;
      const values = [worker_id, limit, offset];
      const result = await this.db.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllResumes", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAll() {
    try {
      const query = `SELECT COUNT(id) FROM ${collection};`;
      const result = await this.db.executeQuery(query);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0].count);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllResumes", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
