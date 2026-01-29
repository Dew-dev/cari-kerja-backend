const collection = "users";

const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne(document) {
    return this.db.insertOne(document, collection);
  }

  async updateOneNew(parameter, document) {
    return this.db.updateOneNew(parameter, document, collection);
  }

  async deleteOne(parameter) {
    return this.db.deleteOne(parameter, collection);
  }

  // async updateResetToken(payload) {
  //   return this.db("users").where({ id: payload.id }).update({
  //     reset_password_token: payload.reset_password_token,
  //     reset_password_expires: payload.reset_password_expires,
  //   });
  // }

  // async resetPassword(payload) {
  //   return this.db("users").where({ id: payload.id }).update({
  //     password: payload.password,
  //     reset_password_token: null,
  //     reset_password_expires: null,
  //   });
  // }

  async insertPasswordReset({ user_id, token, expired_at }) {
    return this.db.executeQuery(
      `
    INSERT INTO password_resets (user_id, token, expired_at)
    VALUES ($1, $2, $3)
    `,
      [user_id, token, expired_at],
    );
  }

  async updateUserPassword({ user_id, password }) {
    try {
      const res = await this.db.executeQuery(
        `
      UPDATE users
      SET hashed_password = $2, updated_at = NOW()
      WHERE id = $1
      `,
        [user_id, password],
      );

      if (res.rowCount === 0) {
        return wrapper.error("USER_NOT_FOUND");
      }

      return wrapper.data(true);
    } catch (e) {
      return wrapper.error(e);
    }
  }

  async markPasswordResetUsed(id) {
    return this.db.executeQuery(
      `
    UPDATE password_resets
    SET used_at = NOW()
    WHERE id = $1
    `,
      [id],
    );
  }

  async invalidatePasswordResets(user_id) {
    return this.db.executeQuery(
      `
    UPDATE password_resets
    SET used_at = NOW()
    WHERE user_id = $1 AND used_at IS NULL
    `,
      [user_id],
    );
  }

  async insertEmailVerification({ user_id, token, expired_at }) {
    return this.db.executeQuery(
      `
    INSERT INTO email_verifications (user_id, token, expired_at)
    VALUES ($1, $2, $3)
    `,
      [user_id, token, expired_at],
    );
  }

  async invalidateEmailVerifications(user_id) {
    return this.db.executeQuery(
      `
    UPDATE email_verifications
    SET used_at = NOW()
    WHERE user_id = $1 AND used_at IS NULL
    `,
      [user_id],
    );
  }

  async markEmailVerified(user_id) {
    return this.db.executeQuery(
      `
    UPDATE users
    SET email_verified_at = NOW()
    WHERE id = $1
    `,
      [user_id],
    );
  }
}

module.exports = Command;
