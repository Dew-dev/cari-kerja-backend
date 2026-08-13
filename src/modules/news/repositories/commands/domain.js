const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
  InternalServerError,
} = require("../../../../helpers/errors");
const { slugify } = require("../../helpers/slugify");
const {
  DEFAULT_LOCALE,
  normalizeTranslationsPayload,
  normalizeCategoryTranslationsPayload,
} = require("../../helpers/locale");

class NewsCommand {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async _uniqueNewsSlug(base, locale, excludeId = null) {
    let candidate = slugify(base);
    let i = 0;
    while (await this.query.slugExists(candidate, locale, excludeId)) {
      i += 1;
      candidate = `${slugify(base).slice(0, 180)}-${i}`;
    }
    return candidate;
  }

  async _uniqueCategorySlug(base, locale, excludeId = null) {
    let candidate = slugify(base);
    let i = 0;
    while (await this.query.categorySlugExists(candidate, locale, excludeId)) {
      i += 1;
      candidate = `${slugify(base).slice(0, 140)}-${i}`;
    }
    return candidate;
  }

  async createCategory(payload) {
    const normalized = normalizeCategoryTranslationsPayload(payload);
    if (!normalized.ok) {
      return wrapper.error(new BadRequestError(normalized.error));
    }
    if (!normalized.translations[DEFAULT_LOCALE]) {
      return wrapper.error(
        new BadRequestError(`translations.${DEFAULT_LOCALE} is required`)
      );
    }

    const id = uuidv4();
    const row = await this.command.insertCategory({ id });
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to create category"));
    }

    for (const [locale, fields] of Object.entries(normalized.translations)) {
      const name = String(fields.name || "").trim();
      if (!name) {
        return wrapper.error(
          new BadRequestError(`translations.${locale}.name is required`)
        );
      }
      const slug = await this._uniqueCategorySlug(fields.slug || name, locale);
      await this.command.upsertCategoryTranslation({
        category_id: id,
        locale,
        name,
        slug,
      });
    }

