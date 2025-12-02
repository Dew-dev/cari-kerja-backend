const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Industries-Query-Domain";

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

    //console.log(industries);

    if (industries.err) {
      logger.error(
        ctx,
        "getAllIndustries",
        "Can not find Industries",
        industries.err
      );
      return wrapper.error(new NotFoundError("Can not find industries"));
    }

    const totalData = count.data;
    const totalPages = Math.ceil(totalData / limit);
    const meta = {
      page: page,
      per_page: limit,
      total_data: Math.max(totalData, 0),
      total_pages: totalPages,
    };

    return wrapper.paginationData(industries.data, meta);
  }
}

module.exports = Industry;
