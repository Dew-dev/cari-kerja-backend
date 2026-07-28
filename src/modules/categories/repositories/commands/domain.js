const Query = require("../queries/query");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  InternalServerError,
  ConflictError,
  BadRequestError,
} = require("../../../../helpers/errors");
const {
  DEFAULT_LOCALE,
  normalizeNameTranslationsPayload,
} = require("../../../../helpers/i18n/locale");
const ctx = "Categories-Command-Domain";

class Category {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addCategory(payload) {
    const normalized = normalizeNameTranslationsPayload(payload);
    if (!normalized.ok) {
      return wrapper.error(new BadRequestError(normalized.error));
    }

    const defaultName =
      normalized.translations[DEFAULT_LOCALE]?.name ||
      Object.values(normalized.translations)[0]?.name;

    const result = await this.command.insertOne({ name: defaultName });
    if (result.err) {
      const message = result.err.message || "";
      const isDuplicate =
        result.err.code === "23505" ||
        /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(new ConflictError("Category name already exists"));
      }
      logger.error(ctx, "addCategory", "Failed insert Category", result.err);
      return wrapper.error(new InternalServerError("Failed insert Category"));
    }

    const categoryId = result.data.id;
    try {
      for (const [locale, fields] of Object.entries(normalized.translations)) {
        await this.command.upsertTranslation({
          category_id: categoryId,
          locale,
          name: fields.name,
        });
      }
    } catch (err) {
      const message = err.message || "";
      const isDuplicate =
        err.code === "23505" || /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(new ConflictError("Category name already exists"));
      }
      logger.error(ctx, "addCategory", "Failed insert translations", err);
      return wrapper.error(new InternalServerError("Failed insert Category"));
    }

    const translations = await this.query.listTranslations(categoryId);
    return wrapper.data({
      id: categoryId,
      name: defaultName,
      translations: Object.fromEntries(
        translations.map((t) => [t.locale, { name: t.name }])
      ),
    });
  }

  async updateCategory(payload) {
    const { id } = payload;

    const category = await this.query.findOne({ id }, { id: 1, name: 1 });
    if (category.err) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const normalized = normalizeNameTranslationsPayload(payload);
    if (!normalized.ok) {
      return wrapper.error(new BadRequestError(normalized.error));
    }

    try {
      for (const [locale, fields] of Object.entries(normalized.translations)) {
        await this.command.upsertTranslation({
          category_id: id,
          locale,
          name: fields.name,
        });
      }
    } catch (err) {
      const message = err.message || "";
      const isDuplicate =
        err.code === "23505" || /duplicate key|unique constraint/i.test(message);
      if (isDuplicate) {
        return wrapper.error(new ConflictError("Category name already exists"));
      }
      return wrapper.error(new InternalServerError("Update Category failed"));
    }

    const defaultName =
      normalized.translations[DEFAULT_LOCALE]?.name || category.data.name;

    if (normalized.translations[DEFAULT_LOCALE]?.name) {
      const result = await this.command.updateOneNew(
        { id },
        { name: normalized.translations[DEFAULT_LOCALE].name }
      );
      if (result.err) {
        const message = result.err.message || "";
        const isDuplicate =
          result.err.code === "23505" ||
          /duplicate key|unique constraint/i.test(message);
        if (isDuplicate) {
          return wrapper.error(new ConflictError("Category name already exists"));
        }
        return wrapper.error(new InternalServerError("Update Category failed"));
      }
    }

    const translations = await this.query.listTranslations(id);
    return wrapper.data({
      id,
      name: defaultName,
      translations: Object.fromEntries(
        translations.map((t) => [t.locale, { name: t.name }])
      ),
    });
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
