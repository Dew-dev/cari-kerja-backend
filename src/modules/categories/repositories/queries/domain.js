const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const {
  DEFAULT_LOCALE,
  resolveLocale,
} = require("../../../../helpers/i18n/locale");
const ctx = "Categories-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Categories {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneCategory(payload) {
    const { id } = payload;
    const locale = resolveLocale(payload.locale);
    const includeTranslations =
      payload.include_translations === true ||
      payload.include_translations === "true" ||
      payload.include_translations === "1";

    const category = await this.query.findOneResolved(id, locale);
    if (!category) {
      logger.error(ctx, "getCategory", "Can not find Category", id);
      return wrapper.error(new NotFoundError("Can not find Category"));
    }

    const data = { ...category };
    if (includeTranslations) {
      const rows = await this.query.listTranslations(id);
      data.translations = Object.fromEntries(
        rows.map((r) => [r.locale, { name: r.name }])
      );
    }

    return wrapper.data(data);
  }

  async getAllCategories(payload) {
    const { page, limit, search } = payload;
    const locale = resolveLocale(payload.locale);

    const categories = await this.query.findAllCategories(
      page,
      limit,
      search,
      locale
    );
    const count = await this.query.countAllCategories(search, locale);

    if (categories.err) {
      if (categories.err === EMPTY_RESULT_MESSAGE) {
        if (count.err) {
          logger.error(ctx, "getAllCategories", "Can not count Categories", count.err);
          return wrapper.error(new InternalServerError("Can not count categories"));
        }
        const meta = wrapper.buildPaginationMeta(page, limit, count.data);
        return wrapper.paginationData([], meta);
      }

      logger.error(
        ctx,
        "getAllCategories",
        "Can not find Categories",
        categories.err
      );
      return wrapper.error(new NotFoundError("Can not find categories"));
    }

    if (count.err) {
      logger.error(ctx, "getAllCategories", "Can not count Categories", count.err);
      return wrapper.error(new InternalServerError("Can not count categories"));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, count.data);

    return wrapper.paginationData(categories.data, meta);
  }

  async getAllCategoriesWithJobcount(payload = {}) {
    const locale = resolveLocale(payload.locale || DEFAULT_LOCALE);
    const categories = await this.query.findAllCategoriesWithJobcount(locale);

    if (categories.err) {
      if (categories.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.data([]);
      }

      logger.error(
        ctx,
        "getAllCategories",
        "Can not find Categories",
        categories.err
      );
      return wrapper.error(new NotFoundError("Can not find categories"));
    }

    return wrapper.data(categories.data);
  }
}

module.exports = Categories;
