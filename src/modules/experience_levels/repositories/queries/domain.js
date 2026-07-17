const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "ExperienceLevels-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class ExperienceLevels {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneExperienceLevel(payload) {
    const { id } = payload;
    const experienceLevel = await this.query.findOne(
      { id },
      { id: 1, name: 1 }
    );
    if (experienceLevel.err) {
      logger.error(
        ctx,
        "getOneExperienceLevel",
        "Can not find ExperienceLevel",
        experienceLevel.err
      );
      return wrapper.error(new NotFoundError("Can not find ExperienceLevel"));
    }

    return wrapper.data(experienceLevel.data);
  }

  async getAllExperienceLevels(payload) {
    const { page, limit, search } = payload;

    const experienceLevels = await this.query.findAllExperienceLevels(
      page,
      limit,
      search
    );
    const count = await this.query.countAllExperienceLevels(search);

    const totalData = this.#extractTotal(count);
    if (totalData === null) {
      logger.error(
        ctx,
        "getAllExperienceLevels",
        "Can not count ExperienceLevels",
        count.err || "empty count rows"
      );
      return wrapper.error(new InternalServerError("Can not count ExperienceLevels"));
    }

    if (experienceLevels.err) {
      if (experienceLevels.err === EMPTY_RESULT_MESSAGE) {
        const meta = wrapper.buildPaginationMeta(page, limit, totalData);
        return wrapper.paginationData([], meta);
      }

      logger.error(
        ctx,
        "getAllExperienceLevels",
        "Can not find ExperienceLevels",
        experienceLevels.err
      );
      return wrapper.error(new NotFoundError("Can not find ExperienceLevels"));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, totalData);
    return wrapper.paginationData(experienceLevels.data, meta);
  }

  #extractTotal(count) {
    if (count.err || !count.data?.rows?.length) {
      return null;
    }
    return count.data.rows[0].total;
  }
}

module.exports = ExperienceLevels;
