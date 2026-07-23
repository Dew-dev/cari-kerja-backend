class Query {
  constructor(db) {
    this.db = db;
  }

  async findCategoryById(id) {
    const result = await this.db.executeQuery(
      `SELECT id, name, slug, created_at, updated_at
       FROM news_categories
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async findCategoryBySlug(slug, excludeId = null) {
    const params = [slug];
    let sql = `
      SELECT id, name, slug
      FROM news_categories
      WHERE slug = $1 AND deleted_at IS NULL`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $2`;
    }
    sql += ` LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return result?.rows?.[0] || null;
  }

  async listCategories() {
    const result = await this.db.executeQuery(
      `SELECT id, name, slug, created_at, updated_at
       FROM news_categories
       WHERE deleted_at IS NULL
       ORDER BY name ASC`
    );
    return result?.rows || [];
  }

  async findNewsById(id) {
    const result = await this.db.executeQuery(
      `SELECT n.*,
              c.name AS category_name,
              c.slug AS category_slug,
              u.username AS author_username,
              u.email AS author_email
       FROM news n
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE n.id = $1 AND n.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async findNewsBySlug(slug, { publishedOnly = false } = {}) {
    const params = [slug];
    let sql = `
      SELECT n.*,
             c.name AS category_name,
             c.slug AS category_slug,
             u.username AS author_username,
             u.email AS author_email
      FROM news n
      LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
      LEFT JOIN users u ON u.id = n.author_user_id
      WHERE n.slug = $1 AND n.deleted_at IS NULL`;
    if (publishedOnly) {
      sql += ` AND n.status = 'published'`;
    }
    sql += ` LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return result?.rows?.[0] || null;
  }

  async slugExists(slug, excludeId = null) {
    const params = [slug];
    let sql = `SELECT id FROM news WHERE slug = $1 AND deleted_at IS NULL`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $2`;
    }
    sql += ` LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return Boolean(result?.rows?.length);
  }

  async categorySlugExists(slug, excludeId = null) {
    const row = await this.findCategoryBySlug(slug, excludeId);
    return Boolean(row);
  }

  async listPublicNews({ page, limit, search, category_slug, featured }) {
    const offset = (page - 1) * limit;
    const params = [];
    const where = [`n.deleted_at IS NULL`, `n.status = 'published'`];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(n.title ILIKE $${params.length} OR n.excerpt ILIKE $${params.length} OR n.body ILIKE $${params.length})`
      );
    }
    if (category_slug) {
      params.push(category_slug);
      where.push(`c.slug = $${params.length}`);
    }
    if (featured === true || featured === "true") {
      where.push(`n.is_featured IS TRUE`);
    }

    const whereSql = where.join(" AND ");
    const countResult = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total
       FROM news n
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       WHERE ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const listResult = await this.db.executeQuery(
      `SELECT n.id, n.title, n.slug, n.excerpt, n.cover_url, n.status,
              n.is_featured, n.meta_title, n.meta_description,
              n.published_at, n.created_at, n.updated_at,
              n.category_id, c.name AS category_name, c.slug AS category_slug,
              n.author_user_id, u.username AS author_username
       FROM news n
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE ${whereSql}
       ORDER BY n.published_at DESC NULLS LAST, n.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: listResult?.rows || [],
      total: countResult?.rows?.[0]?.total || 0,
    };
  }

  async listAdminNews({ page, limit, search, status }) {
    const offset = (page - 1) * limit;
    const params = [];
    const where = [`n.deleted_at IS NULL`];

    if (status) {
      params.push(status);
      where.push(`n.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(n.title ILIKE $${params.length} OR n.excerpt ILIKE $${params.length} OR n.slug ILIKE $${params.length})`
      );
    }

    const whereSql = where.join(" AND ");
    const countResult = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total
       FROM news n
       WHERE ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const listResult = await this.db.executeQuery(
      `SELECT n.id, n.title, n.slug, n.excerpt, n.cover_url, n.status,
              n.is_featured, n.meta_title, n.meta_description,
              n.published_at, n.created_at, n.updated_at,
              n.category_id, c.name AS category_name, c.slug AS category_slug,
              n.author_user_id, u.username AS author_username
       FROM news n
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE ${whereSql}
       ORDER BY n.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: listResult?.rows || [],
      total: countResult?.rows?.[0]?.total || 0,
    };
  }
}

module.exports = Query;
