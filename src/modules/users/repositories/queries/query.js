const collection = "users";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "User-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection, conditions = "AND") {
    return this.db.findOne(parameter, projection, collection, conditions);
  }

  async findOneById(id) {
    try {
      const query = `
        SELECT u.id, r.name AS role, u.username, u.email, u.login_provider, u.provider_id, u.created_at
        FROM ${collection} u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
        LIMIT 1;
      `;
      const values = [id];
      const result = await this.db.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findOne", err);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
