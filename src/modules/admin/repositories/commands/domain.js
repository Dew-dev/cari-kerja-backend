const wrapper = require("../../../../helpers/utils/wrapper");
const DB = require("../../../../helpers/databases/postgresql/db");
const config = require("../../../../config/global_config");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");

class AdminCommand {
  constructor() {
    this.db = new DB(config.get("/postgresqlUrl"));
  }

  async updateUserStatus(payload) {
    const { id, is_suspended } = payload;
    const user = await this.db.findOne({ id }, { id: 1 }, "users");
    if (user.err) return wrapper.error(new NotFoundError("User not found"));

    const updateQuery = `UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.executeQuery(updateQuery, [is_suspended, id]);
    
    return wrapper.data(result.rows[0]);
  }

  async verifyEmployer(payload) {
    const { id, is_verified } = payload;
    const employer = await this.db.findOne({ id }, { id: 1 }, "recruiters");
    if (employer.err) return wrapper.error(new NotFoundError("Employer not found"));

    const updateQuery = `UPDATE recruiters SET is_verified = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.executeQuery(updateQuery, [is_verified, id]);

    return wrapper.data(result.rows[0]);
  }

  async updateJobStatus(payload) {
    const { id, status } = payload;
    const job = await this.db.findOne({ id }, { id: 1 }, "job_posts");
    if (job.err) return wrapper.error(new NotFoundError("Job not found"));

    const statusRecord = await this.db.findOne({ name: status }, { id: 1 }, "job_post_statuses");
    if (statusRecord.err) return wrapper.error(new NotFoundError("Status not found"));

    const updateQuery = `UPDATE job_posts SET status_id = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.executeQuery(updateQuery, [statusRecord.data.id, id]);

    return wrapper.data(result.rows[0]);
  }

  async updateSystemSettings(payload) {
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        const valStr = typeof value === "boolean" ? value.toString() : value;
        const updateQuery = `
          INSERT INTO system_settings (setting_key, setting_value)
          VALUES ($1, $2)
          ON CONFLICT (setting_key)
          DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
        `;
        await this.db.executeQuery(updateQuery, [key, valStr]);
      }
    }
    return wrapper.data("System settings updated successfully");
  }

  async insertLookupTable(payload) {
    const { table, name } = payload;
    const LOOKUP_CONFIG = {
      genders: "gender_name", marriage_statuses: "status_name", religions: "religion_name",
      employment_types: "type_name", experience_levels: "level_name", salary_types: "type_name",
      job_post_statuses: "name", application_statuses: "name", question_types: "name",
      industries: "name", proficiency_levels: "name"
    };
    if (!LOOKUP_CONFIG[table]) return wrapper.error(new BadRequestError("Invalid lookup table"));
    
    const colName = LOOKUP_CONFIG[table];
    const rawQuery = `INSERT INTO ${table} (${colName}) VALUES ($1) RETURNING *`;
    try {
      const result = await this.db.executeQuery(rawQuery, [name]);
      return wrapper.data(result.rows[0]);
    } catch(err) {
      return wrapper.error(new InternalServerError("Failed to insert"));
    }
  }

  async updateLookupTable(payload) {
    const { table, id, name } = payload;
    const LOOKUP_CONFIG = {
      genders: "gender_name", marriage_statuses: "status_name", religions: "religion_name",
      employment_types: "type_name", experience_levels: "level_name", salary_types: "type_name",
      job_post_statuses: "name", application_statuses: "name", question_types: "name",
      industries: "name", proficiency_levels: "name"
    };
    if (!LOOKUP_CONFIG[table]) return wrapper.error(new BadRequestError("Invalid lookup table"));
    
    const colName = LOOKUP_CONFIG[table];
    const rawQuery = `UPDATE ${table} SET ${colName} = $1 WHERE id = $2 RETURNING *`;
    try {
      const result = await this.db.executeQuery(rawQuery, [name, id]);
      if(result.rowCount === 0) return wrapper.error(new NotFoundError("Record not found"));
      return wrapper.data(result.rows[0]);
    } catch(err) {
      return wrapper.error(new InternalServerError("Failed to update"));
    }
  }

  async deleteLookupTable(payload) {
    const { table, id } = payload;
    const LOOKUP_CONFIG = {
      genders: "gender_name", marriage_statuses: "status_name", religions: "religion_name",
      employment_types: "type_name", experience_levels: "level_name", salary_types: "type_name",
      job_post_statuses: "name", application_statuses: "name", question_types: "name",
      industries: "name", proficiency_levels: "name"
    };
    if (!LOOKUP_CONFIG[table]) return wrapper.error(new BadRequestError("Invalid lookup table"));
    
    const rawQuery = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    try {
      const result = await this.db.executeQuery(rawQuery, [id]);
      if(result.rowCount === 0) return wrapper.error(new NotFoundError("Record not found"));
      return wrapper.data(result.rows[0]);
    } catch(err) {
      return wrapper.error(new InternalServerError("Failed to delete. Record might be in use."));
    }
  }

  async insertUser(payload) {
    const { username, email, password, role_id } = payload;
    const { generateHash } = require("../../../../helpers/utils/hash_helper");
    const hashedPassword = await generateHash(password);
    
    const insertQuery = `
      INSERT INTO users (username, email, hashed_password, role_id, login_provider)
      VALUES ($1, $2, $3, $4, 'local')
      RETURNING id, username, email, role_id, created_at
    `;
    try {
      const result = await this.db.executeQuery(insertQuery, [username, email, hashedPassword, role_id]);
      return wrapper.data(result.rows[0]);
    } catch(e) {
      return wrapper.error(new InternalServerError("Failed to create user. Email or username might exist."));
    }
  }

  async updateUser(payload) {
    const { id, username, email, role_id } = payload;
    const updateQuery = `
      UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email), role_id = COALESCE($3, role_id), updated_at = NOW()
      WHERE id = $4 AND deleted_at IS NULL
      RETURNING id, username, email, role_id, updated_at
    `;
    const result = await this.db.executeQuery(updateQuery, [username, email, role_id, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("User not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteUser(payload) {
    const { id } = payload;
    const updateQuery = `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    const result = await this.db.executeQuery(updateQuery, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("User not found"));
    return wrapper.data("User deleted successfully");
  }

  async updateWorker(payload) {
    const { id, name, telephone, address, profile_summary, current_salary, expected_salary } = payload;
    const updateQuery = `
      UPDATE workers 
      SET name = COALESCE($1, name), 
          telephone = COALESCE($2, telephone), 
          address = COALESCE($3, address), 
          profile_summary = COALESCE($4, profile_summary), 
          current_salary = COALESCE($5, current_salary), 
          expected_salary = COALESCE($6, expected_salary),
          updated_at = NOW()
      WHERE id = $7 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [name, telephone, address, profile_summary, current_salary, expected_salary, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Worker not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteWorker(payload) {
    const { id } = payload;
    const updateQuery = `UPDATE workers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    const result = await this.db.executeQuery(updateQuery, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Worker not found"));
    return wrapper.data("Worker deleted successfully");
  }

  async updateEmployer(payload) {
    const { id, company_name, contact_name, contact_phone, company_email, company_website, company_address, company_description, is_vip, is_verified } = payload;
    const updateQuery = `
      UPDATE recruiters 
      SET company_name = COALESCE($1, company_name), 
          contact_name = COALESCE($2, contact_name), 
          contact_phone = COALESCE($3, contact_phone), 
          company_email = COALESCE($4, company_email), 
          company_website = COALESCE($5, company_website), 
          company_address = COALESCE($6, company_address),
          company_description = COALESCE($7, company_description),
          is_vip = COALESCE($8, is_vip),
          is_verified = COALESCE($9, is_verified),
          updated_at = NOW()
      WHERE id = $10 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [
      company_name, contact_name, contact_phone, company_email, 
      company_website, company_address, company_description, 
      is_vip, is_verified, id
    ]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Employer not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteEmployer(payload) {
    const { id } = payload;
    const updateQuery = `UPDATE recruiters SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    const result = await this.db.executeQuery(updateQuery, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Employer not found"));
    return wrapper.data("Employer deleted successfully");
  }

  async updateJob(payload) {
    const { id, title, description, requirements, benefits, location, is_remote, min_salary, max_salary } = payload;
    const updateQuery = `
      UPDATE job_posts 
      SET title = COALESCE($1, title), 
          description = COALESCE($2, description), 
          requirements = COALESCE($3, requirements), 
          benefits = COALESCE($4, benefits), 
          location = COALESCE($5, location), 
          is_remote = COALESCE($6, is_remote),
          min_salary = COALESCE($7, min_salary),
          max_salary = COALESCE($8, max_salary),
          updated_at = NOW()
      WHERE id = $9 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [title, description, requirements, benefits, location, is_remote, min_salary, max_salary, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Job not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteJob(payload) {
    const { id } = payload;
    const updateQuery = `UPDATE job_posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    const result = await this.db.executeQuery(updateQuery, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Job not found"));
    return wrapper.data("Job deleted successfully");
  }
}

module.exports = AdminCommand;
