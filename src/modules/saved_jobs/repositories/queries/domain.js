const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Savedjobs-Query-Domain";

class SavedJobs {
  constructor(db) {
    this.query = new Query(db);
  }

  async getSavedJobsByWorkerId(payload) {
    const savedJobs = await this.query.findAllByWorkerId(payload);

    if (savedJobs.err) {
      logger.error(
        ctx,
        "getSavedJobsByWorkerId",
        "Can not find savedJobs",
        savedJobs.err
      );
      return wrapper.error(new NotFoundError("Can not find savedJobs"));
    }

    logger.info(ctx, "getSavedJobsByWorkerId", "Get SavedJobs", payload);
    return wrapper.paginationData(savedJobs.data, savedJobs.meta);
  }

  async getSavedJobsById(payload) {
    const { id } = payload;
    const savedJobs = await this.query.findOneBySavedJobsId(id);

    if (savedJobs.err) {
      logger.error(ctx, "getSavedJobsBYId", "SavedJobs Query", savedJobs.err);
      return wrapper.error(new NotFoundError("Can not find the SavedJobs"));
    }

    logger.info(ctx, "getSavedJobsById", "Saved Jobs Query", payload);
    return wrapper.data(savedJobs.data);
  }

  async getSavedJobs(payload) {
    const {
      status,
      employment_type,
      experience_level,
      salary_type,
      location,
      salary_min,
      salary_max,
      currency,
      created_after,
      created_before,
      search, // Full-text search term
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 10,
    } = payload;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status !== undefined && status !== null && status !== "") {
      conditions.push(` AND jps.name = $${idx}`);
      values.push(status);
      idx += 1;
    }

    if (employment_type !== undefined && status !== null && status !== "") {
      conditions.push(` AND et.name = $${idx}`);
      values.push(employment_type);
      idx += 1;
    }

    if (
      experience_level !== undefined &&
      experience_level !== null &&
      experience_level !== ""
    ) {
      conditions.push(` AND el.name = $${idx}`);
      values.push(experience_level);
      idx += 1;
    }

    if (
      salary_type !== undefined &&
      salary_type !== null &&
      salary_type !== ""
    ) {
      conditions.push(` AND st.name = $${idx}`);
      values.push(salary_type);
      idx += 1;
    }

    if (location !== undefined && location !== null && location !== "") {
      conditions.push(` AND j.location ILIKE $${idx}`);
      values.push(location);
      idx += 1;
    }

    if (salary_min !== undefined && salary_min !== null && salary_min !== "") {
      conditions.push(` AND j.salary_min >= $${idx}`);
      values.push(salary_min);
      idx += 1;
    }

    if (salary_max !== undefined && salary_max !== null && salary_max !== "") {
      conditions.push(` AND j.salary_max <= $${idx}`);
      values.push(salary_max);
      idx += 1;
    }

    if (currency !== undefined && currency !== null && currency !== "") {
      conditions.push(` AND c.name = $${idx}`);
      values.push(currency);
      idx += 1;
    }

    if (
      created_after !== undefined &&
      created_after !== null &&
      created_after !== ""
    ) {
      conditions.push(` AND sj.created_at >= $${idx}`);
      values.push(created_after);
      idx += 1;
    }

    if (
      created_before !== undefined &&
      created_before !== null &&
      created_before !== ""
    ) {
      conditions.push(` AND sj.created_at <= $${idx}`);
      values.push(created_before);
      idx += 1;
    }

    // 🔍 Full-text search on title & description
    if (search !== undefined && search !== null && search !== "") {
      conditions.push(`
            AND (
                -- Try full-text search first with stemmed wildcard
                (to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.description, ''))
                 @@ websearch_to_tsquery('english', lower($${idx}) || ':*'))
                OR
                -- Fallback: Case-insensitive substring match
                (LOWER(j.title || ' ' || COALESCE(j.description, '')) ILIKE '%' || lower($${idx}) || '%')
            )
            `);
      values.push(`${search}:*`);
      idx += 1;
    }

