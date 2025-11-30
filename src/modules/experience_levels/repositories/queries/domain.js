const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "ExperienceLevels-Query-Domain";

class ExperienceLevels {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneExperienceLevel(payload) {
    const { id } = payload;
    const experienceLevel = await this.query.findOne({ id }, { id: 1, name: 1});
    if (experienceLevel.err) {
      logger.error(ctx, "getOneExperienceLevel", "Can not find ExperienceLevel", experienceLevel.err);
      return wrapper.error(new NotFoundError("Can not find ExperienceLevel"));
    }

    return wrapper.data(experienceLevel.data);
  }

  async getAllExperienceLevels(payload) {
    const { page, limit, search } = payload;

    const experienceLevels = await this.query.findAllExperienceLevels(page, limit, search);
    const count = await this.query.countAllExperienceLevels(search);

    console.log(experienceLevels);

    if (experienceLevels.err) {
      logger.error(ctx, "getAllExperienceLevels", "Can not find ExperienceLevels", experienceLevels.err);
      return wrapper.error(new NotFoundError("Can not find ExperienceLevels"));
    }

    const totalData = count.data.rows[0].total;
    let totalPages;
    if (limit) {
      totalPages = Math.ceil(totalData / limit);
    }
    const meta = {
      page: page,
      per_page: limit,
      total_data: parseInt(totalData),
      total_pages: totalPages,
    };

    return wrapper.paginationData(experienceLevels.data, meta);
  }
}

module.exports = ExperienceLevels;
