const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Categories-Command-Domain";

class Category {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addCategory(payload) {
    const newPayload = {
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed insert Category"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateCategory(payload) {
    const { id } = payload;

    const category = await this.query.findOne({ id }, { id: 1 });
    if (category.err) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const result = await this.command.updateOneNew({ id }, { name: payload.name });
    if (result.err) {
      return wrapper.error(new InternalServerError("Update Category failed"));
    }

    return wrapper.data({ id });
  }

  async deleteCategory(payload) {
    const { id } = payload;

    const category = await this.query.findOne({ id }, { id: 1 });
    if (category.err) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete Category failed"));
    }

    return wrapper.data("Success deleted category");
  }
}

module.exports = Category;
