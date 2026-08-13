const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError } = require("../../../../helpers/errors");

class JobTitlesQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  async list(payload = {}) {
    const page = Number(payload.page) || 1;
    const limit = Number(payload.limit) || 20;
    const search = payload.search || "";
    const category_id = payload.category_id;
    const locale = payload.locale;
    const [rows, total] = await Promise.all([
      this.query.findAll({ page, limit, search, category_id, locale }),
      this.query.countAll(search, category_id),
    ]);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return wrapper.paginationData(rows, {
      page,
      per_page: limit,
      total_data: total,
      total_pages: totalPages,
    });
  }

  async getById(payload) {
    const row = await this.query.findById(payload.id, payload.locale);
    if (!row) return wrapper.error(new NotFoundError("Job title not found"));
    return wrapper.data(row);
  }
}

module.exports = JobTitlesQuery;
