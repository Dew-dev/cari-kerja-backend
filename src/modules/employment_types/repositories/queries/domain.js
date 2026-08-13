const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "EmploymentTypes-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

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

    const totalData = this.#extractTotal(count);
    if (totalData === null) {
      logger.error(ctx, "getAllEmploymentTypes", "Can not count EmploymentTypes", count.err || "empty count rows");
      return wrapper.error(new InternalServerError("Can not count EmploymentTypes"));
    }

    if (employmentTypes.err) {
      if (employmentTypes.err === EMPTY_RESULT_MESSAGE) {
        const meta = wrapper.buildPaginationMeta(page, limit, totalData);
        return wrapper.paginationData([], meta);
      }

      logger.error(ctx, "getAllEmploymentTypes", "Can not find EmploymentTypes", employmentTypes.err);
      return wrapper.error(new NotFoundError("Can not find EmploymentTypes"));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, totalData);
    return wrapper.paginationData(employmentTypes.data, meta);
  }

  #extractTotal(count) {
    if (count.err || !count.data?.rows?.length) {
      return null;
    }
    return count.data.rows[0].total;
  }
}

module.exports = EmploymentTypes;
