const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Categories-Query-Domain";

class Categories {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneCategory(payload) {
    const { id } = payload;
    const category = await this.query.findOne(
      { id },
      { id: 1, name: 1, created_at: 1 }
    );
    if (category.err) {
      logger.error(ctx, "getCategory", "Can not find Category", category.err);
      return wrapper.error(new NotFoundError("Can not find Category"));
    }

    return wrapper.data(category.data);
  }

  async getAllCategories(payload) {
    const { page, limit, search } = payload;

    const categories = await this.query.findAllCategories(page, limit, search);
    const count = await this.query.countAllCategories(search);

    ////console.log(industries);

    if (categories.err) {
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

  async getAllCategoriesWithJobcount() {

    const categories = await this.query.findAllCategoriesWithJobcount();

    if (categories.err) {
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
