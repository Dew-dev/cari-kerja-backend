const collection = "work_experiences";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  resolveLocale,
  DEFAULT_LOCALE,
} = require("../../../../helpers/i18n/locale");
const ctx = "WorkExperience-Query";

const WE_SELECT = `
  we.id,
  we.company_name,
  we.job_title,
  we.job_title_id,
  jt.category_id,
  COALESCE(t.name, tf.name) AS category_name,
  CASE
    WHEN jt.id IS NOT NULL THEN json_build_object(
      'id', jt.id,
      'name', jt.name,
      'slug', jt.slug,
      'category_id', jt.category_id
    )
    ELSE NULL
  END AS job_title_ref,
  we.start_date,
  we.end_date,
  we.is_current,
  we.description,
  we.updated_at
`;

const WE_JOINS = `
  LEFT JOIN job_titles jt ON jt.id = we.job_title_id AND jt.deleted_at IS NULL
  LEFT JOIN category_translations t
    ON t.category_id = jt.category_id AND t.locale = $LOCALE
  LEFT JOIN category_translations tf
    ON tf.category_id = jt.category_id AND tf.locale = $FALLBACK
`;

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async getAllByWorkerId(worker_id, locale) {
    try {
      const loc = resolveLocale(locale);
      const query = `
        SELECT ${WE_SELECT}
        FROM work_experiences we
        ${WE_JOINS.replace("$LOCALE", "$2").replace("$FALLBACK", "$3")}
        WHERE we.worker_id = $1
        ORDER BY we.start_date DESC;
      `;

      const result = await this.db.executeQuery(query, [
        worker_id,
        loc,
        DEFAULT_LOCALE,
      ]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getAllByWorkerId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async getOneById(worker_id, id, locale) {
    try {
      const loc = resolveLocale(locale);
      const query = `
        SELECT ${WE_SELECT}
        FROM work_experiences we
        ${WE_JOINS.replace("$LOCALE", "$3").replace("$FALLBACK", "$4")}
        WHERE we.worker_id = $1 AND we.id = $2
        LIMIT 1;
      `;

      const result = await this.db.executeQuery(query, [
        worker_id,
        id,
        loc,
        DEFAULT_LOCALE,
      ]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getOneById", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
