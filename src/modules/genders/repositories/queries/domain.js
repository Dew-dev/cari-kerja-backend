const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Genders-Query-Domain";

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

    //console.log(genders);

    if (genders.err) {
      logger.error(ctx, "getAllGenders", "Can not find Genders", genders.err);
      return wrapper.error(new NotFoundError("Can not find genders"));
    }

    const totalData = count.data;
    const totalPages = Math.ceil(totalData / limit);
    const meta = {
      page: page,
      per_page: limit,
      total_data: Math.max(totalData, 0),
      total_pages: totalPages,
    };

    return wrapper.paginationData(genders.data, meta);
  }
}

module.exports = Genders;
