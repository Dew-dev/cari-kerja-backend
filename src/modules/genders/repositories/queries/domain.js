const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Genders-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Genders {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneGender(payload) {
    const { id } = payload;
    const gender = await this.query.findOne({ id }, { id: 1, gender_name: 1 });
    if (gender.err) {
      logger.error(ctx, "getGender", "Can not find Gender", gender.err);
      return wrapper.error(new NotFoundError("Can not find Gender"));
    }

    return wrapper.data(gender.data);
  }

  async getAllGenders(payload) {
    const { page, limit, search } = payload;

    const genders = await this.query.findAllGenders(page, limit, search);
    const count = await this.query.countAllGenders(search);

    if (count.err) {
      logger.error(ctx, "getAllGenders", "Can not count Genders", count.err);
      return wrapper.error(new InternalServerError("Can not count genders"));
    }

    if (genders.err) {
      if (genders.err === EMPTY_RESULT_MESSAGE) {
        const meta = wrapper.buildPaginationMeta(page, limit, count.data);
        return wrapper.paginationData([], meta);
      }

      logger.error(ctx, "getAllGenders", "Can not find Genders", genders.err);
      return wrapper.error(new NotFoundError("Can not find genders"));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, count.data);
    return wrapper.paginationData(genders.data, meta);
  }
}

module.exports = Genders;
