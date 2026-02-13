const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const WorkerSkillsQuery = require("../../../worker-skills/repositories/queries/query");
const ctx = "Jobposts-Query-Domain";

class Jobposts {
  constructor(db) {
    this.query = new Query(db);
    this.workerSkillsQuery = new WorkerSkillsQuery(db);
  }

  async getJobPostsLogic(payload) {
    const {
      recruiter_id,
      status,
      employment_type,
      experience_level,
      salary_type,
      location,
      province, // 🌍 Province name filter
      city, // 🌍 City name filter
      salary_min,
      salary_max,
      currency,
      category,
      created_after,
      created_before,
      search, // Full-text search term
      tags,
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 12,
      user_id = null,
      archive = null,
      exclude_id,
      self = false,
      recommendations = false, // 🎯 Enable/disable skill-based recommendations (default: true)
    } = payload;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (
      recruiter_id !== undefined &&
      recruiter_id !== null &&
      recruiter_id !== ""
    ) {
      conditions.push(` AND j.recruiter_id = $${idx}`);
      values.push(recruiter_id);
      idx += 1;
    }

    if (status !== undefined && status !== null && status !== "") {
      conditions.push(` AND jps.name = $${idx}`);
      values.push(status);
      idx += 1;
    }

    const employmentTypeList = Array.isArray(employment_type)
      ? employment_type
      : employment_type
        ? employment_type
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];
    if (
      employmentTypeList !== undefined &&
      employmentTypeList !== null &&
      employmentTypeList !== "" &&
      Array.isArray(employmentTypeList) &&
      employmentTypeList.length > 0
    ) {
      conditions.push(` AND et.name = ANY($${idx}::text[])`);
      values.push(employmentTypeList);
      idx += 1;
    }