    const sortableColumns = {
      title: "j.title",
      location: "j.location",
      salary_min: "j.salary_min",
      salary_max: "j.salary_max",
      created_at: "sj.created_at",
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const data = {
      conditions,
      orderColumn,
      orderDirection,
      idx,
      values,
      limit,
      page,
    };
    const savedJobs = await this.query.findAll(data);

    if (savedJobs.err) {
      logger.error(ctx, "getSavedJobs", "Can not find Saved Jobs", savedJobs.err);
      return wrapper.error(new NotFoundError("Can not find Saved Jobs"));
    }

    logger.info(ctx, "getSavedJobs", "Get SavedJobs", data);
    return wrapper.paginationData(savedJobs.data, savedJobs.meta);
  }

  async getSavedJobsSelf(payload) {
    const {
      worker_id,
      status,
      employment_type,
      experience_level,
      salary_type,
      location,
      salary_min,
      salary_max,
      currency,
      created_after,
      created_before,
      search, // Full-text search term
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 10,
    } = payload;
    const conditions = [];
    const values = [];
    let idx = 1;

    conditions.push(` AND sj.worker_id = $${idx}`);
    values.push(worker_id);
    idx += 1;

    if (status !== undefined && status !== null && status !== "") {
      conditions.push(` AND jps.name = $${idx}`);
      values.push(status);
      idx += 1;
    }

    if (employment_type !== undefined && status !== null && status !== "") {
      conditions.push(` AND et.name = $${idx}`);
      values.push(employment_type);
      idx += 1;
    }

    if (
      experience_level !== undefined &&
      experience_level !== null &&
      experience_level !== ""
    ) {
      conditions.push(` AND el.name = $${idx}`);
      values.push(experience_level);
      idx += 1;
    }

    if (
      salary_type !== undefined &&
      salary_type !== null &&
      salary_type !== ""
    ) {
      conditions.push(` AND st.name = $${idx}`);
      values.push(salary_type);
      idx += 1;
    }

    if (location !== undefined && location !== null && location !== "") {
      conditions.push(` AND j.location ILIKE $${idx}`);
      values.push(location);
      idx += 1;
    }

    if (salary_min !== undefined && salary_min !== null && salary_min !== "") {
      conditions.push(` AND j.salary_min >= $${idx}`);
      values.push(salary_min);
      idx += 1;
    }

    if (salary_max !== undefined && salary_max !== null && salary_max !== "") {
      conditions.push(` AND j.salary_max <= $${idx}`);
      values.push(salary_max);
      idx += 1;
    }

    if (currency !== undefined && currency !== null && currency !== "") {
      conditions.push(` AND c.name = $${idx}`);
      values.push(currency);
      idx += 1;
    }

    if (
      created_after !== undefined &&
      created_after !== null &&
      created_after !== ""
    ) {
      conditions.push(` AND sj.created_at >= $${idx}`);
      values.push(created_after);
      idx += 1;
    }

    if (
      created_before !== undefined &&
      created_before !== null &&
      created_before !== ""
    ) {
      conditions.push(` AND sj.created_at <= $${idx}`);
      values.push(created_before);
      idx += 1;
    }

    // 🔍 Full-text search on title & description
    if (search !== undefined && search !== null && search !== "") {
      conditions.push(`
            AND (
                -- Try full-text search first with stemmed wildcard
                (to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.description, ''))
                 @@ websearch_to_tsquery('english', lower($${idx}) || ':*'))
                OR
                -- Fallback: Case-insensitive substring match
                (LOWER(j.title || ' ' || COALESCE(j.description, '')) ILIKE '%' || lower($${idx}) || '%')
            )
            `);
      values.push(`${search}:*`);
      idx += 1;
    }

    const sortableColumns = {
      title: "j.title",
      location: "j.location",
      salary_min: "j.salary_min",
      salary_max: "j.salary_max",
      created_at: "sj.created_at",
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const data = {
      conditions,
      orderColumn,
      orderDirection,
      idx,
      values,
      limit,
      page,
    };
    const savedJobs = await this.query.findAll(data);

    if (savedJobs.err) {
      logger.error(ctx, "getSavedJobs", "Can not find savedJobs", savedJobs.err);
      return wrapper.error(new NotFoundError("Can not find savedJobs"));
    }

    logger.info(ctx, "getSavedJobs", "Get Saved Jobs", data);
    return wrapper.paginationData(savedJobs.data, savedJobs.meta);
  }
}

module.exports = SavedJobs;
