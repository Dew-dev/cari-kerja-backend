const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const { buildAuthStatus } = require("../../../../helpers/auth/login_status");
const {
  buildTelegramProfileFields,
  omitSensitiveTelegramFields,
} = require("../../../../helpers/auth/telegram_profile");
const ctx = "Worker-Query-Domain";

const isQueryFailure = (err) =>
  typeof err === "string" && err.toLowerCase().includes("error querying");

class Worker {
  constructor(db) {
    this.query = new Query(db);
  }

  async getWorkerByUserId(payload) {
    const { user_id } = payload;

    const worker = await this.query.findOneByUserId(user_id);
    if (worker.err) {
      logger.error(ctx, "getWorker", "Can not find worker", worker.err);
      if (isQueryFailure(worker.err)) {
        return wrapper.error(
          new InternalServerError("Failed to load worker profile")
        );
      }
      return wrapper.error(new NotFoundError("Can not find worker"));
    }

    const row = worker.data;
    const telegramUser = {
      id: row.user_id,
      user_id: row.user_id,
      login_provider: row.login_provider,
      username: row.user_username,
      telegram_chat_id: row.telegram_chat_id,
      telegram_notify_username: row.telegram_notify_username,
      name: row.name,
    };

    const clean = omitSensitiveTelegramFields({
      ...row,
      user_username: undefined,
    });
    delete clean.user_username;
    delete clean.telegram_notify_username;

    return wrapper.data({
      ...clean,
      ...buildAuthStatus(row),
      ...buildTelegramProfileFields(telegramUser, {
        forSelf: true,
        displayName: row.name,
      }),
    });
  }

  async getWorkerById(payload) {
    const { id } = payload;

    const worker = await this.query.findOneById(id);
    if (worker.err) {
      logger.error(ctx, "getWorkerById", "Can not find worker", worker.err);
      if (isQueryFailure(worker.err)) {
        return wrapper.error(
          new InternalServerError("Failed to load worker profile")
        );
      }
      return wrapper.error(new NotFoundError("Can not find worker"));
    }

    const row = worker.data;
    const telegramUser = {
      login_provider: row.login_provider,
      username: row.user_username,
      telegram_chat_id: row.telegram_chat_id,
      telegram_notify_username: row.telegram_notify_username,
      name: row.name,
    };

    const clean = omitSensitiveTelegramFields({ ...row });
    delete clean.user_username;
    delete clean.telegram_notify_username;
    delete clean.login_provider;

    return wrapper.data({
      ...clean,
      ...buildTelegramProfileFields(telegramUser, {
        forSelf: false,
        displayName: row.name,
      }),
    });
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
      category_id,
      min_years,
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 12,
    } = payload;

    const conditions = [];
    const values = [];
    let idx = 1;

    // Soft-deleted workers must never appear in public/list results
    conditions.push(` AND w.deleted_at IS NULL`);

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

    // Filter by tenure in a specific job category.
    // min_years is optional and defaults to 0 (any experience in that category).
    // Use epoch seconds so timestamptz - timestamptz always yields a numeric year value.
    const hasCategoryId =
      category_id !== undefined && category_id !== null && category_id !== "";
    if (hasCategoryId) {
      const minYearsValue =
        min_years !== undefined && min_years !== null && min_years !== ""
          ? Number(min_years)
          : 0;
      conditions.push(`
        AND EXISTS (
          SELECT 1
          FROM work_experiences we
          INNER JOIN job_titles jt
            ON jt.id = we.job_title_id
           AND jt.deleted_at IS NULL
           AND COALESCE(jt.is_active, TRUE) IS TRUE
           AND jt.category_id = $${idx}
          WHERE we.worker_id = w.id
            AND we.start_date IS NOT NULL
          GROUP BY we.worker_id
          HAVING COALESCE(
            SUM(
              EXTRACT(EPOCH FROM (
                COALESCE(we.end_date, CURRENT_TIMESTAMP) - we.start_date
              )) / 31557600.0
            ),
            0
          ) >= $${idx + 1}
        )
      `);
      values.push(Number(category_id), minYearsValue);
      idx += 2;
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
    if (count.err) {
      logger.error(ctx, "getWorkers", "Cannot count workers", count.err);
      return wrapper.error(new InternalServerError("Cannot count workers"));
    }
    const totalData = Number(count.data?.rowCount || 0);

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
      return wrapper.error(new InternalServerError("Cannot find workers"));
    }

    // Empty list is a valid filter result — never 404.
    return wrapper.paginationData(workers.data || [], workers.meta);
  }
}

module.exports = Worker;
