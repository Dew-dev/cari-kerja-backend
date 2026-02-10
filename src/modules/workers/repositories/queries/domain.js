const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Worker-Query-Domain";

class Worker {
  constructor(db) {
    this.query = new Query(db);
  }

  async getWorkerByUserId(payload) {
    const { user_id } = payload;

    const worker = await this.query.findOneByUserId(user_id);
    if (worker.err) {
      logger.error(ctx, "getWorker", "Can not find worker", worker.err);
      return wrapper.error(new NotFoundError("Can not find worker"));
    }

    logger.info(ctx, "getWorker", "get detail worker", payload);
    return wrapper.data(worker.data);
  }

  async getWorkerById(payload) {
    const { id } = payload;

    const worker = await this.query.findOneById(id);
    if (worker.err) {
      logger.error(ctx, "getWorkerById", "Can not find worker", worker.err);
      return wrapper.error(new NotFoundError("Can not find worker"));
    }

    logger.info(ctx, "getWorkerById", "get detail worker", payload);
    return wrapper.data(worker.data);
  }

  async getWorkers(payload) {
    const {
      search,
      skills,
      gender,
      nationality,
      min_salary,
      max_salary,
      experience_years,
      education_level,
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 12,
    } = payload;

    const conditions = [];
    const values = [];
    let idx = 1;

    // Search by name or profile summary
    if (search !== undefined && search !== null && search !== "" && search.length >= 2) {
      conditions.push(`
        AND (
          LOWER(w.name) ILIKE '%' || lower($${idx}) || '%'
          OR LOWER(w.profile_summary) ILIKE '%' || lower($${idx}) || '%'
        )
      `);
      values.push(search);
      idx += 1;
    }

    // Filter by skills
    const skillList = Array.isArray(skills)
      ? skills
      : skills
        ? skills.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
        : [];
    
    if (Array.isArray(skillList) && skillList.length > 0) {
      conditions.push(`
        AND EXISTS (
          SELECT 1 FROM worker_skills ws
          JOIN skills s ON s.id = ws.skill_id
          WHERE ws.worker_id = w.id AND s.skill_name = ANY($${idx})
        )
      `);
      values.push(skillList);
      idx += 1;
    }

    // Filter by gender
    if (gender !== undefined && gender !== null && gender !== "") {
      conditions.push(` AND g.gender_name = $${idx}`);
      values.push(gender);
      idx += 1;
    }

    // Filter by nationality
    if (nationality !== undefined && nationality !== null && nationality !== "") {
      conditions.push(` AND n.country_name = $${idx}`);
      values.push(nationality);
      idx += 1;
    }

    // Filter by expected salary (min)
    if (min_salary !== undefined && min_salary !== null && min_salary !== "") {
      conditions.push(` AND w.expected_salary >= $${idx}`);
      values.push(min_salary);
      idx += 1;
    }

    // Filter by expected salary (max)
    if (max_salary !== undefined && max_salary !== null && max_salary !== "") {
      conditions.push(` AND w.expected_salary <= $${idx}`);
      values.push(max_salary);
      idx += 1;
    }

    // Filter by years of experience
    if (experience_years !== undefined && experience_years !== null && experience_years !== "") {
      conditions.push(`
        AND EXISTS (
          SELECT 1 FROM work_experiences we
          WHERE we.worker_id = w.id
          GROUP BY we.worker_id
          HAVING SUM(
            EXTRACT(YEAR FROM AGE(
              COALESCE(we.end_date, CURRENT_DATE),
              we.start_date
            ))
          ) >= $${idx}
        )
      `);
      values.push(experience_years);
      idx += 1;
    }

    // Filter by education level
    if (education_level !== undefined && education_level !== null && education_level !== "") {
      conditions.push(`
        AND EXISTS (
          SELECT 1 FROM educations e
          WHERE e.worker_id = w.id AND e.degree = $${idx}
        )
      `);
      values.push(education_level);
      idx += 1;
    }

    const sortableColumns = {
      name: "w.name",
      created_at: "w.created_at",
      expected_salary: "w.expected_salary",
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const conditionsString = conditions.join("\n");

    const count = await this.query.countAllWorkers(conditionsString, values);
    const totalData = count.data.rowCount;

    const data = {
      conditions: conditionsString,
      orderColumn,
      orderDirection,
      idx,
      values,
      limit,
      page,
      totalData,
    };

    const workers = await this.query.findAll(data);

    if (workers.err) {
      logger.error(ctx, "getWorkers", "Cannot find workers", workers.err);
      return wrapper.error(new NotFoundError("Cannot find workers"));
    }

    logger.info(ctx, "getWorkers", "Get Workers", data);
    return wrapper.paginationData(workers.data, workers.meta);
  }
}

module.exports = Worker;
