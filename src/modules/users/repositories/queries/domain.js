const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "User-Query-Domain";

class User {
  constructor(db) {
    this.query = new Query(db);
  }

  async getUserById(payload) {
    const { id } = payload;
    const user = await this.query.findOneById(id);
    if (user.err) {
      logger.error(ctx, "getUser", "Can not find user", user.err);
      return wrapper.error(new NotFoundError("Can not find user"));
    }

    return wrapper.data(user.data);
  }
}

module.exports = User;
