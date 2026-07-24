const { DEFAULT_LOCALE, resolveLocale } = require("../../helpers/locale");

class Query {
  constructor(db) {
    this.db = db;
  }

  _resolvedNewsSelect(aliasT = "t", aliasTf = "tf") {
    return `
      COALESCE(${aliasT}.title, ${aliasTf}.title) AS title,
      COALESCE(${aliasT}.slug, ${aliasTf}.slug) AS slug,
      COALESCE(${aliasT}.excerpt, ${aliasTf}.excerpt) AS excerpt,
      COALESCE(${aliasT}.body, ${aliasTf}.body) AS body,
      COALESCE(${aliasT}.meta_title, ${aliasTf}.meta_title) AS meta_title,
      COALESCE(${aliasT}.meta_description, ${aliasTf}.meta_description) AS meta_description,
      CASE WHEN ${aliasT}.id IS NOT NULL THEN ${aliasT}.locale ELSE ${aliasTf}.locale END AS locale_resolved
    `;
  }

  async findCategoryById(id, locale = DEFAULT_LOCALE) {
    const loc = resolveLocale(locale);
    const result = await this.db.executeQuery(
      `SELECT c.id, c.created_at, c.updated_at,
              COALESCE(t.name, tf.name) AS name,
              COALESCE(t.slug, tf.slug) AS slug,
              CASE WHEN t.id IS NOT NULL THEN t.locale ELSE tf.locale END AS locale_resolved
       FROM news_categories c
       LEFT JOIN news_category_translations t
         ON t.category_id = c.id AND t.locale = $2
       LEFT JOIN news_category_translations tf
         ON tf.category_id = c.id AND tf.locale = $3
       WHERE c.id = $1 AND c.deleted_at IS NULL
       LIMIT 1`,
      [id, loc, DEFAULT_LOCALE]
    );
    return result?.rows?.[0] || null;
  }

  async findCategoryBySlug(slug, locale = DEFAULT_LOCALE, excludeId = null) {
    const loc = resolveLocale(locale);
    const params = [slug, loc];
    let sql = `
      SELECT c.id,
             COALESCE(t.name, tf.name) AS name,
             COALESCE(t.slug, tf.slug) AS slug
      FROM news_categories c
      INNER JOIN news_category_translations t
        ON t.category_id = c.id AND t.locale = $2 AND t.slug = $1
      LEFT JOIN news_category_translations tf
        ON tf.category_id = c.id AND tf.locale = '${DEFAULT_LOCALE}'
      WHERE c.deleted_at IS NULL`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND c.id <> $${params.length}`;
    }
    sql += ` LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return result?.rows?.[0] || null;
  }

  async listCategories(locale = DEFAULT_LOCALE) {
    const loc = resolveLocale(locale);
    const result = await this.db.executeQuery(
      `SELECT c.id, c.created_at, c.updated_at,
              COALESCE(t.name, tf.name) AS name,
              COALESCE(t.slug, tf.slug) AS slug,
              $1::text AS locale,
              CASE WHEN t.id IS NOT NULL THEN t.locale ELSE tf.locale END AS locale_resolved
       FROM news_categories c
       LEFT JOIN news_category_translations t
         ON t.category_id = c.id AND t.locale = $1
       LEFT JOIN news_category_translations tf
         ON tf.category_id = c.id AND tf.locale = $2
       WHERE c.deleted_at IS NULL
         AND COALESCE(t.id, tf.id) IS NOT NULL
       ORDER BY COALESCE(t.name, tf.name) ASC`,
      [loc, DEFAULT_LOCALE]
    );
    return result?.rows || [];
  }

  async listCategoryTranslations(categoryId) {
    const result = await this.db.executeQuery(
      `SELECT locale, name, slug
       FROM news_category_translations
       WHERE category_id = $1
       ORDER BY locale ASC`,
      [categoryId]
    );
    return result?.rows || [];
  }

