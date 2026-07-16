const wrapper = require("../../../../helpers/utils/wrapper");
const DB = require("../../../../helpers/databases/postgresql/db");
const config = require("../../../../config/global_config");
const { NotFoundError } = require("../../../../helpers/errors");
const { LOOKUP_CONFIG } = require("../../helpers/lookup_config");
const { PLAN_CONFIG } = require("../../helpers/plan_config");

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

  async getUsers(payload) {
    const { page, limit, search } = payload;
    let whereQuery = "";
    let values = [];
    if (search) {
        whereQuery = "WHERE username ILIKE $1 OR email ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT id, username, email, login_provider, role_id, is_suspended, created_at, updated_at, deleted_at
      FROM users
      ${whereQuery}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM users ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);
    
    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getEmployers(payload) {
    const { page, limit, search } = payload;
    let whereQuery = "";
    let values = [];
    if (search) {
        whereQuery = "WHERE r.company_name ILIKE $1 OR r.contact_name ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT r.id, r.user_id, r.company_name, r.contact_name, r.contact_phone, r.is_vip, r.is_verified, r.created_at, r.updated_at, r.deleted_at,
             u.email as user_email, u.username as user_username
      FROM recruiters r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereQuery}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM recruiters r ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getJobs(payload) {
    const { page, limit, search } = payload;
    let whereQuery = "";
    let values = [];
    if (search) {
        whereQuery = "WHERE title ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT j.id, j.title, j.location, j.is_remote, r.company_name, s.name as status, j.created_at, j.updated_at, j.deleted_at
      FROM job_posts j
      JOIN recruiters r ON j.recruiter_id = r.id
      JOIN job_post_statuses s ON j.status_id = s.id
      ${whereQuery}
      ORDER BY j.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM job_posts ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getApplications(payload) {
    const { page, limit, search } = payload;
    let whereQuery = "";
    let values = [];
    if (search) {
        whereQuery = "WHERE u.name ILIKE $1 OR jp.title ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT a.id, jp.title as job_title, u.name as worker_name, s.name as status, a.applied_at, a.updated_at, a.deleted_at
      FROM job_applications a
      JOIN job_posts jp ON a.job_post_id = jp.id
      JOIN workers u ON a.worker_id = u.id
      JOIN application_statuses s ON a.application_status_id = s.id
      ${whereQuery}
      ORDER BY a.applied_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM job_applications a
      JOIN job_posts jp ON a.job_post_id = jp.id
      JOIN workers u ON a.worker_id = u.id
      ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, values);
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
    const { page, limit, search } = payload;
    let whereQuery = "";
    let values = [];
    if (search) {
        whereQuery = "WHERE u.username ILIKE $1 OR a.action ILIKE $1 OR a.ip_address ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT a.id, a.user_id, u.username, a.action, a.ip_address, a.user_agent, a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereQuery}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);
    
    return wrapper.paginationData(result?.rows || [], {
      page, limit, totalData, totalPage: Math.ceil(totalData / limit)
    });
  }

  async getLookupTable(payload) {
    const { table } = payload;

    if (!LOOKUP_CONFIG[table]) {
      return wrapper.error(new NotFoundError("Invalid lookup table"));
    }

    const rawQuery = `SELECT ${LOOKUP_CONFIG[table].select} FROM ${table} ORDER BY id ASC`;
    const result = await this.db.executeQuery(rawQuery);
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

  // ==================== PAYMENT ORDERS ====================
  async getPaymentOrders(payload) {
    const { page, limit, search, status, order_type } = payload;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(r.company_name ILIKE $${idx} OR po.xendit_external_id ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }
    if (status) {
      conditions.push(`po.status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (order_type) {
      conditions.push(`po.order_type = $${idx}`);
      values.push(order_type);
      idx++;
    }
    const whereQuery = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
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
             COALESCE(sp.display_name, spp.display_name, bp.display_name) AS plan_name
      FROM payment_orders po
      JOIN recruiters r ON po.recruiter_id = r.id
      ${planJoin}
      ${whereQuery}
      ORDER BY po.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);

    const countQuery = `
      SELECT COUNT(*)
      FROM payment_orders po
      JOIN recruiters r ON po.recruiter_id = r.id
      ${whereQuery}
    `;
    const countResult = await this.db.executeQuery(countQuery, values);
    const totalData = parseInt(countResult?.rows[0]?.count || 0);

    return wrapper.paginationData(result?.rows || [], {
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
             COALESCE(sp.display_name, spp.display_name, bp.display_name) AS plan_name
      FROM payment_orders po
      JOIN recruiters r ON po.recruiter_id = r.id
      LEFT JOIN subscription_plans sp ON po.plan_type = 'subscription_plans' AND po.plan_id = sp.id
      LEFT JOIN single_post_plans spp ON po.plan_type = 'single_post_plans' AND po.plan_id = spp.id
      LEFT JOIN boost_plans bp ON po.plan_type = 'boost_plans' AND po.plan_id = bp.id
      WHERE po.id = $1
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Payment order not found"));
    return wrapper.data(result.rows[0]);
  }

  // ==================== PLANS ====================
  async getPlansByType(payload) {
    const { type } = payload;
    const config = PLAN_CONFIG[type];
    if (!config) return wrapper.error(new NotFoundError("Invalid plan type"));

    const rawQuery = `SELECT ${config.select} FROM ${config.table} ORDER BY price_idr ASC`;
    const result = await this.db.executeQuery(rawQuery);
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
    const { page, limit, search } = payload;
    let whereQuery = "";
    let values = [];
    if (search) {
        whereQuery = "WHERE w.name ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT w.id, w.user_id, w.name, w.avatar_url, w.telephone, w.gender_id, w.created_at, w.updated_at, w.deleted_at,
             u.email as user_email, u.username as user_username
      FROM workers w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereQuery}
      ORDER BY w.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM workers w ${whereQuery}`;
    const countResult = await this.db.executeQuery(countQuery, values);
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
      SELECT id, user_id, company_name, contact_name, contact_phone, company_website, address, description, avatar_url,
             employee_count, instagram_url, tiktok_url, industry_id, is_vip, is_verified, created_at
      FROM recruiters
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Employer not found"));
    return wrapper.data(result.rows[0]);
  }

  async getJobById(payload) {
    const { id } = payload;
    const rawQuery = `
      SELECT j.id, j.recruiter_id, j.title, j.description, j.requirements, j.benefits, j.location, j.is_remote, j.employment_type_id, j.experience_level_id, j.min_salary, j.max_salary, j.salary_type_id, j.status_id, j.created_at, r.company_name
      FROM job_posts j
      JOIN recruiters r ON j.recruiter_id = r.id
      WHERE j.id = $1 AND j.deleted_at IS NULL
    `;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rows.length === 0) return wrapper.error(new NotFoundError("Job not found"));
    return wrapper.data(result.rows[0]);
  }
}

module.exports = AdminQuery;
