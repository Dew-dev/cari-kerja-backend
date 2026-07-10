const wrapper = require("../../../../helpers/utils/wrapper");
const DB = require("../../../../helpers/databases/postgresql/db");
const config = require("../../../../config/global_config");
const { NotFoundError } = require("../../../../helpers/errors");

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
        whereQuery = "WHERE company_name ILIKE $1 OR contact_name ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT id, user_id, company_name, contact_name, contact_phone, is_vip, is_verified, created_at, updated_at, deleted_at
      FROM recruiters
      ${whereQuery}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM recruiters ${whereQuery}`;
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
      SELECT 'USER' as type, 'User ' || username || ' registered' as message, created_at
      FROM users
      UNION ALL
      SELECT 'EMPLOYER' as type, 'Employer ' || company_name || ' registered' as message, created_at
      FROM recruiters
      UNION ALL
      SELECT 'JOB' as type, 'Job ' || title || ' posted' as message, created_at
      FROM job_posts
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const result = await this.db.executeQuery(rawQuery);
    if (!result || !result.rows) return wrapper.data([]);
    const data = result.rows.map((r, i) => {
      const diff = Math.floor((new Date() - new Date(r.created_at)) / 1000);
      let timeStr = "";
      if (diff < 60) timeStr = diff + " secs ago";
      else if (diff < 3600) timeStr = Math.floor(diff/60) + " mins ago";
      else if (diff < 86400) timeStr = Math.floor(diff/3600) + " hours ago";
      else timeStr = Math.floor(diff/86400) + " days ago";

      return {
        id: (i + 1).toString(),
        message: r.message,
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
    const LOOKUP_CONFIG = {
      genders: "gender_name",
      marriage_statuses: "status_name",
      religions: "religion_name",
      employment_types: "type_name",
      experience_levels: "level_name",
      salary_types: "type_name",
      job_post_statuses: "name",
      application_statuses: "name",
      question_types: "name",
      industries: "name",
      proficiency_levels: "name",
      job_tags: "name",
      skills: "skill_name",
      nationalities: "country_name"
    };

    if (!LOOKUP_CONFIG[table]) {
      return wrapper.error(new NotFoundError("Invalid lookup table"));
    }

    const rawQuery = `SELECT * FROM ${table} ORDER BY id ASC`;
    const result = await this.db.executeQuery(rawQuery);
    return wrapper.data(result.rows);
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
        whereQuery = "WHERE name ILIKE $1";
        values.push(`%${search}%`);
    }
    const offset = limit * (page - 1);
    
    const rawQuery = `
      SELECT id, user_id, name, avatar_url, telephone, gender_id, created_at, updated_at, deleted_at
      FROM workers
      ${whereQuery}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await this.db.executeQuery(rawQuery, values);
    
    const countQuery = `SELECT COUNT(*) FROM workers ${whereQuery}`;
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
      SELECT id, user_id, company_name, contact_name, contact_phone, company_email, company_website, company_address, industry_id, company_description, company_logo, is_vip, is_verified, created_at
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