    const full = await this.query.findCategoryById(id, DEFAULT_LOCALE);
    const translations = await this.query.listCategoryTranslations(id);
    return wrapper.data({
      ...full,
      translations: Object.fromEntries(
        translations.map((t) => [t.locale, { name: t.name, slug: t.slug }])
      ),
    });
  }

  async updateCategory(payload) {
    const existing = await this.query.findCategoryById(payload.id, DEFAULT_LOCALE);
    if (!existing) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const normalized = normalizeCategoryTranslationsPayload(payload);
    if (!normalized.ok) {
      // allow partial flat update via name only for id locale
      if (payload.name === undefined && !payload.translations) {
        return wrapper.error(new BadRequestError(normalized.error));
      }
    }

    const translations =
      normalized.ok
        ? normalized.translations
        : {
            [DEFAULT_LOCALE]: { name: payload.name, slug: payload.slug },
          };

    for (const [locale, fields] of Object.entries(translations)) {
      const currentList = await this.query.listCategoryTranslations(payload.id);
      const current = currentList.find((t) => t.locale === locale);
      const name =
        fields.name !== undefined
          ? String(fields.name).trim()
          : current?.name;
      if (!name) {
        return wrapper.error(
          new BadRequestError(`translations.${locale}.name is required`)
        );
      }
      const slug = await this._uniqueCategorySlug(
        fields.slug || name,
        locale,
        payload.id
      );
      await this.command.upsertCategoryTranslation({
        category_id: payload.id,
        locale,
        name,
        slug,
      });
    }

    await this.command.touchCategory(payload.id);
    const full = await this.query.findCategoryById(payload.id, DEFAULT_LOCALE);
    const all = await this.query.listCategoryTranslations(payload.id);
    return wrapper.data({
      ...full,
      translations: Object.fromEntries(
        all.map((t) => [t.locale, { name: t.name, slug: t.slug }])
      ),
    });
  }

  async deleteCategory(payload) {
    const row = await this.command.softDeleteCategory(payload.id);
    if (!row) {
      return wrapper.error(new NotFoundError("Category not found"));
    }
    return wrapper.data({ id: row.id, deleted: true });
  }

  async createNews(payload) {
    const normalized = normalizeTranslationsPayload(payload);
    if (!normalized.ok) {
      return wrapper.error(new BadRequestError(normalized.error));
    }
    if (!normalized.translations[DEFAULT_LOCALE]) {
      return wrapper.error(
        new BadRequestError(`translations.${DEFAULT_LOCALE} is required`)
      );
    }

    const idFields = normalized.translations[DEFAULT_LOCALE];
    const title = String(idFields.title || "").trim();
    const body = String(idFields.body || "").trim();
    if (!title || !body) {
      return wrapper.error(
        new BadRequestError("translations.id title and body are required")
      );
    }

    if (payload.category_id) {
      const cat = await this.query.findCategoryById(payload.category_id);
      if (!cat) {
        return wrapper.error(new BadRequestError("category_id is invalid"));
      }
    }

    const id = uuidv4();
    const row = await this.command.insertNews({
      id,
      category_id: payload.category_id || null,
      cover_url: payload.cover_url || null,
      status: "draft",
      is_featured: Boolean(payload.is_featured),
      author_user_id: payload.author_user_id,
    });
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to create news"));
    }

    for (const [locale, fields] of Object.entries(normalized.translations)) {
      const locTitle = String(fields.title || "").trim();
      const locBody = String(fields.body || "").trim();
      if (!locTitle || !locBody) {
        return wrapper.error(
          new BadRequestError(
            `translations.${locale} title and body are required`
          )
        );
      }
      const slug = await this._uniqueNewsSlug(fields.slug || locTitle, locale);
      await this.command.upsertNewsTranslation({
        news_id: id,
        locale,
        title: locTitle,
        slug,
        excerpt: fields.excerpt ?? null,
        body: locBody,
        meta_title: fields.meta_title ?? null,
        meta_description: fields.meta_description ?? null,
      });
    }

    const full = await this.query.findNewsById(id, {
      locale: DEFAULT_LOCALE,
      withAllTranslations: true,
    });
    return wrapper.data(full || row);
  }

  async updateNews(payload) {
    const existing = await this.query.findNewsById(payload.id, {
      locale: DEFAULT_LOCALE,
      withAllTranslations: true,
    });
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }

    const sharedFields = {};
    if (payload.is_featured !== undefined) {
      sharedFields.is_featured = Boolean(payload.is_featured);
    }
    if (payload.cover_url !== undefined) sharedFields.cover_url = payload.cover_url;
    if (payload.category_id !== undefined) {
      if (payload.category_id === null || payload.category_id === "") {
        sharedFields.category_id = null;
      } else {
        const cat = await this.query.findCategoryById(payload.category_id);
        if (!cat) {
          return wrapper.error(new BadRequestError("category_id is invalid"));
        }
        sharedFields.category_id = payload.category_id;
      }
    }
    if (Object.keys(sharedFields).length) {
      await this.command.updateNews(payload.id, sharedFields);
    }

    let translationsMap = null;
    if (payload.translations) {
      const normalized = normalizeTranslationsPayload(payload);
      if (!normalized.ok) {
        return wrapper.error(new BadRequestError(normalized.error));
      }
      translationsMap = normalized.translations;
    } else if (
      payload.title !== undefined ||
      payload.body !== undefined ||
      payload.slug !== undefined ||
      payload.excerpt !== undefined ||
      payload.meta_title !== undefined ||
      payload.meta_description !== undefined
    ) {
      const current = existing.translations?.[DEFAULT_LOCALE] || {};
      translationsMap = {
        [DEFAULT_LOCALE]: {
          title: payload.title !== undefined ? payload.title : current.title,
          body: payload.body !== undefined ? payload.body : current.body,
          slug: payload.slug !== undefined ? payload.slug : current.slug,
          excerpt:
            payload.excerpt !== undefined ? payload.excerpt : current.excerpt,
          meta_title:
            payload.meta_title !== undefined
              ? payload.meta_title
              : current.meta_title,
          meta_description:
            payload.meta_description !== undefined
              ? payload.meta_description
              : current.meta_description,
        },
      };
    }

    if (translationsMap) {
      for (const [locale, fields] of Object.entries(translationsMap)) {
        const current = existing.translations?.[locale] || {};
        const title = String(
          fields.title !== undefined ? fields.title : current.title || ""
        ).trim();
        const body = String(
          fields.body !== undefined ? fields.body : current.body || ""
        ).trim();
        if (!title || !body) {
          return wrapper.error(
            new BadRequestError(
              `translations.${locale} title and body are required`
            )
          );
        }
        const slug = await this._uniqueNewsSlug(
          fields.slug || title,
          locale,
          payload.id
        );
        await this.command.upsertNewsTranslation({
          news_id: payload.id,
          locale,
          title,
          slug,
          excerpt:
            fields.excerpt !== undefined ? fields.excerpt : current.excerpt,
          body,
          meta_title:
            fields.meta_title !== undefined
              ? fields.meta_title
              : current.meta_title,
          meta_description:
            fields.meta_description !== undefined
              ? fields.meta_description
              : current.meta_description,
        });
      }
    }

    const full = await this.query.findNewsById(payload.id, {
      locale: DEFAULT_LOCALE,
      withAllTranslations: true,
    });
    return wrapper.data(full);
  }

  async uploadCover(payload) {
    const existing = await this.query.findNewsById(payload.id, {
      withAllTranslations: true,
    });
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    if (!payload.cover_url) {
      return wrapper.error(new BadRequestError("cover file is required"));
    }
    const row = await this.command.setCoverUrl(payload.id, payload.cover_url);
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to update cover"));
    }
    const full = await this.query.findNewsById(payload.id, {
      withAllTranslations: true,
    });
    return wrapper.data(full || row);
  }

  async publishNews(payload) {
    const existing = await this.query.findNewsById(payload.id, {
      locale: DEFAULT_LOCALE,
      withAllTranslations: true,
    });
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    const idTr = existing.translations?.[DEFAULT_LOCALE];
    if (!idTr?.title || !idTr?.body) {
      return wrapper.error(
        new BadRequestError("translations.id title and body are required before publish")
      );
    }
    if (await this.query.slugExists(idTr.slug, DEFAULT_LOCALE, existing.id)) {
      return wrapper.error(new ConflictError("slug is already in use"));
    }
    const row = await this.command.publishNews(payload.id);
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to publish news"));
    }
    const full = await this.query.findNewsById(payload.id, {
      withAllTranslations: true,
    });
    return wrapper.data(full || row);
  }

  async archiveNews(payload) {
    const existing = await this.query.findNewsById(payload.id, {
      withAllTranslations: true,
    });
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    const row = await this.command.archiveNews(payload.id);
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to archive news"));
    }
    const full = await this.query.findNewsById(payload.id, {
      withAllTranslations: true,
    });
    return wrapper.data(full || row);
  }

  async deleteNews(payload) {
    const row = await this.command.softDeleteNews(payload.id);
    if (!row) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    return wrapper.data({ id: row.id, deleted: true });
  }
}

module.exports = NewsCommand;
