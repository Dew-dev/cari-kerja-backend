const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Nationalities-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Nationality {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneNationality(payload) {
    const { id } = payload;
    const nationality = await this.query.findOne(
      { id },
      { id: 1, country_name: 1, iso_alpha2: 1, iso_alpha3: 1 }
    );
    if (nationality.err) {
      logger.error(
        ctx,
        "getNationality",
        "Can not find nationality",
        nationality.err
      );
      return wrapper.error(new NotFoundError("Can not find Nationality"));
    }

    return wrapper.data(nationality.data);
  }

  async getAllNationalities(payload) {
    const { page, limit, search } = payload;

    const nationalities = await this.query.findAllNationalities(
      page,
      limit,
      search
    );
    const count = await this.query.countAllNationalities(search);

    if (nationalities.err) {
      if (nationalities.err === EMPTY_RESULT_MESSAGE) {
        const emptyMeta = wrapper.buildPaginationMeta(page, limit, count?.data ?? 0);
        return wrapper.paginationData([], emptyMeta);
      }
      logger.error(
        ctx,
        "getAllNationalities",
        "Can not find nationalities",
        nationalities.err
      );
      return wrapper.error(new NotFoundError("Can not find nationalities"));
    }

    if (count.err) {
      logger.error(ctx, "getAllNationalities", "Can not count nationalities", count.err);
      return wrapper.error(new InternalServerError("Can not count nationalities"));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, count.data);

    return wrapper.paginationData(nationalities.data, meta);
  }
}

module.exports = Nationality;
