const collection = "employment_types"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "EmploymentTypes-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAllEmploymentTypes(page = 1, limit, search) {
    try {
      let offset;
      let limitOffsetQuery = '';
      let values;
      const searchQuery = search ? `%${search}%` : "%%";

      if (limit) {
        offset = (page - 1) * limit;
        limitOffsetQuery = `LIMIT $2 OFFSET $3`;
        values = [searchQuery, limit, offset];
      } else {
        values = [searchQuery];
      }

      const query = `
      SELECT 
        id,
        name
      FROM ${collection}
      WHERE name ILIKE $1
      ORDER BY name DESC
      ${limitOffsetQuery};
      `;

      
      
      const result = await this.db.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllEmploymentTypes", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAllEmploymentTypes(search) {
    try {
      const searchQuery = search ? `%${search}%` : "%%";
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${collection}
      WHERE name ILIKE $1;
      `;
      const countResult = await this.db.executeQuery(countQuery, [searchQuery]);
      
      return wrapper.data(countResult);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllEmploymentTypes", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
