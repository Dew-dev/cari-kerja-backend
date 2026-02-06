const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "EmploymentTypes-Query-Domain";

class EmploymentTypes {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneEmploymentType(payload) {
    const { id } = payload;
    const employmentType = await this.query.findOne({ id }, { id: 1, name: 1});
    if (employmentType.err) {
      logger.error(ctx, "getOneEmploymentType", "Can not find EmploymentType", employmentType.err);
      return wrapper.error(new NotFoundError("Can not find EmploymentType"));
    }

    return wrapper.data(employmentType.data);
  }

  async getAllEmploymentTypes(payload) {
    const { page, limit, search } = payload;

    const employmentTypes = await this.query.findAllEmploymentTypes(page, limit, search);
    const count = await this.query.countAllEmploymentTypes(search);

    //console.log(employmentTypes);

    if (employmentTypes.err) {
      logger.error(ctx, "getAllEmploymentTypes", "Can not find EmploymentTypes", employmentTypes.err);
      return wrapper.error(new NotFoundError("Can not find EmploymentTypes"));
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

    return wrapper.paginationData(employmentTypes.data, meta);
  }
}

module.exports = EmploymentTypes;
