const wrapper = require("../../../../helpers/utils/wrapper");
const DB = require("../../../../helpers/databases/postgresql/db");
const config = require("../../../../config/global_config");
const { NotFoundError } = require("../../../../helpers/errors");
const { LOOKUP_CONFIG } = require("../../helpers/lookup_config");
const { PLAN_CONFIG } = require("../../helpers/plan_config");
const { ListQueryBuilder, buildOrderClause } = require("../../helpers/list_query");

class AdminQuery {
  constructor() {
    this.db = new DB(config.get("/postgresqlUrl"));
  }

  async getDashboardStats() {
    const totalUsers = await this.db.countData({}, "users");
    const totalRecruiters = await this.db.countData({}, "recruiters");
    const totalJobs = await this.db.countData({}, "job_posts");
    const totalApplications = await this.db.countData({}, "job_applications");
    const totalWorkers = await this.db.countData({}, "workers");
    
    return wrapper.data({
        users: totalUsers.data || 0,
        recruiters: totalRecruiters.data || 0,
        job_posts: totalJobs.data || 0,
        job_applications: totalApplications.data || 0,
        workers: totalWorkers.data || 0
    });
  }

  async getSystemSettings() {
    const result = await this.db.executeQuery(
      `SELECT setting_key, setting_value FROM system_settings`
    );
    const settings = {};
    for (const row of result?.rows || []) {
      const key = row.setting_key;
      const val = row.setting_value;
      if (val === "true" || val === "false") {
        settings[key] = val === "true";
      } else if (val !== null && val !== undefined && !Number.isNaN(Number(val)) && String(val).trim() !== "") {
        const asNum = Number(val);
        settings[key] = Number.isInteger(asNum) && !String(val).includes(".") ? asNum : val;
      } else {
        settings[key] = val;
      }
    }
    return wrapper.data(settings);
  }

  /**
   * Trust & Safety KPIs for superadmin dashboard.
   */
  async getDashboardTrustStats() {
    const q = async (sql) => {
      const r = await this.db.executeQuery(sql);
      return parseInt(r?.rows?.[0]?.count || 0, 10);
    };

    const [
      open_fraud_events,
      open_chat_reports,
      jobs_needs_review,
      pending_jobs,
      suspended_users,
      unverified_employers,
    ] = await Promise.all([
      q(`SELECT COUNT(*) FROM fraud_events WHERE status IN ('open', 'reviewing')`),
      q(`SELECT COUNT(*) FROM chat_reports WHERE status = 'open'`),
      q(`
        SELECT COUNT(DISTINCT j.id)
        FROM job_posts j
        WHERE j.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM fraud_events fe
            WHERE fe.entity_type = 'job_post'
              AND fe.entity_id = j.id
              AND fe.status IN ('open', 'reviewing')
          )
      `),
      q(`
        SELECT COUNT(*) FROM job_posts j
        JOIN job_post_statuses s ON s.id = j.status_id
        WHERE j.deleted_at IS NULL AND UPPER(s.name) = 'PENDING'
      `),
      q(`SELECT COUNT(*) FROM users WHERE is_suspended = TRUE AND deleted_at IS NULL`),
      q(`SELECT COUNT(*) FROM recruiters WHERE is_verified = FALSE AND deleted_at IS NULL`),
    ]);

    return wrapper.data({
      open_fraud_events,
      open_chat_reports,
      jobs_needs_review,
      pending_jobs,
      suspended_users,
      unverified_employers,
    });
  }

