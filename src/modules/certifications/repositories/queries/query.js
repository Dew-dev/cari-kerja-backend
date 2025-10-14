const collection = "certifications"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Certifications-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAll(worker_id, page = 1, limit = 10) {
    try {
      const offset = (Number(page) - 1) * Number(limit);
      const query = `
        SELECT 
          id,
          name,
          issuer,
          issue_date,
          expiry_date,
          credential_id,
          is_active,
          updated_at
        FROM ${collection}
        WHERE worker_id = $1
        ORDER BY updated_at DESC
        LIMIT $2 OFFSET $3;
      `;
      const values = [worker_id, Number(limit), Number(offset)];
      const result = await this.db.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllCertification", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAll(worker_id) {
    try {
      const query = `SELECT COUNT(id) FROM ${collection} WHERE worker_id = $1;`;
      const result = await this.db.executeQuery(query, [worker_id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0].count);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllCertification", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
