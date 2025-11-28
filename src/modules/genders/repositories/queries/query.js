const collection = "genders"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Genders-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAllGenders(page = 1, limit = 10, search) {
    try {
      const offset = (page - 1) * limit;
      const searchQuery = search ? `%${search}%` : "%%";

      const query = `
      SELECT 
        id,
        gender_name
      FROM ${collection}
      WHERE gender_name ILIKE $1
      ORDER BY gender_name DESC
      LIMIT $2 OFFSET $3;
    `;

      const values = [searchQuery, limit, offset];
      const result = await this.db.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllGenders", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAllGenders(search) {
    try {
      const searchQuery = search ? `%${search}%` : "%%";
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${collection}
      WHERE gender_name ILIKE $1;
      `;
      const countResult = await this.db.executeQuery(countQuery, [searchQuery]);
      return wrapper.data(countResult.rows[0].count);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllGenders", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
