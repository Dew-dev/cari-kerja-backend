const wrapper = require("../../../../../helpers/utils/wrapper");
const DB = require("../../../../../helpers/databases/postgresql/db");
const config = require("../../../../../config/global_config");
const { NotFoundError } = require("../../../../../helpers/errors");

class AdminQuery {
  constructor() {
    this.db = new DB(config.get("/pgDbUrl"));
  }

  async getDashboardStats() {
    const totalUsers = await this.db.countData({}, "users");
    const totalRecruiters = await this.db.countData({}, "recruiters");
    const totalJobs = await this.db.countData({}, "job_posts");
    const totalApplications = await this.db.countData({}, "job_applications");
    
    return wrapper.data({
        users: totalUsers.data || 0,
        recruiters: totalRecruiters.data || 0,
        job_posts: totalJobs.data || 0,
        job_applications: totalApplications.data || 0
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
      SELECT id, username, email, login_provider, role_id, is_suspended, created_at
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
      SELECT id, user_id, company_name, contact_name, contact_phone, is_vip, is_verified, created_at
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
      SELECT j.id, j.title, j.location, j.is_remote, r.company_name, s.name as status, j.created_at
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
      SELECT a.id, jp.title as job_title, u.name as worker_name, s.name as status, a.applied_at
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
}

module.exports = AdminQuery;
