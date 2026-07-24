class Command {
  constructor(db) {
    this.db = db;
  }

  async insertCategory({ id }) {
    const result = await this.db.executeQuery(
      `INSERT INTO news_categories (id)
       VALUES ($1)
       RETURNING id, created_at, updated_at`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async upsertCategoryTranslation({ category_id, locale, name, slug }) {
    const result = await this.db.executeQuery(
      `INSERT INTO news_category_translations (category_id, locale, name, slug)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (category_id, locale) DO UPDATE
         SET name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             updated_at = NOW()
       RETURNING category_id, locale, name, slug, created_at, updated_at`,
      [category_id, locale, name, slug]
    );
    return result?.rows?.[0] || null;
  }

  async softDeleteCategory(id) {
    const result = await this.db.executeQuery(
      `UPDATE news_categories
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async touchCategory(id) {
    await this.db.executeQuery(
      `UPDATE news_categories SET updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
  }

  async insertNews(row) {
    const result = await this.db.executeQuery(
      `INSERT INTO news (
         id, category_id, cover_url, status, is_featured, author_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        row.id,
        row.category_id || null,
        row.cover_url || null,
        row.status || "draft",
        Boolean(row.is_featured),
        row.author_user_id,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async upsertNewsTranslation({
    news_id,
    locale,
    title,
    slug,
    excerpt,
    body,
    meta_title,
    meta_description,
  }) {
    const result = await this.db.executeQuery(
      `INSERT INTO news_translations (
         news_id, locale, title, slug, excerpt, body, meta_title, meta_description
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (news_id, locale) DO UPDATE
         SET title = EXCLUDED.title,
             slug = EXCLUDED.slug,
             excerpt = EXCLUDED.excerpt,
             body = EXCLUDED.body,
             meta_title = EXCLUDED.meta_title,
             meta_description = EXCLUDED.meta_description,
             updated_at = NOW()
       RETURNING *`,
      [
        news_id,
        locale,
        title,
        slug,
        excerpt || null,
        body,
        meta_title || null,
        meta_description || null,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async updateNews(id, fields) {
    const allowed = ["category_id", "cover_url", "is_featured"];
    const sets = [];
    const params = [id];
    for (const key of allowed) {
      if (
        Object.prototype.hasOwnProperty.call(fields, key) &&
        fields[key] !== undefined
      ) {
        params.push(fields[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if (!sets.length) {
      return this.findNewsRow(id);
    }
    sets.push("updated_at = NOW()");
    const result = await this.db.executeQuery(
      `UPDATE news
       SET ${sets.join(", ")}
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      params
    );
    return result?.rows?.[0] || null;
  }

  async findNewsRow(id) {
    const result = await this.db.executeQuery(
      `SELECT * FROM news WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async setCoverUrl(id, coverUrl) {
    const result = await this.db.executeQuery(
      `UPDATE news
       SET cover_url = $2, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id, coverUrl]
    );
    return result?.rows?.[0] || null;
  }

  async publishNews(id) {
    const result = await this.db.executeQuery(
      `UPDATE news
       SET status = 'published',
           published_at = COALESCE(published_at, NOW()),
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async archiveNews(id) {
    const result = await this.db.executeQuery(
      `UPDATE news
       SET status = 'archived', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async softDeleteNews(id) {
    const result = await this.db.executeQuery(
      `UPDATE news
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    return result?.rows?.[0] || null;
  }
}

module.exports = Command;
