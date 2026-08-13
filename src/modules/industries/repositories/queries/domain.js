const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Industries-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Industry {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneIndustry(payload) {
    const { id } = payload;
    const industry = await this.query.findOne(
      { id },
      { id: 1, name: 1, created_at: 1 }
    );
    if (industry.err) {
      logger.error(ctx, "getIndustry", "Can not find Industry", industry.err);
      return wrapper.error(new NotFoundError("Can not find Industry"));
    }

    return wrapper.data(industry.data);
  }

  async getAllIndustries(payload) {
    const { page, limit, search } = payload;

    const industries = await this.query.findAllIndustries(page, limit, search);
    const count = await this.query.countAllIndustries(search);

    if (count.err) {
      logger.error(ctx, "getAllIndustries", "Can not count Industries", count.err);
      return wrapper.error(new InternalServerError("Can not count industries"));
    }

    if (industries.err) {
      if (industries.err === EMPTY_RESULT_MESSAGE) {
        const meta = wrapper.buildPaginationMeta(page, limit, count.data);
        return wrapper.paginationData([], meta);
      }

      logger.error(
        ctx,
        "getAllIndustries",
        "Can not find Industries",
        industries.err
      );
      return wrapper.error(new NotFoundError("Can not find industries"));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, count.data);
    return wrapper.paginationData(industries.data, meta);
  }
}

module.exports = Industry;
