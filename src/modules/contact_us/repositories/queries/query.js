const collection = "contact_us";
const errorEmptyMessage = "Data Not Found";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "ContactUs-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findAll(page = 1, limit = 10, search = null) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          id,
          name,
          email,
          subject,
          message,
          phone,
          created_at
        FROM ${collection}
        WHERE 1=1
      `;
      const values = [];

      if (search) {
        query += ` AND (name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 2} OR subject ILIKE $${values.length + 3})`;
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAll", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAll(search = null) {
    try {
      let query = `SELECT COUNT(id) FROM ${collection} WHERE 1=1`;
      const values = [];

      if (search) {
        query += ` AND (name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 2} OR subject ILIKE $${values.length + 3})`;
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows[0].count);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAll", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }
}

module.exports = Query;
