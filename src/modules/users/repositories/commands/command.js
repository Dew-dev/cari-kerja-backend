const collection = "users";
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

  async updateResetToken(payload) {
    return this.db("users").where({ id: payload.id }).update({
      reset_password_token: payload.reset_password_token,
      reset_password_expires: payload.reset_password_expires,
    });
  }

  async resetPassword(payload) {
    return this.db("users").where({ id: payload.id }).update({
      password: payload.password,
      reset_password_token: null,
      reset_password_expires: null,
    });
  }
}

module.exports = Command;
