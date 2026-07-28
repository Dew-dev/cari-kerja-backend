const {
  resolveLocale,
  DEFAULT_LOCALE,
} = require("../../../../helpers/i18n/locale");

class Query {
  constructor(db) {
    this.db = db;
  }

  async findById(id, locale = DEFAULT_LOCALE) {
    const loc = resolveLocale(locale);
    const result = await this.db.executeQuery(
      `SELECT
         jt.id,
         jt.name,
         jt.slug,
         jt.category_id,
         jt.is_active,
         jt.created_at,
         jt.updated_at,
         COALESCE(t.name, tf.name) AS category_name,
         $2::text AS locale,
         CASE
           WHEN t.id IS NOT NULL THEN t.locale
           WHEN tf.id IS NOT NULL THEN tf.locale
           ELSE NULL
         END AS locale_resolved
       FROM job_titles jt
       LEFT JOIN category_translations t
         ON t.category_id = jt.category_id AND t.locale = $2
       LEFT JOIN category_translations tf
         ON tf.category_id = jt.category_id AND tf.locale = $3
       WHERE jt.id = $1 AND jt.deleted_at IS NULL
       LIMIT 1`,
      [id, loc, DEFAULT_LOCALE]
    );
    return result?.rows?.[0] || null;
  }

  async findAll({ page = 1, limit = 20, search = "", category_id = null, locale = DEFAULT_LOCALE }) {
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    const searchQuery = search ? `%${search}%` : "%";
    const loc = resolveLocale(locale);
    const values = [searchQuery, loc, DEFAULT_LOCALE];
    let idx = 4;
    let categoryFilter = "";
    if (category_id !== undefined && category_id !== null && category_id !== "") {
      categoryFilter = ` AND jt.category_id = $${idx}`;
      values.push(Number(category_id));
      idx += 1;
    }
    values.push(Number(limit), offset);

    const result = await this.db.executeQuery(
      `SELECT
         jt.id,
         jt.name,
         jt.slug,
         jt.category_id,
         COALESCE(t.name, tf.name) AS category_name,
         $2::text AS locale,
         CASE
           WHEN t.id IS NOT NULL THEN t.locale
           WHEN tf.id IS NOT NULL THEN tf.locale
           ELSE NULL
         END AS locale_resolved
       FROM job_titles jt
       LEFT JOIN category_translations t
         ON t.category_id = jt.category_id AND t.locale = $2
       LEFT JOIN category_translations tf
         ON tf.category_id = jt.category_id AND tf.locale = $3
       WHERE jt.deleted_at IS NULL
         AND jt.is_active IS TRUE
         AND (jt.name ILIKE $1 OR jt.slug ILIKE $1)
         ${categoryFilter}
       ORDER BY jt.name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );
    return result?.rows || [];
  }

  async countAll(search = "", category_id = null) {
    const searchQuery = search ? `%${search}%` : "%";
    const values = [searchQuery];
    let categoryFilter = "";
    if (category_id !== undefined && category_id !== null && category_id !== "") {
      categoryFilter = " AND category_id = $2";
      values.push(Number(category_id));
    }
    const result = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total
       FROM job_titles
       WHERE deleted_at IS NULL
         AND is_active IS TRUE
         AND (name ILIKE $1 OR slug ILIKE $1)
         ${categoryFilter}`,
      values
    );
    return result?.rows?.[0]?.total || 0;
  }
}

module.exports = Query;
