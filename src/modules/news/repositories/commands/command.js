class Command {
  constructor(db) {
    this.db = db;
  }

  async insertCategory({ id, name, slug }) {
    const result = await this.db.executeQuery(
      `INSERT INTO news_categories (id, name, slug)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, created_at, updated_at`,
      [id, name, slug]
    );
    return result?.rows?.[0] || null;
  }

  async updateCategory({ id, name, slug }) {
    const result = await this.db.executeQuery(
      `UPDATE news_categories
       SET name = COALESCE($2, name),
           slug = COALESCE($3, slug),
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, slug, created_at, updated_at`,
      [id, name, slug]
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

  async insertNews(row) {
    const result = await this.db.executeQuery(
      `INSERT INTO news (
         id, category_id, title, slug, excerpt, body, cover_url,
         status, is_featured, meta_title, meta_description, author_user_id
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12
       )
       RETURNING *`,
      [
        row.id,
        row.category_id || null,
        row.title,
        row.slug,
        row.excerpt || null,
        row.body,
        row.cover_url || null,
        row.status || "draft",
        Boolean(row.is_featured),
        row.meta_title || null,
        row.meta_description || null,
        row.author_user_id,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async updateNews(id, fields) {
    const allowed = [
      "category_id",
      "title",
      "slug",
      "excerpt",
      "body",
      "cover_url",
      "is_featured",
      "meta_title",
      "meta_description",
    ];
    const sets = [];
    const params = [id];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined) {
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