  async getUsers(payload) {
    const { page, limit, search, sort_by, sort_order, role_id, is_suspended, deleted_state, needs_review } = payload;

    const openFraudExistsSql = `
      SELECT 1 FROM fraud_events fe
      WHERE fe.entity_type = 'user'
        AND fe.entity_id = u.id
        AND fe.status IN ('open', 'reviewing')
    `;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, [], ["u.username", "u.email"]);
    builder.addEquals("u.role_id", role_id);
    builder.addEquals("u.is_suspended", is_suspended);
    builder.addDeletedState("u.deleted_at", deleted_state);
    if (needs_review !== undefined && needs_review !== null && needs_review !== "") {
      builder.addExists(openFraudExistsSql, needs_review);
    }

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      created_at: "u.created_at",
      updated_at: "u.updated_at",
      role_id: "u.role_id",
      is_suspended: "u.is_suspended",
      needs_review: "needs_review",
    }, sort_by, sort_order, "created_at", "u.id");
    const offset = limit * (page - 1);

    const rawQuery = `
      SELECT u.id, u.username, u.email, u.login_provider, u.role_id, u.is_suspended, u.created_at, u.updated_at, u.deleted_at,
             EXISTS (${openFraudExistsSql}) AS needs_review,
             (
               SELECT fe.id FROM fraud_events fe
               WHERE fe.entity_type = 'user'
                 AND fe.entity_id = u.id
                 AND fe.status IN ('open', 'reviewing')
               ORDER BY fe.risk_score DESC, fe.created_at DESC
               LIMIT 1
             ) AS open_fraud_event_id
      FROM users u
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `SELECT COUNT(*) FROM users u ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    const rows = (result?.rows || []).map((row) => ({
      ...row,
      needs_review: Boolean(row.needs_review),
    }));

    return wrapper.paginationData(rows, {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getEmployers(payload) {
    const { page, limit, search, sort_by, sort_order, is_verified, industry_id, deleted_state, needs_review } = payload;

    const openFraudExistsSql = `
      SELECT 1 FROM fraud_events fe
      WHERE fe.status IN ('open', 'reviewing')
        AND (
          (fe.entity_type = 'user' AND fe.entity_id = r.user_id)
          OR (
            fe.entity_type = 'job_post'
            AND EXISTS (
              SELECT 1 FROM job_posts jp
              WHERE jp.id = fe.entity_id AND jp.recruiter_id = r.id
            )
          )
          OR (
            fe.entity_type = 'payment_order'
            AND EXISTS (
              SELECT 1 FROM payment_orders po
              WHERE po.id = fe.entity_id AND po.recruiter_id = r.id
            )
          )
        )
    `;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, [], ["r.company_name", "r.contact_name", "r.contact_phone", "u.email", "u.username"]);
    builder.addEquals("r.is_verified", is_verified);
    builder.addEquals("r.industry_id", industry_id);
    builder.addDeletedState("r.deleted_at", deleted_state);
    if (needs_review !== undefined && needs_review !== null && needs_review !== "") {
      builder.addExists(openFraudExistsSql, needs_review);
    }

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      created_at: "r.created_at",
      updated_at: "r.updated_at",
      is_verified: "r.is_verified",
      is_vip: "r.is_vip",
      needs_review: "needs_review",
    }, sort_by, sort_order, "created_at", "r.id");
    const offset = limit * (page - 1);

    const rawQuery = `
      SELECT r.id, r.user_id, r.company_name, r.contact_name, r.contact_phone, r.is_vip, r.is_verified, r.created_at, r.updated_at, r.deleted_at,
             u.email as user_email, u.username as user_username,
             EXISTS (${openFraudExistsSql}) AS needs_review,
             (
               SELECT fe.id FROM fraud_events fe
               WHERE fe.status IN ('open', 'reviewing')
                 AND (
                   (fe.entity_type = 'user' AND fe.entity_id = r.user_id)
                   OR (
                     fe.entity_type = 'job_post'
                     AND EXISTS (
                       SELECT 1 FROM job_posts jp
                       WHERE jp.id = fe.entity_id AND jp.recruiter_id = r.id
                     )
                   )
                   OR (
                     fe.entity_type = 'payment_order'
                     AND EXISTS (
                       SELECT 1 FROM payment_orders po
                       WHERE po.id = fe.entity_id AND po.recruiter_id = r.id
                     )
                   )
                 )
               ORDER BY fe.risk_score DESC, fe.created_at DESC
               LIMIT 1
             ) AS open_fraud_event_id
      FROM recruiters r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `
      SELECT COUNT(*)
      FROM recruiters r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    const rows = (result?.rows || []).map((row) => ({
      ...row,
      needs_review: Boolean(row.needs_review),
    }));

    return wrapper.paginationData(rows, {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getJobs(payload) {
    const {
      page,
      limit,
      search,
      sort_by,
      sort_order,
      status,
      recruiter_id,
      needs_review,
    } = payload;

    const openFraudExistsSql = `
      SELECT 1 FROM fraud_events fe
      WHERE fe.entity_type = 'job_post'
        AND fe.entity_id = j.id
        AND fe.status IN ('open', 'reviewing')
    `;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, ["j.title", "j.location"], ["r.company_name"]);
    builder.addEqualsInsensitive("s.name", status);
    builder.addEquals("j.recruiter_id", recruiter_id);
    if (needs_review !== undefined && needs_review !== null && needs_review !== "") {
      builder.addExists(openFraudExistsSql, needs_review);
    }

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      created_at: "j.created_at",
      updated_at: "j.updated_at",
      title: "j.title",
      needs_review: "needs_review",
    }, sort_by, sort_order, "created_at", "j.id");
    const offset = limit * (page - 1);

    const joins = `
      JOIN recruiters r ON j.recruiter_id = r.id
      JOIN job_post_statuses s ON j.status_id = s.id
    `;

    const rawQuery = `
      SELECT
        j.id,
        j.title,
        j.location,
        j.is_remote,
        r.company_name,
        s.name as status,
        j.created_at,
        j.updated_at,
        j.deleted_at,
        EXISTS (${openFraudExistsSql}) AS needs_review,
        (
          SELECT fe.id FROM fraud_events fe
          WHERE fe.entity_type = 'job_post'
            AND fe.entity_id = j.id
            AND fe.status IN ('open', 'reviewing')
          ORDER BY fe.risk_score DESC, fe.created_at DESC
          LIMIT 1
        ) AS open_fraud_event_id
      FROM job_posts j
      ${joins}
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `
      SELECT COUNT(*)
      FROM job_posts j
      ${joins}
      ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    const rows = (result?.rows || []).map((row) => ({
      ...row,
      needs_review: Boolean(row.needs_review),
    }));

    return wrapper.paginationData(rows, {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getApplications(payload) {
    const { page, limit, search, sort_by, sort_order, application_status_id } = payload;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, ["jp.title"], ["u.name"]);
    builder.addEquals("a.application_status_id", application_status_id);

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      applied_at: "a.applied_at",
      updated_at: "a.updated_at",
      job_title: "jp.title"
    }, sort_by, sort_order, "applied_at", "a.id");
    const offset = limit * (page - 1);

    const joins = `
      JOIN job_posts jp ON a.job_post_id = jp.id
      JOIN workers u ON a.worker_id = u.id
      JOIN application_statuses s ON a.application_status_id = s.id
    `;

    const rawQuery = `
      SELECT a.id, jp.title as job_title, u.name as worker_name, s.name as status, a.applied_at, a.updated_at, a.deleted_at
      FROM job_applications a
      ${joins}
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `
      SELECT COUNT(*)
      FROM job_applications a
      ${joins}
      ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getDashboardGrowth() {
    const rawQuery = `
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS name, COUNT(*) AS users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC;
    `;
    const result = await this.db.executeQuery(rawQuery);
    if (!result || !result.rows) return wrapper.data([]);
    return wrapper.data(result.rows.map(r => ({ name: r.name, users: parseInt(r.users) })));
  }

  async getDashboardJobDistribution() {
    const rawQuery = `
      SELECT s.name, COUNT(j.id) AS value
      FROM job_posts j
      JOIN job_post_statuses s ON j.status_id = s.id
      GROUP BY s.name;
    `;
    const result = await this.db.executeQuery(rawQuery);
    if (!result || !result.rows) return wrapper.data([]);
    return wrapper.data(result.rows.map(r => ({ name: r.name, value: parseInt(r.value) })));
  }

  async getDashboardActivities() {
    const rawQuery = `
      SELECT 'USER' as type, username as name, created_at
      FROM users
      UNION ALL
      SELECT 'EMPLOYER' as type, company_name as name, created_at
      FROM recruiters
      UNION ALL
      SELECT 'JOB' as type, title as name, created_at
      FROM job_posts
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const result = await this.db.executeQuery(rawQuery);
    if (!result || !result.rows) return wrapper.data([]);
    
    const data = result.rows.map((r, i) => {
      let message = "";
      if (r.type === 'USER') message = `User ${r.name} registered`;
      else if (r.type === 'EMPLOYER') message = `Employer ${r.name} registered`;
      else if (r.type === 'JOB') message = `Job ${r.name} posted`;

      const diff = Math.floor((new Date() - new Date(r.created_at)) / 1000);
      let timeStr = "";
      if (diff < 60) timeStr = diff + " secs ago";
      else if (diff < 3600) timeStr = Math.floor(diff/60) + " mins ago";
      else if (diff < 86400) timeStr = Math.floor(diff/3600) + " hours ago";
      else timeStr = Math.floor(diff/86400) + " days ago";
      
      return {
        id: (i + 1).toString(),
        message,
        time: timeStr,
        type: r.type
      };
    });
    
    return wrapper.data(data);
  }

  async getAuditLogs(payload) {
    const { page, limit, search, sort_by, sort_order, action, date_from, date_to } = payload;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, ["a.action", "a.ip_address"], ["u.username"]);
    builder.addEqualsInsensitive("a.action", action);
    builder.addDateRange("a.created_at", date_from, date_to);

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      created_at: "a.created_at",
      action: "a.action"
    }, sort_by, sort_order, "created_at", "a.id");
    const offset = limit * (page - 1);

    const rawQuery = `
      SELECT a.id, a.user_id, u.username, a.action, a.ip_address, a.user_agent, a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `SELECT COUNT(*) FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getLookupTable(payload) {
    const { table, search } = payload;

    if (!LOOKUP_CONFIG[table]) {
      return wrapper.error(new NotFoundError("Invalid lookup table"));
    }

    const { column, select } = LOOKUP_CONFIG[table];
    let whereQuery = "";
    const values = [];
    if (search) {
      whereQuery = `WHERE ${column} ILIKE $1`;
      values.push(`%${search}%`);
    }

    const rawQuery = `SELECT ${select} FROM ${table} ${whereQuery} ORDER BY id ASC`;
    const result = await this.db.executeQuery(rawQuery, values);
    return wrapper.data(result.rows);
  }

  // ==================== WORKER SUB-RESOURCES ====================
  async findWorker(worker_id) {
    const worker = await this.db.findOne({ id: worker_id }, { id: 1 }, "workers");
    if (worker.err) return null;
    return worker.data;
  }

  async getWorkerWorkExperiences(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT id, company_name, job_title, start_date, end_date, is_current, description, created_at, updated_at
      FROM work_experiences
      WHERE worker_id = $1
      ORDER BY start_date DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerEducations(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT id, institution_name, degree, major, start_date, end_date, is_current, description, created_at, updated_at
      FROM educations
      WHERE worker_id = $1
      ORDER BY start_date DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerCertifications(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT id, name, issuer, link, credential_id, issue_date, expiry_date, is_active, created_at, updated_at
      FROM certifications
      WHERE worker_id = $1
      ORDER BY issue_date DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerPortfolios(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT id, title, link, description, is_public, created_at, updated_at
      FROM portfolios
      WHERE worker_id = $1
      ORDER BY updated_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerLanguages(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT wl.id, wl.language_name, wl.language_id, wl.proficiency_level_id,
             pl.name AS proficiency_level_name, wl.is_primary, wl.updated_at
      FROM worker_languages wl
      LEFT JOIN proficiency_levels pl ON pl.id = wl.proficiency_level_id
      WHERE wl.worker_id = $1
      ORDER BY wl.updated_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerResumes(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT id, resume_url, title, is_default, created_at, updated_at
      FROM resumes
      WHERE worker_id = $1
      ORDER BY updated_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerSkills(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT ws.skill_id, s.skill_name, ws.created_at
      FROM worker_skills ws
      JOIN skills s ON ws.skill_id = s.id
      WHERE ws.worker_id = $1
      ORDER BY s.skill_name ASC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerApplications(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT a.id, a.job_post_id, jp.title AS job_title, r.company_name,
             a.application_status_id, s.name AS status_name,
             a.resume_id, a.cover_letter, a.applied_at, a.updated_at
      FROM job_applications a
      JOIN job_posts jp ON a.job_post_id = jp.id
      JOIN recruiters r ON jp.recruiter_id = r.id
      JOIN application_statuses s ON a.application_status_id = s.id
      WHERE a.worker_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.applied_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerJobPostAnswers(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT ans.id, ans.job_application_id, ans.question_id,
             q.question_text AS question, jp.title AS job_title,
             ans.answer, ans.submitted_at
      FROM job_post_answers ans
      JOIN job_applications a ON ans.job_application_id = a.id
      JOIN job_post_questions q ON ans.question_id = q.id
      JOIN job_posts jp ON a.job_post_id = jp.id
      WHERE a.worker_id = $1
      ORDER BY ans.submitted_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerSavedJobs(payload) {
    const { worker_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const rawQuery = `
      SELECT sj.id, sj.job_post_id, jp.title AS job_title, r.company_name, sj.created_at
      FROM saved_jobs sj
      JOIN job_posts jp ON sj.job_post_id = jp.id
      JOIN recruiters r ON jp.recruiter_id = r.id
      WHERE sj.worker_id = $1
      ORDER BY sj.created_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id]);
    return wrapper.data(result?.rows || []);
  }

  // ==================== EMPLOYER SUB-RESOURCES ====================
  async findEmployer(employer_id) {
    const employer = await this.db.findOne({ id: employer_id }, { id: 1 }, "recruiters");
    if (employer.err) return null;
    return employer.data;
  }

  async getEmployerJobPosts(payload) {
    const { employer_id } = payload;
    if (!(await this.findEmployer(employer_id))) return wrapper.error(new NotFoundError("Employer not found"));

    const rawQuery = `
      SELECT jp.id, jp.title, jp.city, jp.province, s.name AS status_name, jp.created_at
      FROM job_posts jp
      JOIN job_post_statuses s ON jp.status_id = s.id
      WHERE jp.recruiter_id = $1 AND jp.deleted_at IS NULL
      ORDER BY jp.created_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [employer_id]);
    return wrapper.data(result?.rows || []);
  }

  async getEmployerSubscriptions(payload) {
    const { employer_id } = payload;
    if (!(await this.findEmployer(employer_id))) return wrapper.error(new NotFoundError("Employer not found"));

    const rawQuery = `
      SELECT rs.id, rs.plan_id, sp.display_name AS plan_display_name, sp.price_idr,
             rs.payment_order_id, rs.starts_at, rs.expires_at, rs.is_active, rs.created_at, rs.updated_at
      FROM recruiter_subscriptions rs
      JOIN subscription_plans sp ON rs.plan_id = sp.id
      WHERE rs.recruiter_id = $1
      ORDER BY rs.created_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [employer_id]);
    return wrapper.data(result?.rows || []);
  }

  async getEmployerPaymentOrders(payload) {
    const { employer_id } = payload;
    if (!(await this.findEmployer(employer_id))) return wrapper.error(new NotFoundError("Employer not found"));

    const rawQuery = `
      SELECT po.id, po.order_type, po.plan_id, po.plan_type, po.job_post_id,
             po.xendit_invoice_id, po.xendit_external_id, po.amount, po.status,
             po.paid_at, po.invoice_expires_at, po.created_at, po.updated_at,
             COALESCE(sp.display_name, spp.display_name, bp.display_name) AS plan_name
      FROM payment_orders po
      LEFT JOIN subscription_plans sp ON po.plan_type = 'subscription_plans' AND po.plan_id = sp.id
      LEFT JOIN single_post_plans spp ON po.plan_type = 'single_post_plans' AND po.plan_id = spp.id
      LEFT JOIN boost_plans bp ON po.plan_type = 'boost_plans' AND po.plan_id = bp.id
      WHERE po.recruiter_id = $1
      ORDER BY po.created_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [employer_id]);
    return wrapper.data(result?.rows || []);
  }

  // ==================== CHAT MODERATION ====================
  // conversations.worker_id/recruiter_id ber-FK ke users.id, jadi resolve user_id dari profil dulu
  async getConversationsByUserId(userId) {
    const rawQuery = `
      SELECT c.id, c.worker_id, c.recruiter_id, c.job_id,
             w.name AS worker_name, r.company_name, jp.title AS job_title,
             c.last_message, c.last_message_at, c.status, c.updated_at
      FROM conversations c
      LEFT JOIN workers w ON w.user_id = c.worker_id
      LEFT JOIN recruiters r ON r.user_id = c.recruiter_id
      LEFT JOIN job_posts jp ON jp.id = c.job_id
      WHERE c.worker_id = $1 OR c.recruiter_id = $1
      ORDER BY c.updated_at DESC
    `;
    const result = await this.db.executeQuery(rawQuery, [userId]);
    return wrapper.data(result?.rows || []);
  }

  async getWorkerConversations(payload) {
    const { worker_id } = payload;
    const worker = await this.db.findOne({ id: worker_id }, { id: 1, user_id: 1 }, "workers");
    if (worker.err) return wrapper.error(new NotFoundError("Worker not found"));
    return this.getConversationsByUserId(worker.data.user_id);
  }

  async getEmployerConversations(payload) {
    const { employer_id } = payload;
    const employer = await this.db.findOne({ id: employer_id }, { id: 1, user_id: 1 }, "recruiters");
    if (employer.err) return wrapper.error(new NotFoundError("Employer not found"));
    return this.getConversationsByUserId(employer.data.user_id);
  }

  async getConversationMessages(payload) {
    const { id } = payload;
    const conversation = await this.db.findOne({ id }, { id: 1 }, "conversations");
    if (conversation.err) return wrapper.error(new NotFoundError("Conversation not found"));

    const rawQuery = `
      SELECT m.id, m.sender_id, u.role_id,
             COALESCE(w.name, r.company_name, u.username) AS sender_name,
             m.message, m.type, m.is_read, m.created_at
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN workers w ON w.user_id = u.id
      LEFT JOIN recruiters r ON r.user_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    return wrapper.data(result?.rows || []);
  }

  // ==================== PAYMENT ORDERS ====================
  async getPaymentOrders(payload) {
    const { page, limit, search, sort_by, sort_order, status, order_type, needs_review } = payload;

    const openFraudExistsSql = `
      SELECT 1 FROM fraud_events fe
      WHERE fe.entity_type = 'payment_order'
        AND fe.entity_id = po.id
        AND fe.status IN ('open', 'reviewing')
    `;

    const builder = new ListQueryBuilder();
    builder.addSearch(
      search,
      [
        "po.xendit_external_id",
        "po.xendit_invoice_id",
        "COALESCE(sp.display_name, spp.display_name, bp.display_name)"
      ],
      ["r.company_name"]
    );
    builder.addEquals("po.status", status);
    builder.addEquals("po.order_type", order_type);
    if (needs_review !== undefined && needs_review !== null && needs_review !== "") {
      builder.addExists(openFraudExistsSql, needs_review);
    }

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      created_at: "po.created_at",
      updated_at: "po.updated_at",
      amount: "po.amount",
      paid_at: "po.paid_at",
      status: "po.status",
      needs_review: "needs_review",
    }, sort_by, sort_order, "created_at", "po.id");
    const offset = limit * (page - 1);

    const planJoin = `
      LEFT JOIN subscription_plans sp ON po.plan_type = 'subscription_plans' AND po.plan_id = sp.id
      LEFT JOIN single_post_plans spp ON po.plan_type = 'single_post_plans' AND po.plan_id = spp.id
      LEFT JOIN boost_plans bp ON po.plan_type = 'boost_plans' AND po.plan_id = bp.id
    `;

    const rawQuery = `
      SELECT po.id, po.recruiter_id, po.order_type, po.plan_id, po.plan_type, po.job_post_id,
             po.xendit_invoice_id, po.xendit_external_id, po.amount, po.status,
             po.paid_at, po.invoice_expires_at, po.created_at, po.updated_at,
             r.company_name,
             COALESCE(sp.display_name, spp.display_name, bp.display_name) AS plan_name,
             EXISTS (${openFraudExistsSql}) AS needs_review,
             (
               SELECT fe.id FROM fraud_events fe
               WHERE fe.entity_type = 'payment_order'
                 AND fe.entity_id = po.id
                 AND fe.status IN ('open', 'reviewing')
               ORDER BY fe.risk_score DESC, fe.created_at DESC
               LIMIT 1
             ) AS open_fraud_event_id
      FROM payment_orders po
      JOIN recruiters r ON po.recruiter_id = r.id
      ${planJoin}
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `
      SELECT COUNT(*)
      FROM payment_orders po
      JOIN recruiters r ON po.recruiter_id = r.id
      ${planJoin}
      ${whereQuery}
    `;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    const rows = (result?.rows || []).map((row) => ({
      ...row,
      needs_review: Boolean(row.needs_review),
    }));

    return wrapper.paginationData(rows, {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getPaymentOrderById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT po.id, po.recruiter_id, po.order_type, po.plan_id, po.plan_type, po.job_post_id,
             po.xendit_invoice_id, po.xendit_external_id, po.amount, po.status,
             po.paid_at, po.invoice_expires_at, po.metadata, po.created_at, po.updated_at,
             r.company_name,
             COALESCE(sp.display_name, spp.display_name, bp.display_name) AS plan_name,
             EXISTS (
               SELECT 1 FROM fraud_events fe
               WHERE fe.entity_type = 'payment_order'
                 AND fe.entity_id = po.id
                 AND fe.status IN ('open', 'reviewing')
             ) AS needs_review,
             (
               SELECT fe.id FROM fraud_events fe
               WHERE fe.entity_type = 'payment_order'
                 AND fe.entity_id = po.id
                 AND fe.status IN ('open', 'reviewing')
               ORDER BY fe.risk_score DESC, fe.created_at DESC
               LIMIT 1
             ) AS open_fraud_event_id
      FROM payment_orders po
      JOIN recruiters r ON po.recruiter_id = r.id
      LEFT JOIN subscription_plans sp ON po.plan_type = 'subscription_plans' AND po.plan_id = sp.id
      LEFT JOIN single_post_plans spp ON po.plan_type = 'single_post_plans' AND po.plan_id = spp.id
      LEFT JOIN boost_plans bp ON po.plan_type = 'boost_plans' AND po.plan_id = bp.id
      WHERE po.id = $1
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Payment order not found"));
    const row = result.rows[0];
    return wrapper.data({
      ...row,
      needs_review: Boolean(row.needs_review),
    });
  }

  // ==================== PLANS ====================
  async getPlansByType(payload) {
    const { type, search } = payload;
    const config = PLAN_CONFIG[type];
    if (!config) return wrapper.error(new NotFoundError("Invalid plan type"));

    let whereQuery = "";
    const values = [];
    if (search) {
      whereQuery = "WHERE (name ILIKE $1 OR display_name ILIKE $1)";
      values.push(`%${search}%`);
    }

    const rawQuery = `SELECT ${config.select} FROM ${config.table} ${whereQuery} ORDER BY price_idr ASC`;
    const result = await this.db.executeQuery(rawQuery, values);
    return wrapper.data(result?.rows || []);
  }

  async getAllPlans() {
    const [subscription, singlePost, boost] = await Promise.all([
      this.db.executeQuery(`SELECT ${PLAN_CONFIG.subscription.select} FROM subscription_plans ORDER BY price_idr ASC`),
      this.db.executeQuery(`SELECT ${PLAN_CONFIG.single_post.select} FROM single_post_plans ORDER BY price_idr ASC`),
      this.db.executeQuery(`SELECT ${PLAN_CONFIG.boost.select} FROM boost_plans ORDER BY price_idr ASC`)
    ]);

    return wrapper.data({
      subscription: subscription?.rows || [],
      single_post: singlePost?.rows || [],
      boost: boost?.rows || []
    });
  }

  async getUserById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT id, username, email, login_provider, role_id, is_suspended, created_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("User not found"));
    return wrapper.data(result.rows[0]);
  }

  async getWorkers(payload) {
    const { page, limit, search, sort_by, sort_order, gender_id, deleted_state } = payload;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, [], ["w.name", "w.telephone", "u.email", "u.username"]);
    builder.addEquals("w.gender_id", gender_id);
    builder.addDeletedState("w.deleted_at", deleted_state);

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause({
      created_at: "w.created_at",
      updated_at: "w.updated_at",
      gender_id: "w.gender_id"
    }, sort_by, sort_order, "created_at", "w.id");
    const offset = limit * (page - 1);

    const rawQuery = `
      SELECT w.id, w.user_id, w.name, w.avatar_url, w.telephone, w.gender_id, w.created_at, w.updated_at, w.deleted_at,
             u.email as user_email, u.username as user_username
      FROM workers w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `
      SELECT COUNT(*)
      FROM workers w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getWorkerById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT id, user_id, name, avatar_url, telephone, date_of_birth, gender_id, nationality_id, religion_id, marriage_status_id, address, profile_summary, current_salary, expected_salary, created_at
      FROM workers
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Worker not found"));
    return wrapper.data(result.rows[0]);
  }

  async getEmployerById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT r.id, r.user_id, r.company_name, r.contact_name, r.contact_phone, r.company_website, r.address, r.description, r.avatar_url,
             r.employee_count, r.instagram_url, r.tiktok_url, r.industry_id, r.is_vip, r.is_verified, r.created_at,
             EXISTS (
               SELECT 1 FROM fraud_events fe
               WHERE fe.status IN ('open', 'reviewing')
                 AND (
                   (fe.entity_type = 'user' AND fe.entity_id = r.user_id)
                   OR (
                     fe.entity_type = 'job_post'
                     AND EXISTS (
                       SELECT 1 FROM job_posts jp
                       WHERE jp.id = fe.entity_id AND jp.recruiter_id = r.id
                     )
                   )
                   OR (
                     fe.entity_type = 'payment_order'
                     AND EXISTS (
                       SELECT 1 FROM payment_orders po
                       WHERE po.id = fe.entity_id AND po.recruiter_id = r.id
                     )
                   )
                 )
             ) AS needs_review,
             (
               SELECT fe.id FROM fraud_events fe
               WHERE fe.status IN ('open', 'reviewing')
                 AND (
                   (fe.entity_type = 'user' AND fe.entity_id = r.user_id)
                   OR (
                     fe.entity_type = 'job_post'
                     AND EXISTS (
                       SELECT 1 FROM job_posts jp
                       WHERE jp.id = fe.entity_id AND jp.recruiter_id = r.id
                     )
                   )
                   OR (
                     fe.entity_type = 'payment_order'
                     AND EXISTS (
                       SELECT 1 FROM payment_orders po
                       WHERE po.id = fe.entity_id AND po.recruiter_id = r.id
                     )
                   )
                 )
               ORDER BY fe.risk_score DESC, fe.created_at DESC
               LIMIT 1
             ) AS open_fraud_event_id
      FROM recruiters r
      WHERE r.id = $1 AND r.deleted_at IS NULL
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Employer not found"));
    const row = result.rows[0];
    return wrapper.data({
      ...row,
      needs_review: Boolean(row.needs_review),
    });
  }

  async getJobById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT
        j.id,
        j.recruiter_id,
        j.title,
        j.description,
        j.requirements,
        j.benefits,
        j.location,
        j.is_remote,
        j.employment_type_id,
        j.experience_level_id,
        j.min_salary,
        j.max_salary,
        j.salary_type_id,
        j.status_id,
        j.created_at,
        r.company_name,
        EXISTS (
          SELECT 1 FROM fraud_events fe
          WHERE fe.entity_type = 'job_post'
            AND fe.entity_id = j.id
            AND fe.status IN ('open', 'reviewing')
        ) AS needs_review,
        (
          SELECT fe.id FROM fraud_events fe
          WHERE fe.entity_type = 'job_post'
            AND fe.entity_id = j.id
            AND fe.status IN ('open', 'reviewing')
          ORDER BY fe.risk_score DESC, fe.created_at DESC
          LIMIT 1
        ) AS open_fraud_event_id,
        (
          SELECT fe.risk_score FROM fraud_events fe
          WHERE fe.entity_type = 'job_post'
            AND fe.entity_id = j.id
            AND fe.status IN ('open', 'reviewing')
          ORDER BY fe.risk_score DESC, fe.created_at DESC
          LIMIT 1
        ) AS open_fraud_risk_score
      FROM job_posts j
      JOIN recruiters r ON j.recruiter_id = r.id
      WHERE j.id = $1 AND j.deleted_at IS NULL
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Job not found"));
    const row = result.rows[0];
    return wrapper.data({
      ...row,
      needs_review: Boolean(row.needs_review),
    });
  }

  // ==================== TRUST & SAFETY / FRAUD EVENTS ====================
  async getFraudEvents(payload) {
    const {
      page,
      limit,
      search,
      sort_by,
      sort_order,
      status,
      entity_type,
      source,
      date_from,
      date_to,
    } = payload;

    const builder = new ListQueryBuilder();
    builder.addSearch(search, ["fe.summary", "fe.source", "fe.entity_type"]);
    builder.addEqualsInsensitive("fe.status", status);
    builder.addEqualsInsensitive("fe.entity_type", entity_type);
    builder.addEqualsInsensitive("fe.source", source);
    builder.addDateRange("fe.created_at", date_from, date_to);

    const whereQuery = builder.whereClause();
    const orderClause = buildOrderClause(
      {
        created_at: "fe.created_at",
        risk_score: "fe.risk_score",
        status: "fe.status",
        updated_at: "fe.updated_at",
      },
      sort_by,
      sort_order,
      "created_at",
      "fe.id"
    );
    const offset = limit * (page - 1);

    const rawQuery = `
      SELECT
        fe.id,
        fe.entity_type,
        fe.entity_id,
        fe.source,
        fe.risk_score,
        fe.status,
        fe.flags,
        fe.summary,
        fe.metadata,
        fe.resolved_by,
        fe.resolved_at,
        fe.resolution_action,
        fe.resolution_note,
        fe.created_at,
        fe.updated_at,
        jp.title AS job_title,
        r.company_name,
        r.id AS recruiter_id,
        r.user_id AS recruiter_user_id
      FROM fraud_events fe
      LEFT JOIN job_posts jp
        ON fe.entity_type = 'job_post' AND fe.entity_id = jp.id
      LEFT JOIN recruiters r
        ON jp.recruiter_id = r.id
      ${whereQuery}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, builder.values);

    const countQuery = `
      SELECT COUNT(*) FROM fraud_events fe
      LEFT JOIN job_posts jp
        ON fe.entity_type = 'job_post' AND fe.entity_id = jp.id
      LEFT JOIN recruiters r
        ON jp.recruiter_id = r.id
      ${whereQuery}
    `;
    const countResult = await this.db.executeQuery(countQuery, builder.values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
      page,
      limit,
      totalData,
      totalPage: Math.ceil(totalData / limit),
    });
  }

  async getFraudEventById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT
        fe.*,
        jp.title AS job_title,
        jp.status_id AS job_status_id,
        jps.name AS job_status_name,
        r.company_name,
        r.id AS recruiter_id,
        r.user_id AS recruiter_user_id,
        ru.username AS resolved_by_username
      FROM fraud_events fe
      LEFT JOIN job_posts jp
        ON fe.entity_type = 'job_post' AND fe.entity_id = jp.id
      LEFT JOIN job_post_statuses jps ON jp.status_id = jps.id
      LEFT JOIN recruiters r ON jp.recruiter_id = r.id
      LEFT JOIN users ru ON fe.resolved_by = ru.id
      WHERE fe.id = $1
      LIMIT 1
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (!result?.rows?.length) {
      return wrapper.error(new NotFoundError("Fraud event not found"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = AdminQuery;
