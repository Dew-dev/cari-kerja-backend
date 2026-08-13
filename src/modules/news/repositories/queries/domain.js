const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError } = require("../../../../helpers/errors");
const { buildPaginationMeta } = require("../../../../helpers/utils/wrapper");
const { DEFAULT_LOCALE, resolveLocale } = require("../../helpers/locale");

class NewsQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  async listPublic(payload) {
    const page = Number(payload.page) || 1;
    const limit = Number(payload.limit) || 10;
    const locale = resolveLocale(payload.locale);
    const result = await this.query.listPublicNews({
      page,
      limit,
      search: payload.search || null,
      category_slug: payload.category_slug || null,
      featured: payload.featured,
      locale,
    });
    return wrapper.paginationData(
      result.data,
      buildPaginationMeta(page, limit, result.total)
    );
  }

  async getPublicBySlug(payload) {
    const locale = resolveLocale(payload.locale);
    const row = await this.query.findNewsBySlug(payload.slug, {
      publishedOnly: true,
      locale,
    });
    if (!row) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    return wrapper.data(row);
  }

  async listCategories(payload = {}) {
    const locale = resolveLocale(payload.locale);
    const rows = await this.query.listCategories(locale);
    return wrapper.data(rows);
  }

  async listAdmin(payload) {
    const page = Number(payload.page) || 1;
    const limit = Number(payload.limit) || 10;
    const locale = resolveLocale(payload.locale || DEFAULT_LOCALE);
    const result = await this.query.listAdminNews({
      page,
      limit,
      search: payload.search || null,
      status: payload.status || null,
      locale,
    });
    return wrapper.paginationData(
      result.data,
      buildPaginationMeta(page, limit, result.total)
    );
  }

  async getAdminById(payload) {
    const row = await this.query.findNewsById(payload.id, {
      locale: DEFAULT_LOCALE,
      withAllTranslations: true,
    });
    if (!row) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    return wrapper.data(row);
  }
}

module.exports = NewsQuery;
