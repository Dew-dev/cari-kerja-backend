const collection = "languages";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Languages-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  // parameter: nyari berdasarkan apa
  // projection: kolom apa aja yang mau diambil
  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  // Get All Languages By Worker Id
  async getAllByWorkerId(worker_id) {
    try {
      const query = `
        SELECT 
          l.id,
          l.language_name,
          pl.name AS proficiency_level_name,
          l.is_primary,
          l.updated_at
        FROM ${collection} l
        LEFT JOIN proficiency_levels pl ON pl.id = l.proficiency_level_id
        WHERE l.worker_id = $1
        ORDER BY l.updated_at DESC;
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
