const collection = "work_experiences";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "WorkExperience-Query";

class Query {
  constructor(db) {
    this.db = db;
  }
  
  // parameter: nyari berdasarkan apa
  // projection: kolom apa aja yang mau diambil

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  // Get All Work Experiences By Worker Id
  async getAllByWorkerId(worker_id) {
    try {
      const query = `
        SELECT 
          we.id,
          we.company_name,
          we.job_title,
          we.job_title_id,
          CASE
            WHEN jt.id IS NOT NULL THEN json_build_object(
              'id', jt.id,
              'name', jt.name,
              'slug', jt.slug
            )
            ELSE NULL
          END AS job_title_ref,
          we.start_date,
          we.end_date,
          we.is_current,
          we.description,
          we.updated_at
        FROM work_experiences we
        LEFT JOIN job_titles jt ON jt.id = we.job_title_id AND jt.deleted_at IS NULL
        WHERE we.worker_id = $1
        ORDER BY we.start_date DESC;
      `;

      const result = await this.db.executeQuery(query, [worker_id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getAllByWorkerId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Get One Work Experience By ID
  async getOneById(worker_id, id) {
    try {
      const query = `
        SELECT 
          we.id,
          we.company_name,
          we.job_title,
          we.job_title_id,
          CASE
            WHEN jt.id IS NOT NULL THEN json_build_object(
              'id', jt.id,
              'name', jt.name,
              'slug', jt.slug
            )
            ELSE NULL
          END AS job_title_ref,
          we.start_date,
          we.end_date,
          we.is_current,
          we.description,
          we.updated_at
        FROM work_experiences we
        LEFT JOIN job_titles jt ON jt.id = we.job_title_id AND jt.deleted_at IS NULL
        WHERE we.worker_id = $1 AND we.id = $2
        LIMIT 1;
      `;

      const result = await this.db.executeQuery(query, [worker_id, id]);

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
