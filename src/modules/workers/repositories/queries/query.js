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
      SELECT w.id, w.user_id, w.name, w.avatar_url, w.telephone, w.date_of_birth,
             g.name AS gender_name,
             c.name AS country_name,
             ms.name AS marriage_status_name,
             r.name AS religion_name,
             w.address, w.profile_summary, w.current_salary, w.expected_salary
      FROM workers w
      LEFT JOIN genders g ON w.gender_id = g.id
      LEFT JOIN countries c ON w.country_id = c.id
      LEFT JOIN marriage_status ms ON w.marriage_status_id = ms.id
      LEFT JOIN religions r ON w.religion_id = r.id
      WHERE w.user_id = $1
      LIMIT 1;
    `;

      const workerResult = await this.db.executeQuery(workerQuery, [user_id]);

      if (!workerResult || workerResult.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      const worker = workerResult.rows[0];
      const id = worker.id;

      const [workExperiences, certifications, skills, educations, languages, resumes, portfolios] = await Promise.all([
        this.db.executeQuery("SELECT * FROM work_experiences WHERE worker_id = $1", [id]),
        this.db.executeQuery("SELECT * FROM certifications WHERE worker_id = $1", [id]),
        this.db.executeQuery(
          `
        SELECT ws.skill_id, s.skill_name 
        FROM worker_skills ws
        JOIN skills s ON ws.skill_id = s.id
        WHERE ws.worker_id = $1
      `,
          [id]
        ),
        this.db.executeQuery("SELECT * FROM educations WHERE worker_id = $1", [id]),
        this.db.executeQuery(
          `
        SELECT l.id, lang.language_name, pl.proficiency_level_name, l.is_primary
        FROM languages l
        JOIN proficiency_levels pl ON l.proficiency_level_id = pl.id
        JOIN language_names lang ON l.language_id = lang.id
        WHERE l.worker_id = $1
      `,
          [id]
        ),
        this.db.executeQuery("SELECT * FROM resumes WHERE worker_id = $1", [id]),
        this.db.executeQuery("SELECT * FROM portfolios WHERE worker_id = $1", [id]),
      ]);

      const result = {
        ...worker,
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
}

module.exports = Query;