  async findNewsById(id, { locale = DEFAULT_LOCALE, withAllTranslations = false } = {}) {
    const loc = resolveLocale(locale);
    const result = await this.db.executeQuery(
      `SELECT n.id, n.category_id, n.cover_url, n.status, n.is_featured,
              n.author_user_id, n.published_at, n.created_at, n.updated_at,
              ${this._resolvedNewsSelect("t", "tf")},
              $2::text AS locale,
              COALESCE(ct.name, ctf.name) AS category_name,
              COALESCE(ct.slug, ctf.slug) AS category_slug,
              u.username AS author_username,
              u.email AS author_email
       FROM news n
       LEFT JOIN news_translations t
         ON t.news_id = n.id AND t.locale = $2
       LEFT JOIN news_translations tf
         ON tf.news_id = n.id AND tf.locale = $3
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       LEFT JOIN news_category_translations ct
         ON ct.category_id = c.id AND ct.locale = $2
       LEFT JOIN news_category_translations ctf
         ON ctf.category_id = c.id AND ctf.locale = $3
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE n.id = $1 AND n.deleted_at IS NULL
       LIMIT 1`,
      [id, loc, DEFAULT_LOCALE]
    );
    const row = result?.rows?.[0] || null;
    if (!row) return null;
    if (withAllTranslations) {
      row.translations = await this.mapNewsTranslations(id);
      if (row.category_id) {
        const catTranslations = await this.listCategoryTranslations(row.category_id);
        row.category_translations = Object.fromEntries(
          catTranslations.map((tr) => [tr.locale, { name: tr.name, slug: tr.slug }])
        );
      }
    }
    return row;
  }

  async mapNewsTranslations(newsId) {
    const rows = await this.listNewsTranslations(newsId);
    const map = {};
    for (const r of rows) {
      map[r.locale] = {
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        body: r.body,
        meta_title: r.meta_title,
        meta_description: r.meta_description,
      };
    }
    return map;
  }

  async listNewsTranslations(newsId) {
    const result = await this.db.executeQuery(
      `SELECT locale, title, slug, excerpt, body, meta_title, meta_description
       FROM news_translations
       WHERE news_id = $1
       ORDER BY locale ASC`,
      [newsId]
    );
    return result?.rows || [];
  }

  async findNewsBySlug(slug, { publishedOnly = false, locale = DEFAULT_LOCALE } = {}) {
    const loc = resolveLocale(locale);
    const params = [slug, loc, DEFAULT_LOCALE];
    let sql = `
      SELECT n.id, n.category_id, n.cover_url, n.status, n.is_featured,
             n.author_user_id, n.published_at, n.created_at, n.updated_at,
             ${this._resolvedNewsSelect("t", "tf")},
             $2::text AS locale,
             COALESCE(ct.name, ctf.name) AS category_name,
             COALESCE(ct.slug, ctf.slug) AS category_slug,
             u.username AS author_username,
             u.email AS author_email
      FROM news n
      INNER JOIN news_translations tmatch
        ON tmatch.news_id = n.id AND tmatch.slug = $1
        AND tmatch.locale IN ($2, $3)
      LEFT JOIN news_translations t
        ON t.news_id = n.id AND t.locale = $2
      LEFT JOIN news_translations tf
        ON tf.news_id = n.id AND tf.locale = $3
      LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
      LEFT JOIN news_category_translations ct
        ON ct.category_id = c.id AND ct.locale = $2
      LEFT JOIN news_category_translations ctf
        ON ctf.category_id = c.id AND ctf.locale = $3
      LEFT JOIN users u ON u.id = n.author_user_id
      WHERE n.deleted_at IS NULL`;
    if (publishedOnly) {
      sql += ` AND n.status = 'published'`;
    }
    sql += ` ORDER BY CASE WHEN tmatch.locale = $2 THEN 0 ELSE 1 END LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return result?.rows?.[0] || null;
  }

  async slugExists(slug, locale = DEFAULT_LOCALE, excludeNewsId = null) {
    const loc = resolveLocale(locale);
    const params = [slug, loc];
    let sql = `
      SELECT nt.news_id
      FROM news_translations nt
      INNER JOIN news n ON n.id = nt.news_id AND n.deleted_at IS NULL
      WHERE nt.slug = $1 AND nt.locale = $2`;
    if (excludeNewsId) {
      params.push(excludeNewsId);
      sql += ` AND nt.news_id <> $${params.length}`;
    }
    sql += ` LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return Boolean(result?.rows?.length);
  }

