const collection = "portfolios";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Portfolios-Query";

class Query {
  constructor(db) {
    this.db = db;
  }
  
  // parameter: nyari berdasarkan apa
  // projection: kolom apa aja yang mau diambil
  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  // Get All Portfolios By Worker Id
  async getAllByWorkerId(worker_id) {
    try {
      const query = `
        SELECT 
          id,
          title,
          description,
          link,
          is_public,
          created_at,
          updated_at
        FROM portfolios
        WHERE worker_id = $1
        ORDER BY created_at DESC;
      `;

      const result = await this.db.executeQuery(query, [worker_id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getAllByWorkerId", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
