const collection = "skills"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Skills-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAllSkills(page = 1, limit = 10, search) {
    try {
      const offset = (page - 1) * limit;
      const searchQuery = search ? `%${search}%` : "%%";

      const query = `
      SELECT 
        id,
        skills_name
      FROM ${collection}
      WHERE skills_name ILIKE $1
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3;
    `;

      const values = [searchQuery, limit, offset];
      const result = await this.db.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllSkills", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAllSkills(search) {
    try {
      const searchQuery = search ? `%${search}%` : "%%";
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM skills
      WHERE skills_name ILIKE $1;
    `;
      const countResult = await this.db.executeQuery(countQuery, [searchQuery]);
      return wrapper.data(countResult.rows[0].count);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllSkills", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