    const experienceLevelList = Array.isArray(experience_level)
      ? experience_level
      : experience_level
        ? experience_level
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];
    if (
      experienceLevelList !== undefined &&
      experienceLevelList !== null &&
      experienceLevelList !== "" &&
      Array.isArray(experienceLevelList) &&
      experienceLevelList.length > 0
    ) {
      conditions.push(` AND el.name = ANY($${idx})`);
      values.push(experienceLevelList);
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
      conditions.push(` AND j.location ILIKE '%' || $${idx} || '%'`);
      values.push(location);
      idx += 1;
    }

    // 🌍 Filter by province name
    if (province !== undefined && province !== null && province !== "") {
      conditions.push(` AND j.province ILIKE $${idx}`);
      values.push(province);
      idx += 1;
    }

    // 🌍 Filter by city name
    if (city !== undefined && city !== null && city !== "") {
      conditions.push(` AND j.city ILIKE $${idx}`);
      values.push(city);
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

    if (category !== undefined && category !== null && category !== "") {
      conditions.push(` AND cat.name = $${idx}`);
      values.push(category);
      idx += 1;
    }

    if (
      created_after !== undefined &&
      created_after !== null &&
      created_after !== ""
    ) {
      conditions.push(` AND j.created_at >= $${idx}`);
      values.push(created_after);
      idx += 1;
    }

    if (
      created_before !== undefined &&
      created_before !== null &&
      created_before !== ""
    ) {
      conditions.push(` AND j.created_at <= $${idx}`);
      values.push(created_before);
      idx += 1;
    }

    // 🔍 Full-text search on title & description
    if (
      search !== undefined &&
      search !== null &&
      search !== "" &&
      search.length >= 2
    ) {
      if (search.length >= 3) {
        conditions.push(`
          AND (
            -- ✅ Full-text search (stemmed)
            (
              to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.description, ''))
              @@ websearch_to_tsquery('english', lower($${idx}) || ':*')
            )
            OR
            -- ✅ Fallback: ILIKE (substring) untuk semua kasus, terutama yang pendek
            (
              LOWER(j.title || ' ' || COALESCE(j.description, '')) ILIKE '%' || lower($${idx}) || '%'
            )
          )
        `);
        values.push(search);
        idx += 1;
      } else {
        conditions.push(`
          AND LOWER(j.title || ' ' || COALESCE(j.description, '')) ILIKE '%' || lower($${idx}) || '%'
        `);
        values.push(search);
        idx += 1;
      }
    }

    const tagList = Array.isArray(tags)
      ? tags
      : tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];
    if (Array.isArray(tagList) && tagList.length > 0) {
      conditions.push(` AND EXISTS (
        SELECT 1 FROM job_post_tags jpt
        JOIN job_tags t ON t.id = jpt.tag_id
        WHERE jpt.job_post_id = j.id AND t.name = ANY($${idx})
      )`);
      values.push(tagList); // Array of tag names
      idx += 1;
    }

    if (archive) {
      conditions.push(` AND j.archived_at IS NOT NULL`); // Archived
    } else {
      conditions.push(` AND j.archived_at IS NULL`); // Not archived
    }

    // if (!self) {
    //   conditions.push(` AND j.status_id < 3`); // Only open-closed job posts
    // }

    if (exclude_id !== undefined && exclude_id !== null && exclude_id !== "") {
      conditions.push(` AND j.id <> $${idx}`);
      values.push(exclude_id);
      idx += 1;
    }

    // 🎯 Filter jobs by matching skills (Recommendations) when worker has skills
    // Only apply if recommendations flag is true (default) and user_id is provided
    if (recommendations !== false && user_id !== undefined && user_id !== null && user_id !== "") {
      try {
        const workerSkillsResult = await this.workerSkillsQuery.getAllByWorkerId(user_id);
        
        if (!workerSkillsResult.err && workerSkillsResult.data && workerSkillsResult.data.length > 0) {
          // Worker has skills, so filter to only show jobs that have at least one matching skill
          const skillIds = workerSkillsResult.data.map(skill => skill.skill_id);
          
          // Build condition to show only jobs that have at least one skill match
          conditions.push(` AND EXISTS (
            SELECT 1 FROM job_post_skills jps_filter
            WHERE jps_filter.job_post_id = j.id 
            AND jps_filter.skill_id = ANY($${idx}::uuid[])
          )`);
          values.push(skillIds);
          idx += 1;
          
          logger.info(ctx, "getJobPostsLogic", `Worker ${user_id} has ${skillIds.length} skills - filtering recommendations`);
        }
      } catch (error) {
        logger.error(ctx, "getJobPostsLogic", "Error fetching worker skills", error);
        // Continue without skill filtering if there's an error
      }
    } else if (recommendations === false && user_id) {
      logger.info(ctx, "getJobPostsLogic", `Worker ${user_id} disabled recommendations - showing all jobs`);
    }

    const sortableColumns = {
      title: "j.title",
      location: "j.location",
      salary_min: "j.salary_min",
      salary_max: "j.salary_max",
      created_at: "j.created_at",
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const conditionsString = conditions.join("\n");

    const count = await this.query.countAllJobPosts(conditionsString, values);
    // //console.log(count);
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
    let finalData = data;
    if (user_id !== undefined && user_id !== null && user_id !== "") {
      finalData = { ...data, user_id };
    }
    console.log("finalData", finalData)
    const jobposts = await this.query.findAll(finalData);

    if (jobposts.err) {
      logger.error(ctx, "getJobposts", "Can not find jobposts", jobposts.err);
      return wrapper.error(new NotFoundError("Can not find jobposts"));
    }

    logger.info(ctx, "getJobposts", "Get Jobposts", finalData);
    return wrapper.paginationData(jobposts.data, jobposts.meta);
  }

  async getJobpostById(payload) {
    const { id, user_id } = payload;
    const jobpost = await this.query.findOneByJobpostsId(id, user_id ?? null);

    if (jobpost.err) {
      logger.error(ctx, "getJobpostById", "Job Post Query", jobpost.err);
      return wrapper.error(new NotFoundError("Can not find the job post"));
    }

    // Fetch requirements, benefits, and responsibilities
    const RequirementsQuery = require("../../../job_post_requirements/repositories/queries/query");
    const BenefitsQuery = require("../../../job_post_benefits/repositories/queries/query");
    const ResponsibilitiesQuery = require("../../../job_post_responsibilities/repositories/queries/query");
    
    const requirementsQuery = new RequirementsQuery(this.query.db);
    const benefitsQuery = new BenefitsQuery(this.query.db);
    const responsibilitiesQuery = new ResponsibilitiesQuery(this.query.db);

    const questionParams = {
      job_post_id: id,
      conditions: "",
      orderColumn: "q.order_index",
      orderDirection: "ASC",
      idx: 2,
      values: [id],
      limit: 1000,
      page: 1,
    };

    const [requirementsResult, benefitsResult, responsibilitiesResult, questionsResult] = await Promise.all([
      requirementsQuery.getAllByJobPostId(id),
      benefitsQuery.getAllByJobPostId(id),
      responsibilitiesQuery.getAllByJobPostId(id),
      this.query.findAllByJobPostId(questionParams),
    ]);

    const jobPostData = {
      ...jobpost.data,
      requirements: !requirementsResult.err ? requirementsResult.data : [],
      benefits: !benefitsResult.err ? benefitsResult.data : [],
      responsibilities: !responsibilitiesResult.err ? responsibilitiesResult.data : [],
      questions: !questionsResult.err ? questionsResult.data : [],
    };

    logger.info(ctx, "getJobpostById", "Job Post Query", payload);
    
    return wrapper.data(jobPostData);
  }

  async getAppliedJobposts(payload) {
    const {
      worker_id,
      status,
      employment_type,
      experience_level,
      salary_type,
      location,
      province, // 🌍 Province name filter
      city, // 🌍 City name filter
      salary_min,
      salary_max,
      currency,
      created_after,
      created_before,
      search, // Full-text search term
      tags,
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 10,
    } = payload;
    const conditions = [];
    const values = [];
    let idx = 1;

    conditions.push(` AND ja.worker_id = $${idx}`);
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
      conditions.push(` AND j.location ILIKE '%' || $${idx} || '%'`);
      values.push(location);
      idx += 1;
    }

    // 🌍 Filter by province name
    if (province !== undefined && province !== null && province !== "") {
      conditions.push(` AND j.province ILIKE $${idx}`);
      values.push(province);
      idx += 1;
    }

    // 🌍 Filter by city name
    if (city !== undefined && city !== null && city !== "") {
      conditions.push(` AND j.city ILIKE $${idx}`);
      values.push(city);
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
      conditions.push(` AND j.created_at >= $${idx}`);
      values.push(created_after);
      idx += 1;
    }

    if (
      created_before !== undefined &&
      created_before !== null &&
      created_before !== ""
    ) {
      conditions.push(` AND j.created_at <= $${idx}`);
      values.push(created_before);
      idx += 1;
    }

    // 🔍 Full-text search on title & description
    if (
      search !== undefined &&
      search !== null &&
      search !== "" &&
      search.length >= 2
    ) {
      if (search.length >= 3) {
        conditions.push(`
          AND (
            -- ✅ Full-text search (stemmed)
            (
              to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.description, ''))
              @@ websearch_to_tsquery('english', lower($${idx}) || ':*')
            )
            OR
            -- ✅ Fallback: ILIKE (substring) untuk semua kasus, terutama yang pendek
            (
              LOWER(j.title || ' ' || COALESCE(j.description, '')) ILIKE '%' || lower($${idx}) || '%'
            )
          )
        `);
        values.push(search);
        idx += 1;
      } else {
        conditions.push(`
          AND LOWER(j.title || ' ' || COALESCE(j.description, '')) ILIKE '%' || lower($${idx}) || '%'
        `);
        values.push(search);
        idx += 1;
      }
    }

    const tagList = Array.isArray(tags)
      ? tags
      : tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];
    if (Array.isArray(tagList) && tagList.length > 0) {
      conditions.push(` AND EXISTS (
        SELECT 1 FROM job_post_tags jpt
        JOIN tags t ON t.id = jpt.tag_id
        WHERE jpt.job_post_id = j.id AND t.name = ANY($${idx})
      )`);
      values.push(tagList); // Array of tag names
      idx += 1;
    }

    const sortableColumns = {
      title: "j.title",
      location: "j.location",
      salary_min: "j.salary_min",
      salary_max: "j.salary_max",
      created_at: "j.created_at",
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const count = await this.query.countAllJobPosts(conditions, values);
    const totalData = count.data.rowCount;

    const data = {
      conditions: conditions.join(" "),
      orderColumn,
      orderDirection,
      idx,
      values,
      limit,
      page,
      totalData,
    };
    const jobposts = await this.query.findAppliedJobs(data);

    if (jobposts.err) {
      logger.error(ctx, "getJobposts", "Can not find jobposts", jobposts.err);
      return wrapper.error(new NotFoundError("Can not find jobposts"));
    }

    logger.info(ctx, "getJobposts", "Get Jobposts", data);
    return wrapper.paginationData(jobposts.data, jobposts.meta);
  }

  async getJobpostQuestions(payload, ctx) {
    try {
      const {
        job_post_id,
        question_type,
        is_required,
        order_index_min,
        order_index_max,
        created_after,
        created_before,
        search,
        sort_by = "order_index",
        sort_order = "asc",
        page = 1,
        limit = 10,
      } = payload;

      if (!job_post_id) {
        return wrapper.error(new BadRequestError("job_post_id is required"));
      }

      const conditions = [];
      const values = [job_post_id];
      let idx = 2; // $1 dipakai untuk job_post_id

      if (question_type) {
        conditions.push(` AND qt.name = $${idx}`);
        values.push(question_type);
        idx += 1;
      }

      if (typeof is_required === "boolean") {
        conditions.push(` AND q.is_required = $${idx}`);
        values.push(is_required);
        idx += 1;
      }

      if (
        order_index_min !== undefined &&
        order_index_min !== null &&
        order_index_min !== ""
      ) {
        conditions.push(` AND q.order_index >= $${idx}`);
        values.push(order_index_min);
        idx += 1;
      }

      if (
        order_index_max !== undefined &&
        order_index_max !== null &&
        order_index_max !== ""
      ) {
        conditions.push(` AND q.order_index <= $${idx}`);
        values.push(order_index_max);
        idx += 1;
      }

      if (created_after) {
        conditions.push(` AND q.created_at >= $${idx}`);
        values.push(created_after);
        idx += 1;
      }

      if (created_before) {
        conditions.push(` AND q.created_at <= $${idx}`);
        values.push(created_before);
        idx += 1;
      }

      if (search && search.trim() !== "") {
        conditions.push(`
                AND (
                to_tsvector('english', COALESCE(q.question_text, ''))
                @@ websearch_to_tsquery('english', lower($${idx}) || ':*')
                OR LOWER(q.question_text) ILIKE '%' || lower($${idx}) || '%'
                )
            `);
        values.push(`${search}:*`);
        idx += 1;
      }

      const sortableColumns = {
        order_index: "q.order_index",
        created_at: "q.created_at",
        updated_at: "q.updated_at",
        question_text: "q.question_text",
      };

      const orderColumn =
        sortableColumns[sort_by] || sortableColumns.order_index;
      const orderDirection =
        sort_order.toLowerCase() === "desc" ? "DESC" : "ASC";

      const data = {
        job_post_id,
        conditions: conditions.join(" "),
        orderColumn,
        orderDirection,
        idx,
        values,
        limit,
        page,
      };

      const questions = await this.query.findAllByJobPostId(data);

      if (questions.err) {
        logger.error(
          ctx,
          "getJobpostQuestions",
          "Cannot find questions",
          questions.err,
        );
        return wrapper.error(new NotFoundError("Cannot find questions"));
      }

      logger.info(ctx, "getJobpostQuestions", "Get Jobpost Questions", data);
      return wrapper.paginationData(questions.data, questions.meta);
    } catch (err) {
      logger.error(ctx, "getJobpostQuestions", "Error get questions", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }
  async getCurrencyByCode(payload, ctx) {
    const { code } = payload ?? "";
    ////console.log("code", code);

    // if (!code) {
    // }

    const currency = await this.query.findCurrency(
      { code },
      { id: 1, code: 1, name: 1, symbol: 1 },
    );
    ////console.log("currency", currency);

    if (currency.err) {
      const list = await this.query.findCurrency(
        { code: "" },
        { id: 1, code: 1, name: 1, symbol: 1 },
      );

      if (list.err) {
        logger.error(ctx, "getCurrency", "Cannot load currencies", list.err);
        return wrapper.error(new NotFoundError("Unable to load currencies"));
      }

      logger.info(ctx, "getCurrency", "Get currencies list");
      return wrapper.data(list.data);
    }

    logger.info(ctx, "getCurrencyByCode", "Get currency", payload);
    return wrapper.data(currency.data);
  }

  async getCategoriesByName(payload) {
    const { name } = payload ?? "";
    //console.log(name);
    const jobtag = await this.query.findCategories(
      { name },
      { id: 1, name: 1 },
    );
    if (jobtag.err) {
      logger.error(ctx, "getTagByName", "Can not find tag", jobtag.err);
      return wrapper.error(new NotFoundError("Can not find tag"));
    }

    logger.info(ctx, "getTagByName", "Get job tag", payload);
    return wrapper.data(jobtag.data);
  }

  async getJobApplicants(payload) {
    const { job_post_id } = payload;

    const applicants = await this.query.findJobApplicants({
      job_post_id,
    });

    if (applicants.err) {
      logger.error(
        ctx,
        "getJobApplicants",
        "Can not find applicants",
        applicants.err,
      );
      return wrapper.error(new NotFoundError("Applicants not found"));
    }

    logger.info(ctx, "getJobApplicants", "Get job applicants", payload);
    return wrapper.data(applicants.data);
  }
  async getWorkerByApplication(payload) {
    const { id, recruiter_id } = payload;

    // 1. Ambil application + recruiter owner
    const application = await this.query.findOneJobApplication({
      id,
    });

    if (application.err || !application.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    if (application.data.recruiter_id !== recruiter_id) {
      return wrapper.error(
        new ForbiddenError("You are not allowed to access this worker"),
      );
    }

    // 2. Ambil worker detail
    const worker = await this.query.findWorkerByApplicationId({ id });

    if (worker.err) {
      logger.error(
        ctx,
        "getWorkerByApplication",
        "Worker not found",
        worker.err,
      );
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    // 3. Ambil answers untuk application ini
    const answersResult = await this.query.findAnswersByApplicationId({ id });
    
    const workerData = {
      ...worker.data,
      answers: !answersResult.err && answersResult.data ? answersResult.data : [],
    };

    logger.info(ctx, "getWorkerByApplication", "Get worker detail", payload);
    return wrapper.data(workerData);
  }
}

module.exports = Jobposts;