  async categorySlugExists(slug, locale = DEFAULT_LOCALE, excludeCategoryId = null) {
    const loc = resolveLocale(locale);
    const params = [slug, loc];
    let sql = `
      SELECT ct.category_id
      FROM news_category_translations ct
      INNER JOIN news_categories c ON c.id = ct.category_id AND c.deleted_at IS NULL
      WHERE ct.slug = $1 AND ct.locale = $2`;
    if (excludeCategoryId) {
      params.push(excludeCategoryId);
      sql += ` AND ct.category_id <> $${params.length}`;
    }
    sql += ` LIMIT 1`;
    const result = await this.db.executeQuery(sql, params);
    return Boolean(result?.rows?.length);
  }

  async listPublicNews({ page, limit, search, category_slug, featured, locale }) {
    const loc = resolveLocale(locale);
    const offset = (page - 1) * limit;
    const params = [loc, DEFAULT_LOCALE];
    const where = [`n.deleted_at IS NULL`, `n.status = 'published'`, `COALESCE(t.id, tf.id) IS NOT NULL`];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(COALESCE(t.title, tf.title) ILIKE $${params.length}
          OR COALESCE(t.excerpt, tf.excerpt) ILIKE $${params.length}
          OR COALESCE(t.body, tf.body) ILIKE $${params.length})`
      );
    }
    if (category_slug) {
      params.push(category_slug);
      where.push(`COALESCE(ct.slug, ctf.slug) = $${params.length}`);
    }
    if (featured === true || featured === "true") {
      where.push(`n.is_featured IS TRUE`);
    }

    const whereSql = where.join(" AND ");
    const joinSql = `
       FROM news n
       LEFT JOIN news_translations t ON t.news_id = n.id AND t.locale = $1
       LEFT JOIN news_translations tf ON tf.news_id = n.id AND tf.locale = $2
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       LEFT JOIN news_category_translations ct ON ct.category_id = c.id AND ct.locale = $1
       LEFT JOIN news_category_translations ctf ON ctf.category_id = c.id AND ctf.locale = $2
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE ${whereSql}`;

    const countResult = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total ${joinSql}`,
      params
    );

    params.push(limit, offset);
    const listResult = await this.db.executeQuery(
      `SELECT n.id, n.cover_url, n.status, n.is_featured,
              n.published_at, n.created_at, n.updated_at,
              n.category_id, n.author_user_id,
              $1::text AS locale,
              ${this._resolvedNewsSelect("t", "tf")},
              COALESCE(ct.name, ctf.name) AS category_name,
              COALESCE(ct.slug, ctf.slug) AS category_slug,
              u.username AS author_username
       ${joinSql}
       ORDER BY n.published_at DESC NULLS LAST, n.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: listResult?.rows || [],
      total: countResult?.rows?.[0]?.total || 0,
    };
  }

  async listAdminNews({ page, limit, search, status, locale }) {
    const loc = resolveLocale(locale);
    const offset = (page - 1) * limit;
    const params = [loc, DEFAULT_LOCALE];
    const where = [`n.deleted_at IS NULL`, `COALESCE(t.id, tf.id) IS NOT NULL`];

    if (status) {
      params.push(status);
      where.push(`n.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(COALESCE(t.title, tf.title) ILIKE $${params.length}
          OR COALESCE(t.excerpt, tf.excerpt) ILIKE $${params.length}
          OR COALESCE(t.slug, tf.slug) ILIKE $${params.length})`
      );
    }

    const whereSql = where.join(" AND ");
    const joinSql = `
       FROM news n
       LEFT JOIN news_translations t ON t.news_id = n.id AND t.locale = $1
       LEFT JOIN news_translations tf ON tf.news_id = n.id AND tf.locale = $2
       LEFT JOIN news_categories c ON c.id = n.category_id AND c.deleted_at IS NULL
       LEFT JOIN news_category_translations ct ON ct.category_id = c.id AND ct.locale = $1
       LEFT JOIN news_category_translations ctf ON ctf.category_id = c.id AND ctf.locale = $2
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE ${whereSql}`;

    const countResult = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total ${joinSql}`,
      params
    );

    params.push(limit, offset);
    const listResult = await this.db.executeQuery(
      `SELECT n.id, n.cover_url, n.status, n.is_featured,
              n.published_at, n.created_at, n.updated_at,
              n.category_id, n.author_user_id,
              $1::text AS locale,
              ${this._resolvedNewsSelect("t", "tf")},
              COALESCE(ct.name, ctf.name) AS category_name,
              COALESCE(ct.slug, ctf.slug) AS category_slug,
              u.username AS author_username
       ${joinSql}
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
