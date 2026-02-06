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

  async findUserByEmail(email) {
    try {
      const res = await this.db.executeQuery(
        "SELECT id, email, hashed_password, role_id, email_verified_at FROM users WHERE email = $1 OR username = $1 LIMIT 1",
        [email],
      );
      return wrapper.data(res.rows[0]);
    } catch (e) {
      return wrapper.error(e);
    }
  }

  async findValidPasswordReset(token) {
    try {
      const res = await this.db.executeQuery(
        `
      SELECT *
      FROM password_resets
      WHERE token = $1
        AND used_at IS NULL
        AND expired_at > NOW()
      LIMIT 1
      `,
        [token],
      );
      return wrapper.data(res.rows[0]);
    } catch (e) {
      return wrapper.error(e);
    }
  }
  async countRecentPasswordResets(user_id) {
    try {
      const res = await this.db.executeQuery(
        `
      SELECT COUNT(*)::int AS total
      FROM password_resets
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '15 minutes'
      `,
        [user_id],
      );

      return wrapper.data(res.rows[0].total);
    } catch (e) {
      return wrapper.error(e);
    }
  }
  async getLastPasswordReset(user_id) {
    try {
      const res = await this.db.executeQuery(
        `
      SELECT created_at
      FROM password_resets
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
        [user_id],
      );

      return wrapper.data(res.rows[0]);
    } catch (e) {
      return wrapper.error(e);
    }
  }

  async findUserById(id) {
    try {
      const res = await this.db.executeQuery(
        `
      SELECT id, hashed_password
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
        [id],
      );
      //console.log("res", id, res);
      return wrapper.data(res.rows[0]);
    } catch (e) {
      return wrapper.error(e);
    }
  }

  async findUserById(id) {
    const res = await this.db.executeQuery(
      `SELECT id, email, name, email_verified_at FROM users WHERE id=$1 LIMIT 1`,
      [id],
    );
    return wrapper.data(res.rows[0]);
  }

  async findValidEmailVerification(token) {
    const res = await this.db.executeQuery(
      `
    SELECT *
    FROM email_verifications
    WHERE token = $1
      AND used_at IS NULL
      AND expired_at > NOW()
    LIMIT 1
    `,
      [token],
    );
    return wrapper.data(res.rows[0]);
  }

  async getLatestEmailVerification(user_id) {
    const res = await this.db.executeQuery(
      `
    SELECT created_at
    FROM email_verifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
      [user_id],
    );
    return wrapper.data(res.rows[0]);
  }

  async countEmailVerificationsInWindow(user_id, minutes = 60) {
    const res = await this.db.executeQuery(
      `
    SELECT COUNT(*)::int AS total
    FROM email_verifications
    WHERE user_id = $1
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
    `,
      [user_id],
    );
    return wrapper.data(res.rows[0]?.total || 0);
  }
}

module.exports = Query;
