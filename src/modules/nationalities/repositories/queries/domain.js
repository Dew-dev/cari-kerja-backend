const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Nationalities-Query-Domain";

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

    ////console.log(nationalities);

    if (nationalities.err) {
      logger.error(
        ctx,
        "getAllNationalities",
        "Can not find nationalities",
        nationalities.err
      );
      return wrapper.error(new NotFoundError("Can not find nationalities"));
    }

    const totalData = count.data;
    const totalPages = Math.ceil(totalData / limit);
    const meta = {
      page: page,
      per_page: limit,
      total_data: Math.max(totalData, 0),
      total_pages: totalPages,
    };

    return wrapper.paginationData(nationalities.data, meta);
  }
}

module.exports = Nationality;
