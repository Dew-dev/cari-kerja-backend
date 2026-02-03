const collection = "categories"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Categories-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAllCategories(page = 1, limit = 10, search) {
    try {
      const offset = (page - 1) * limit;
      const searchQuery = search ? `%${search}%` : "%%";

      const query = `
      SELECT 
        id,
        name,
        created_at
      FROM ${collection}
      WHERE name ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;

      const values = [searchQuery, limit, offset];
      const result = await this.db.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllCategories", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAllCategoriesWithJobcount() {
        try {

      const query = `
      SELECT
        c.id,
        c.name,
        COUNT(j.id)::int AS job_count
      FROM categories c
      LEFT JOIN job_posts j
        ON j.category_id = c.id
        WHERE j.archived_at IS NULL AND j.status_id < 3
      GROUP BY c.id
      ORDER BY job_count DESC;
      `;

      const result = await this.db.executeQuery(query);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllCategoriesWithJobcount", error);
      return wrapper.error(errorQueryMessage);
    }
  } 

  async countAllCategories(search) {
    try {
      const searchQuery = search ? `%${search}%` : "%%";
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${collection}
      WHERE name ILIKE $1;
    `;
      const countResult = await this.db.executeQuery(countQuery, [searchQuery]);
      return wrapper.data(countResult.rows[0].count);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllCategories", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
