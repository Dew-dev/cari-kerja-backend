const collection = "categories";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  DEFAULT_LOCALE,
  resolveLocale,
} = require("../../../../helpers/i18n/locale");
const ctx = "Categories-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findOneResolved(id, locale = DEFAULT_LOCALE) {
    const loc = resolveLocale(locale);
    const result = await this.db.executeQuery(
      `
      SELECT
        c.id,
        COALESCE(t.name, tf.name, c.name) AS name,
        c.created_at,
        $2::text AS locale,
        CASE
          WHEN t.id IS NOT NULL THEN t.locale
          WHEN tf.id IS NOT NULL THEN tf.locale
          ELSE '${DEFAULT_LOCALE}'
        END AS locale_resolved
      FROM categories c
      LEFT JOIN category_translations t
        ON t.category_id = c.id AND t.locale = $2
      LEFT JOIN category_translations tf
        ON tf.category_id = c.id AND tf.locale = $3
      WHERE c.id = $1
      LIMIT 1
      `,
      [id, loc, DEFAULT_LOCALE]
    );
    return result?.rows?.[0] || null;
  }

  async listTranslations(categoryId) {
    const result = await this.db.executeQuery(
      `
      SELECT locale, name
      FROM category_translations
      WHERE category_id = $1
      ORDER BY locale ASC
      `,
      [categoryId]
    );
    return result?.rows || [];
  }

  async findAllCategories(page = 1, limit = 10, search, locale = DEFAULT_LOCALE) {
    try {
      const offset = (page - 1) * limit;
      const searchQuery = search ? `%${search}%` : "%%";
      const loc = resolveLocale(locale);

      const query = `
      SELECT
        c.id,
        COALESCE(t.name, tf.name, c.name) AS name,
        c.created_at,
        $4::text AS locale,
        CASE
          WHEN t.id IS NOT NULL THEN t.locale
          WHEN tf.id IS NOT NULL THEN tf.locale
          ELSE '${DEFAULT_LOCALE}'
        END AS locale_resolved
      FROM ${collection} c
      LEFT JOIN category_translations t
        ON t.category_id = c.id AND t.locale = $4
      LEFT JOIN category_translations tf
        ON tf.category_id = c.id AND tf.locale = $5
      WHERE COALESCE(t.name, tf.name, c.name) ILIKE $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

      const values = [searchQuery, limit, offset, loc, DEFAULT_LOCALE];
      const result = await this.db.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllCategories", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAllCategoriesWithJobcount(locale = DEFAULT_LOCALE) {
    try {
      const loc = resolveLocale(locale);
      const query = `
      SELECT
        c.id,
        COALESCE(t.name, tf.name, c.name) AS name,
        COUNT(j.id)::int AS job_count,
        $1::text AS locale,
        CASE
          WHEN t.id IS NOT NULL THEN t.locale
          WHEN tf.id IS NOT NULL THEN tf.locale
          ELSE '${DEFAULT_LOCALE}'
        END AS locale_resolved
      FROM categories c
      LEFT JOIN category_translations t
        ON t.category_id = c.id AND t.locale = $1
      LEFT JOIN category_translations tf
        ON tf.category_id = c.id AND tf.locale = $2
      LEFT JOIN job_posts j
        ON j.category_id = c.id
        AND j.archived_at IS NULL
        AND j.status_id < 3
      GROUP BY c.id, t.id, t.locale, t.name, tf.id, tf.locale, tf.name
      ORDER BY job_count DESC;
      `;

      const result = await this.db.executeQuery(query, [loc, DEFAULT_LOCALE]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllCategoriesWithJobcount", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAllCategories(search, locale = DEFAULT_LOCALE) {
    try {
      const searchQuery = search ? `%${search}%` : "%%";
      const loc = resolveLocale(locale);
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${collection} c
      LEFT JOIN category_translations t
        ON t.category_id = c.id AND t.locale = $2
      LEFT JOIN category_translations tf
        ON tf.category_id = c.id AND tf.locale = $3
      WHERE COALESCE(t.name, tf.name, c.name) ILIKE $1;
    `;
      const countResult = await this.db.executeQuery(countQuery, [
        searchQuery,
        loc,
        DEFAULT_LOCALE,
      ]);
      return wrapper.data(parseInt(countResult.rows[0].total, 10) || 0);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllCategories", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
