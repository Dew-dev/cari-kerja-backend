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

class NewsCommand {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async _uniqueNewsSlug(base, excludeId = null) {
    let candidate = slugify(base);
    let i = 0;
    while (await this.query.slugExists(candidate, excludeId)) {
      i += 1;
      candidate = `${slugify(base).slice(0, 180)}-${i}`;
    }
    return candidate;
  }

  async _uniqueCategorySlug(base, excludeId = null) {
    let candidate = slugify(base);
    let i = 0;
    while (await this.query.categorySlugExists(candidate, excludeId)) {
      i += 1;
      candidate = `${slugify(base).slice(0, 140)}-${i}`;
    }
    return candidate;
  }

  async createCategory(payload) {
    const name = String(payload.name || "").trim();
    if (!name) {
      return wrapper.error(new BadRequestError("name is required"));
    }
    const slug = await this._uniqueCategorySlug(payload.slug || name);
    const row = await this.command.insertCategory({
      id: uuidv4(),
      name,
      slug,
    });
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to create category"));
    }
    return wrapper.data(row);
  }

  async updateCategory(payload) {
    const existing = await this.query.findCategoryById(payload.id);
    if (!existing) {
      return wrapper.error(new NotFoundError("Category not found"));
    }
    const name =
      payload.name !== undefined ? String(payload.name).trim() : undefined;
    if (name !== undefined && !name) {
      return wrapper.error(new BadRequestError("name cannot be empty"));
    }
    let slug;
    if (payload.slug !== undefined || name !== undefined) {
      slug = await this._uniqueCategorySlug(
        payload.slug || name || existing.name,
        payload.id
      );
    }
    const row = await this.command.updateCategory({
      id: payload.id,
      name,
      slug,
    });
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to update category"));
    }
    return wrapper.data(row);
  }

  async deleteCategory(payload) {
    const row = await this.command.softDeleteCategory(payload.id);
    if (!row) {
      return wrapper.error(new NotFoundError("Category not found"));
    }
    return wrapper.data({ id: row.id, deleted: true });
  }

  async createNews(payload) {
    const title = String(payload.title || "").trim();
    const body = String(payload.body || "").trim();
    if (!title || !body) {
      return wrapper.error(new BadRequestError("title and body are required"));
    }

    if (payload.category_id) {
      const cat = await this.query.findCategoryById(payload.category_id);
      if (!cat) {
        return wrapper.error(new BadRequestError("category_id is invalid"));
      }
    }

    const slug = await this._uniqueNewsSlug(payload.slug || title);
    const row = await this.command.insertNews({
      id: uuidv4(),
      category_id: payload.category_id || null,
      title,
      slug,
      excerpt: payload.excerpt ?? null,
      body,
      cover_url: payload.cover_url || null,
      status: "draft",
      is_featured: Boolean(payload.is_featured),
      meta_title: payload.meta_title ?? null,
      meta_description: payload.meta_description ?? null,
      author_user_id: payload.author_user_id,
    });
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to create news"));
    }
    const full = await this.query.findNewsById(row.id);
    return wrapper.data(full || row);
  }

  async updateNews(payload) {
    const existing = await this.query.findNewsById(payload.id);
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }

    const fields = {};
    if (payload.title !== undefined) {
      const title = String(payload.title).trim();
      if (!title) return wrapper.error(new BadRequestError("title cannot be empty"));
      fields.title = title;
    }
    if (payload.body !== undefined) {
      const body = String(payload.body).trim();
      if (!body) return wrapper.error(new BadRequestError("body cannot be empty"));
      fields.body = body;
    }
    if (payload.excerpt !== undefined) fields.excerpt = payload.excerpt;
    if (payload.meta_title !== undefined) fields.meta_title = payload.meta_title;
    if (payload.meta_description !== undefined) {
      fields.meta_description = payload.meta_description;
    }
    if (payload.is_featured !== undefined) {
      fields.is_featured = Boolean(payload.is_featured);
    }
    if (payload.cover_url !== undefined) fields.cover_url = payload.cover_url;
    if (payload.category_id !== undefined) {
      if (payload.category_id === null || payload.category_id === "") {
        fields.category_id = null;
      } else {
        const cat = await this.query.findCategoryById(payload.category_id);
        if (!cat) {
          return wrapper.error(new BadRequestError("category_id is invalid"));
        }
        fields.category_id = payload.category_id;
      }
    }
    if (payload.slug !== undefined || fields.title) {
      fields.slug = await this._uniqueNewsSlug(
        payload.slug || fields.title || existing.title,
        payload.id
      );
    }

    const row = await this.command.updateNews(payload.id, fields);
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to update news"));
    }
    const full = await this.query.findNewsById(payload.id);
    return wrapper.data(full || row);
  }

  async uploadCover(payload) {
    const existing = await this.query.findNewsById(payload.id);
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
    const full = await this.query.findNewsById(payload.id);
    return wrapper.data(full || row);
  }

  async publishNews(payload) {
    const existing = await this.query.findNewsById(payload.id);
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    if (!existing.title || !existing.body) {
      return wrapper.error(
        new BadRequestError("title and body are required before publish")
      );
    }
    if (await this.query.slugExists(existing.slug, existing.id)) {
      return wrapper.error(new ConflictError("slug is already in use"));
    }
    const row = await this.command.publishNews(payload.id);
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to publish news"));
    }
    const full = await this.query.findNewsById(payload.id);
    return wrapper.data(full || row);
  }

  async archiveNews(payload) {
    const existing = await this.query.findNewsById(payload.id);
    if (!existing) {
      return wrapper.error(new NotFoundError("News not found"));
    }
    const row = await this.command.archiveNews(payload.id);
    if (!row) {
      return wrapper.error(new InternalServerError("Failed to archive news"));
    }
    const full = await this.query.findNewsById(payload.id);
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
