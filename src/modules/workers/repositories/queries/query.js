const collection = "workers"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Worker-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  // parameter: nyari berdasarkan apa
  // projection: kolom apa aja yang mau diambil

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findOneByUserId(user_id) {
    try {
      const workerQuery = `
      SELECT w.id, w.user_id, w.name, w.avatar_url, w.telephone, TO_CHAR(w.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,w.gender_id,w.nationality_id, w.religion_id, w.marriage_status_id,
             g.gender_name AS gender_name,
             n.country_name AS country_name,
             ms.status_name AS marriage_status_name,
             r.religion_name AS religion_name,
             w.address, w.profile_summary, w.current_salary, w.expected_salary,
             c1.id AS current_salary_currency_id, c1.code AS current_salary_currency_code, c1.name AS current_salary_currency_name, c1.symbol AS current_salary_currency_symbol,
             c2.id AS expected_salary_currency_id, c2.code AS expected_salary_currency_code, c2.name AS expected_salary_currency_name, c2.symbol AS expected_salary_currency_symbol,
             u.email
      FROM ${collection} w
      LEFT JOIN genders g ON w.gender_id = g.id
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN nationalities n ON w.nationality_id = n.id
      LEFT JOIN marriage_statuses ms ON w.marriage_status_id = ms.id
      LEFT JOIN religions r ON w.religion_id = r.id
      LEFT JOIN currencies c1 ON w.current_salary_currency_id = c1.id
      LEFT JOIN currencies c2 ON w.expected_salary_currency_id = c2.id
      WHERE w.user_id = $1
      LIMIT 1;
    `;

      const workerResult = await this.db.executeQuery(workerQuery, [user_id]);

      if (!workerResult || workerResult.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      const worker = workerResult.rows[0];
      const id = worker.id;

      const [
        workExperiences,
        certifications,
        skills,
        educations,
        languages,
        resumes,
        portfolios,
      ] = await Promise.all([
        this.db.executeQuery(
          "SELECT * FROM work_experiences WHERE worker_id = $1 ORDER BY start_date DESC",
          [id]
        ),
        this.db.executeQuery(
          "SELECT * FROM certifications WHERE worker_id = $1",
          [id]
        ),
        this.db.executeQuery(
          `
        SELECT ws.skill_id as id, s.skill_name as name
        FROM worker_skills ws
        JOIN skills s ON ws.skill_id = s.id
        WHERE ws.worker_id = $1
      `,
          [id]
        ),
        this.db.executeQuery(
          "SELECT * FROM educations WHERE worker_id = $1 ORDER BY start_date DESC",
          [id]
        ),
        this.db.executeQuery(
          `
        SELECT l.id, l.language_name, pl.name, l.is_primary
        FROM languages l
        JOIN proficiency_levels pl ON l.proficiency_level_id = pl.id
        WHERE l.worker_id = $1
      `,
          [id]
        ),
        this.db.executeQuery("SELECT * FROM resumes WHERE worker_id = $1", [
          id,
        ]),
        this.db.executeQuery("SELECT * FROM portfolios WHERE worker_id = $1", [
          id,
        ]),
      ]);

      const result = {
        ...worker,
        current_salary_currency: {
          id: worker.current_salary_currency_id,
          code: worker.current_salary_currency_code,
          name: worker.current_salary_currency_name,
          symbol: worker.current_salary_currency_symbol,
        },
        expected_salary_currency: {
          id: worker.expected_salary_currency_id,
          code: worker.expected_salary_currency_code,
          name: worker.expected_salary_currency_name,
          symbol: worker.expected_salary_currency_symbol,
        },
        work_experiences: workExperiences.rows,
        certifications: certifications.rows,
        worker_skills: skills.rows,
        educations: educations.rows,
        languages: languages.rows,
        resumes: resumes.rows,
        portfolios: portfolios.rows,
      };

      return wrapper.data(result);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findOne", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findOneById(id) {
    try {
      const workerQuery = `
      SELECT w.id, w.user_id, w.name, w.avatar_url, w.telephone, TO_CHAR(w.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,w.gender_id,w.nationality_id, w.religion_id, w.marriage_status_id,
             g.gender_name AS gender_name,
             n.country_name AS country_name,
             ms.status_name AS marriage_status_name,
             r.religion_name AS religion_name,
             w.address, w.profile_summary, w.current_salary, w.expected_salary,
             c1.id AS current_salary_currency_id, c1.code AS current_salary_currency_code, c1.name AS current_salary_currency_name, c1.symbol AS current_salary_currency_symbol,
             c2.id AS expected_salary_currency_id, c2.code AS expected_salary_currency_code, c2.name AS expected_salary_currency_name, c2.symbol AS expected_salary_currency_symbol,
             u.email
      FROM ${collection} w
      LEFT JOIN genders g ON w.gender_id = g.id
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN nationalities n ON w.nationality_id = n.id
      LEFT JOIN marriage_statuses ms ON w.marriage_status_id = ms.id
      LEFT JOIN religions r ON w.religion_id = r.id
      LEFT JOIN currencies c1 ON w.current_salary_currency_id = c1.id
      LEFT JOIN currencies c2 ON w.expected_salary_currency_id = c2.id
      WHERE w.id = $1
      LIMIT 1;
    `;

      const workerResult = await this.db.executeQuery(workerQuery, [id]);

      if (!workerResult || workerResult.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      const worker = workerResult.rows[0];

      const [
        workExperiences,
        certifications,
        skills,
        educations,
        languages,
        resumes,
        portfolios,
      ] = await Promise.all([
        this.db.executeQuery(
          "SELECT * FROM work_experiences WHERE worker_id = $1 ORDER BY start_date DESC",
          [id]
        ),
        this.db.executeQuery(
          "SELECT * FROM certifications WHERE worker_id = $1",
          [id]
        ),
        this.db.executeQuery(
          `
        SELECT ws.skill_id as id, s.skill_name as name
        FROM worker_skills ws
        JOIN skills s ON ws.skill_id = s.id
        WHERE ws.worker_id = $1
      `,
          [id]
        ),
        this.db.executeQuery(
          "SELECT * FROM educations WHERE worker_id = $1 ORDER BY start_date DESC",
          [id]
        ),
        this.db.executeQuery(
          `
        SELECT l.id, l.language_name, pl.name, l.is_primary
        FROM languages l
        JOIN proficiency_levels pl ON l.proficiency_level_id = pl.id
        WHERE l.worker_id = $1
      `,
          [id]
        ),
        this.db.executeQuery("SELECT * FROM resumes WHERE worker_id = $1", [
          id,
        ]),
        this.db.executeQuery("SELECT * FROM portfolios WHERE worker_id = $1", [
          id,
        ]),
      ]);

      const result = {
        ...worker,
        current_salary_currency: {
          id: worker.current_salary_currency_id,
          code: worker.current_salary_currency_code,
          name: worker.current_salary_currency_name,
          symbol: worker.current_salary_currency_symbol,
        },
        expected_salary_currency: {
          id: worker.expected_salary_currency_id,
          code: worker.expected_salary_currency_code,
          name: worker.expected_salary_currency_name,
          symbol: worker.expected_salary_currency_symbol,
        },
        work_experiences: workExperiences.rows,
        certifications: certifications.rows,
        worker_skills: skills.rows,
        educations: educations.rows,
        languages: languages.rows,
        resumes: resumes.rows,
        portfolios: portfolios.rows,
      };

      return wrapper.data(result);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findOneById", error);
      return wrapper.error(errorQueryMessage);
    }
  }
  async findAll({
    conditions,
    orderColumn,
    orderDirection,
    idx,
    values,
    limit,
    page,
    totalData,
  }) {
    try {
      const workersQuery = `
        SELECT 
          w.id,
          w.user_id,
          w.name,
          w.avatar_url,
          w.telephone,
          TO_CHAR(w.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
          w.gender_id,
          g.gender_name,
          w.nationality_id,
          n.country_name,
          w.address,
          w.profile_summary,
          w.current_salary,
          w.expected_salary,
          c1.id AS current_salary_currency_id, 
          c1.code AS current_salary_currency_code, 
          c1.name AS current_salary_currency_name,
          c1.symbol AS current_salary_currency_symbol,
          c2.id AS expected_salary_currency_id, 
          c2.code AS expected_salary_currency_code, 
          c2.name AS expected_salary_currency_name,
          c2.symbol AS expected_salary_currency_symbol,
          w.created_at,
          w.updated_at,
          (SELECT json_agg(json_build_object('id', s.id, 'skill_name', s.skill_name))
           FROM worker_skills ws
           JOIN skills s ON s.id = ws.skill_id
           WHERE ws.worker_id = w.id
          ) AS skills,
          (SELECT COALESCE(json_agg(json_build_object(
            'id', we.id,
            'company_name', we.company_name,
            'job_title', we.job_title,
            'start_date', we.start_date,
            'end_date', we.end_date
          ) ORDER BY we.start_date DESC), '[]'::json)
           FROM work_experiences we
           WHERE we.worker_id = w.id
          ) AS work_experiences,
          (SELECT COALESCE(json_agg(json_build_object(
            'id', e.id,
            'institution_name', e.institution_name,
            'degree', e.degree,
            'field_of_study', e.major,
            'start_date', e.start_date,
            'end_date', e.end_date
          ) ORDER BY e.start_date DESC), '[]'::json)
           FROM educations e
           WHERE e.worker_id = w.id
          ) AS educations
        FROM ${collection} w
        LEFT JOIN genders g ON w.gender_id = g.id
        LEFT JOIN nationalities n ON w.nationality_id = n.id
        LEFT JOIN currencies c1 ON w.current_salary_currency_id = c1.id
        LEFT JOIN currencies c2 ON w.expected_salary_currency_id = c2.id
        WHERE 1=1${conditions}
        ORDER BY ${orderColumn} ${orderDirection}
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));
      console.log("workersQuery", workersQuery, values);
      const workersResult = await this.db.executeQuery(workersQuery, values);

      const result = workersResult.rows.map((row) => ({
        ...row,
        current_salary_currency: {
          id: row.current_salary_currency_id,
          code: row.current_salary_currency_code,
          name: row.current_salary_currency_name,
          symbol: row.current_salary_currency_symbol,
        },
        expected_salary_currency: {
          id: row.expected_salary_currency_id,
          code: row.expected_salary_currency_code,
          name: row.expected_salary_currency_name,
          symbol: row.expected_salary_currency_symbol,
        },
        skills: row.skills || [],
        work_experiences: row.work_experiences || [],
        educations: row.educations || [],
      }));

      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalData,
        totalPage: Math.ceil(totalData / parseInt(limit, 10)),
      };

      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "FindAll", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countAllWorkers(conditions, values) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM ${collection} w
        LEFT JOIN genders g ON w.gender_id = g.id
        LEFT JOIN nationalities n ON w.nationality_id = n.id
        WHERE 1=1${conditions}
      `;

      const result = await this.db.executeQuery(query, values);
      return wrapper.data({ rowCount: parseInt(result.rows[0].count, 10) });
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "CountAllWorkers", error);
      return wrapper.error(errorQueryMessage);
    }
  }}

module.exports = Query;
