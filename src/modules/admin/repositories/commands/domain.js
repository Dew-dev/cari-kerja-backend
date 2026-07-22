const wrapper = require("../../../../helpers/utils/wrapper");
const DB = require("../../../../helpers/databases/postgresql/db");
const config = require("../../../../config/global_config");
const { NotFoundError, InternalServerError, BadRequestError, ConflictError } = require("../../../../helpers/errors");
const { LOOKUP_CONFIG } = require("../../helpers/lookup_config");
const { PLAN_CONFIG } = require("../../helpers/plan_config");
const { WORKER_SUBRESOURCES } = require("../../helpers/worker_subresource_config");
const {
  resolveJobTitle,
  JobTitleResolveError,
} = require("../../../job_titles/helpers/resolve_job_title");
const objectStorage = require("../../../../helpers/storage/object_storage");
const { ACTIONS } = require("../../../../helpers/audit/actions");
const { v4: uuidv4 } = require("uuid");

class AdminCommand {
  constructor() {
    this.db = new DB(config.get("/postgresqlUrl"));
  }

  async updateUserStatus(payload) {
    const { id, is_suspended } = payload;
    const user = await this.db.findOne({ id }, { id: 1 }, "users");
    if (user.err) return wrapper.error(new NotFoundError("User not found"));

    const updateQuery = `
      UPDATE users
      SET is_suspended = $1,
          suspension_reason = CASE WHEN $1 IS TRUE THEN suspension_reason ELSE NULL END,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [is_suspended, id]);
    
    return wrapper.data(result.rows[0]);
  }

  async verifyEmployer(payload) {
    const { id, is_verified } = payload;
    const employer = await this.db.findOne({ id }, { id: 1 }, "recruiters");
    if (employer.err) return wrapper.error(new NotFoundError("Employer not found"));

    const updateQuery = `
      UPDATE recruiters
      SET is_verified = $1,
          verification_status = CASE
            WHEN $1 IS TRUE THEN 'verified'
            ELSE CASE
              WHEN verification_status = 'verified' THEN 'grace'
              ELSE verification_status
            END
          END,
          verification_deadline_at = CASE
            WHEN $1 IS TRUE THEN NULL
            ELSE verification_deadline_at
          END,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [is_verified, id]);

    if (is_verified && result?.rows?.[0]?.user_id) {
      await this.db.executeQuery(
        `UPDATE users
         SET is_suspended = FALSE,
             suspension_reason = NULL,
             updated_at = NOW()
         WHERE id = $1
           AND suspension_reason = 'verification_incomplete'`,
        [result.rows[0].user_id]
      );
    }

    return wrapper.data(result.rows[0]);
  }

  async updateJobStatus(payload) {
    const { id, status, reject_reason } = payload;
    const job = await this.db.findOne({ id }, { id: 1 }, "job_posts");
    if (job.err) return wrapper.error(new NotFoundError("Job not found"));

    const statusRecord = await this.db.findOne({ name: status }, { id: 1 }, "job_post_statuses");
    if (statusRecord.err) return wrapper.error(new NotFoundError("Status not found"));

    const reason =
      status === "REJECTED"
        ? reject_reason && String(reject_reason).trim()
          ? String(reject_reason).trim()
          : null
        : null;

    const updateQuery = `
      UPDATE job_posts
      SET status_id = $1,
          reject_reason = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [
      statusRecord.data.id,
      reason,
      id,
    ]);

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
    try {
      const { invalidateMaintenanceCache } = require("../../../../middlewares/maintenanceMode");
      invalidateMaintenanceCache();
    } catch (_) {}
    try {
      const {
        invalidateEmployerVerificationSettingsCache,
      } = require("../../../../helpers/fraud/employer_verification_settings");
      invalidateEmployerVerificationSettingsCache();
    } catch (_) {}
    return wrapper.data("System settings updated successfully");
  }

  async insertLookupTable(payload) {
    const { table, name, iso_alpha2, iso_alpha3 } = payload;
    if (!LOOKUP_CONFIG[table]) return wrapper.error(new BadRequestError("Invalid lookup table"));

    if (table === "categories") {
      try {
        const inserted = await this.db.executeQuery(
          `INSERT INTO categories DEFAULT VALUES RETURNING id`
        );
        const categoryId = inserted?.rows?.[0]?.id;
        if (!categoryId) return wrapper.error(new InternalServerError("Failed to insert"));
        const locale = LOOKUP_CONFIG.categories.defaultLocale || "id";
        const result = await this.db.executeQuery(
          `
          INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING category_id AS id, name
          `,
          [categoryId, locale, name]
        );
        return wrapper.data(result.rows[0]);
      } catch (err) {
        return wrapper.error(new InternalServerError("Failed to insert"));
      }
    }

    const { column, select } = LOOKUP_CONFIG[table];
    let rawQuery = `INSERT INTO ${table} (${column}) VALUES ($1) RETURNING ${select}`;
    let values = [name];
    if (table === "nationalities") {
      rawQuery = `INSERT INTO nationalities (country_name, iso_alpha2, iso_alpha3) VALUES ($1, $2, $3) RETURNING ${select}`;
      values = [name, iso_alpha2 || "", iso_alpha3 || ""];
    }
    try {
      const result = await this.db.executeQuery(rawQuery, values);
      return wrapper.data(result.rows[0]);
    } catch(err) {
      return wrapper.error(new InternalServerError("Failed to insert"));
    }
  }

  async updateLookupTable(payload) {
    const { table, id, name } = payload;
    if (!LOOKUP_CONFIG[table]) return wrapper.error(new BadRequestError("Invalid lookup table"));

    if (table === "categories") {
      const locale = LOOKUP_CONFIG.categories.defaultLocale || "id";
      try {
        const result = await this.db.executeQuery(
          `
          INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (category_id, locale) DO UPDATE
            SET name = EXCLUDED.name, updated_at = NOW()
          RETURNING category_id AS id, name
          `,
          [id, locale, name]
        );
        if (!result?.rows?.[0]) return wrapper.error(new NotFoundError("Record not found"));
        return wrapper.data(result.rows[0]);
      } catch (err) {
        return wrapper.error(new InternalServerError("Failed to update"));
      }
    }

    const { column, select } = LOOKUP_CONFIG[table];
    const rawQuery = `UPDATE ${table} SET ${column} = $1 WHERE id = $2 RETURNING ${select}`;
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
    if (!LOOKUP_CONFIG[table]) return wrapper.error(new BadRequestError("Invalid lookup table"));

    const rawQuery = `DELETE FROM ${table} WHERE id = $1 RETURNING id`;
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
    const { id, username, email, role_id, is_suspended, password } = payload;
    let updatePassword = "";
    let values = [username, email, role_id, is_suspended, id];
    if (password) {
      const { generateHash } = require("../../../../helpers/utils/hash_helper");
      const hashedPassword = await generateHash(password);
      updatePassword = ", hashed_password = $6";
      values.push(hashedPassword);
    }
    const updateQuery = `
      UPDATE users SET 
        username = COALESCE($1, username), 
        email = COALESCE($2, email), 
        role_id = COALESCE($3, role_id), 
        is_suspended = COALESCE($4, is_suspended)${updatePassword},
        updated_at = NOW()
      WHERE id = $5 AND deleted_at IS NULL
      RETURNING id, username, email, role_id, is_suspended, updated_at
    `;
    const result = await this.db.executeQuery(updateQuery, values);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("User not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteUser(payload) {
    const { id, hard_delete } = payload;
    let query = "";
    if (String(hard_delete) === "true") {
       query = `DELETE FROM users WHERE id = $1 RETURNING id`;
    } else {
       query = `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    }
    const result = await this.db.executeQuery(query, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("User not found"));
    return wrapper.data("User deleted successfully");
  }

  async updateWorker(payload) {
    const { id, name, telephone, address, profile_summary, current_salary, expected_salary, gender_id, date_of_birth, nationality_id, religion_id, marriage_status_id } = payload;
    const updateQuery = `
      UPDATE workers 
      SET name = COALESCE($1, name), 
          telephone = COALESCE($2, telephone), 
          address = COALESCE($3, address), 
          profile_summary = COALESCE($4, profile_summary), 
          current_salary = COALESCE($5, current_salary), 
          expected_salary = COALESCE($6, expected_salary),
          gender_id = COALESCE($7, gender_id),
          date_of_birth = COALESCE($8, date_of_birth),
          nationality_id = COALESCE($9, nationality_id),
          religion_id = COALESCE($10, religion_id),
          marriage_status_id = COALESCE($11, marriage_status_id),
          updated_at = NOW()
      WHERE id = $12 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [name, telephone, address, profile_summary, current_salary, expected_salary, gender_id, date_of_birth, nationality_id, religion_id, marriage_status_id, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Worker not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteWorker(payload) {
    const { id, hard_delete } = payload;
    let query = "";
    if (String(hard_delete) === "true") {
       query = `DELETE FROM workers WHERE id = $1 RETURNING id`;
    } else {
       query = `UPDATE workers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    }
    const result = await this.db.executeQuery(query, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Worker not found"));
    return wrapper.data("Worker deleted successfully");
  }

  async updateEmployer(payload) {
    const {
      id, company_name, contact_name, contact_phone, company_website,
      is_vip, is_verified, industry_id, employee_count, instagram_url, tiktok_url,
      website, address, description, company_address, company_description
    } = payload;
    // kompatibilitas payload lama: website -> company_website, company_address -> address, company_description -> description
    const finalWebsite = website !== undefined ? website : company_website;
    const finalAddress = address !== undefined ? address : company_address;
    const finalDescription = description !== undefined ? description : company_description;

    const updateQuery = `
      UPDATE recruiters
      SET company_name = COALESCE($1, company_name),
          contact_name = COALESCE($2, contact_name),
          contact_phone = COALESCE($3, contact_phone),
          company_website = COALESCE($4, company_website),
          address = COALESCE($5, address),
          description = COALESCE($6, description),
          employee_count = COALESCE($7, employee_count),
          instagram_url = COALESCE($8, instagram_url),
          tiktok_url = COALESCE($9, tiktok_url),
          is_vip = COALESCE($10, is_vip),
          is_verified = COALESCE($11, is_verified),
          industry_id = COALESCE($12, industry_id),
          updated_at = NOW()
      WHERE id = $13 AND deleted_at IS NULL
      RETURNING id, user_id, company_name, contact_name, contact_phone, company_website, address, description,
                avatar_url, employee_count, instagram_url, tiktok_url, industry_id, is_vip, is_verified, updated_at
    `;
    const result = await this.db.executeQuery(updateQuery, [
      company_name, contact_name, contact_phone, finalWebsite,
      finalAddress, finalDescription, employee_count, instagram_url, tiktok_url,
      is_vip, is_verified, industry_id, id
    ]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Employer not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteEmployer(payload) {
    const { id, hard_delete } = payload;
    let query = "";
    if (String(hard_delete) === "true") {
       query = `DELETE FROM recruiters WHERE id = $1 RETURNING id`;
    } else {
       query = `UPDATE recruiters SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    }
    const result = await this.db.executeQuery(query, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Employer not found"));
    return wrapper.data("Employer deleted successfully");
  }

  async updateJob(payload) {
    const { id, title, description, requirements, benefits, location, is_remote, min_salary, max_salary, status_name, salary } = payload;
    let finalStatusId = null;
    if (status_name) {
      const statusRecord = await this.db.findOne({ name: status_name }, { id: 1 }, "job_post_statuses");
      if (!statusRecord.err) finalStatusId = statusRecord.data.id;
    }
    const finalMinSalary = salary !== undefined ? salary : min_salary;
    const finalMaxSalary = salary !== undefined ? salary : max_salary;
    
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
          status_id = COALESCE($9, status_id),
          updated_at = NOW()
      WHERE id = $10 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [title, description, requirements, benefits, location, is_remote, finalMinSalary, finalMaxSalary, finalStatusId, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Job not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteJob(payload) {
    const { id, hard_delete } = payload;
    let query = "";
    if (String(hard_delete) === "true") {
       query = `DELETE FROM job_posts WHERE id = $1 RETURNING id`;
    } else {
       query = `UPDATE job_posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    }
    const result = await this.db.executeQuery(query, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Job not found"));
    return wrapper.data("Job deleted successfully");
  }

  async updateApplication(payload) {
    const { id, status_name } = payload;
    let finalStatusId = null;
    if (status_name) {
      const statusRecord = await this.db.findOne({ name: status_name }, { id: 1 }, "application_statuses");
      if (statusRecord.err) return wrapper.error(new NotFoundError("Application status not found"));
      finalStatusId = statusRecord.data.id;
    }
    const updateQuery = `
      UPDATE job_applications 
      SET application_status_id = COALESCE($1, application_status_id),
          updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.executeQuery(updateQuery, [finalStatusId, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Application not found"));
    return wrapper.data(result.rows[0]);
  }

  async insertAuditLog({ user_id, action, ip_address, user_agent }) {
    return this.db.executeQuery(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)`,
      [user_id, action, ip_address, user_agent]
    );
  }

  // ==================== WORKER SUB-RESOURCES ====================
  async findWorker(worker_id) {
    const worker = await this.db.findOne({ id: worker_id }, { id: 1 }, "workers");
    if (worker.err) return null;
    return worker.data;
  }

  // Insert/update/delete generik untuk work_experiences, educations, certifications, portfolios.
  // Pakai db.insertOne/updateOneNew agar enkripsi kolom sensitif tetap konsisten dengan module worker.
  async insertWorkerSubResource(payload) {
    const { resource, worker_id, ...data } = payload;
    const config = WORKER_SUBRESOURCES[resource];
    if (!config) return wrapper.error(new BadRequestError("Invalid sub-resource"));
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    if (resource === "work_experiences" && (data.job_title || data.job_title_id)) {
      try {
        const resolved = await resolveJobTitle(
          {
            id: data.job_title_id,
            name: data.job_title,
            category_id: data.category_id,
          },
          this.db
        );
        if (resolved) {
          data.job_title_id = resolved.id;
          data.job_title = resolved.name;
        }
      } catch (err) {
        if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
          return wrapper.error(new BadRequestError(err.message));
        }
        throw err;
      }
      // category_id is only used for title resolve; not a WE column
      delete data.category_id;
    }

    const document = { id: uuidv4(), worker_id };
    for (const column of config.columns) {
      if (data[column] !== undefined) document[column] = data[column];
    }

    const result = await this.db.insertOne(document, config.table);
    if (result.err) return wrapper.error(new InternalServerError(`Failed to insert ${config.label.toLowerCase()}`));
    return wrapper.data({ id: document.id });
  }

  async updateWorkerSubResource(payload) {
    const { resource, worker_id, id, ...data } = payload;
    const config = WORKER_SUBRESOURCES[resource];
    if (!config) return wrapper.error(new BadRequestError("Invalid sub-resource"));

    const existing = await this.db.findOne({ id, worker_id }, { id: 1 }, config.table);
    if (existing.err) return wrapper.error(new NotFoundError(`${config.label} not found`));

    if (resource === "work_experiences" && (data.job_title || data.job_title_id)) {
      try {
        const resolved = await resolveJobTitle(
          {
            id: data.job_title_id,
            name: data.job_title,
            category_id: data.category_id,
          },
          this.db
        );
        if (resolved) {
          data.job_title_id = resolved.id;
          data.job_title = resolved.name;
        }
      } catch (err) {
        if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
          return wrapper.error(new BadRequestError(err.message));
        }
        throw err;
      }
      delete data.category_id;
    }

    const document = {};
    for (const column of config.columns) {
      if (data[column] !== undefined) document[column] = data[column];
    }
    if (Object.keys(document).length === 0) return wrapper.error(new BadRequestError("No data to update"));

    const result = await this.db.updateOneNew({ id, worker_id }, document, config.table);
    if (result.err) return wrapper.error(new InternalServerError(`Failed to update ${config.label.toLowerCase()}`));
    return wrapper.data({ id });
  }

  async deleteWorkerSubResource(payload) {
    const { resource, worker_id, id } = payload;
    const config = WORKER_SUBRESOURCES[resource];
    if (!config) return wrapper.error(new BadRequestError("Invalid sub-resource"));

    const rawQuery = `DELETE FROM ${config.table} WHERE id = $1 AND worker_id = $2 RETURNING id`;
    const result = await this.db.executeQuery(rawQuery, [id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError(`${config.label} not found`));
    return wrapper.data(`${config.label} deleted successfully`);
  }

  // Languages: perlu resolve language_id ke master lookup
  async resolveLanguageId(languageName) {
    const rawQuery = `
      WITH ins AS (
        INSERT INTO languages (name)
        VALUES (INITCAP(TRIM($1)))
        ON CONFLICT (name) DO NOTHING
        RETURNING id
      )
      SELECT id FROM ins
      UNION
      SELECT id FROM languages WHERE name = INITCAP(TRIM($1))
    `;
    const result = await this.db.executeQuery(rawQuery, [languageName]);
    return result?.rows?.[0]?.id || null;
  }

  async insertWorkerLanguage(payload) {
    const { worker_id, language_name, proficiency_level_id, is_primary } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const language_id = await this.resolveLanguageId(language_name);
    const document = {
      id: uuidv4(),
      worker_id,
      language_name,
      language_id,
      proficiency_level_id,
      is_primary: is_primary || false
    };
    const result = await this.db.insertOne(document, "worker_languages");
    if (result.err) return wrapper.error(new InternalServerError("Failed to insert language"));
    return wrapper.data({ id: document.id });
  }

  async updateWorkerLanguage(payload) {
    const { worker_id, id, language_name, proficiency_level_id, is_primary } = payload;
    const existing = await this.db.findOne({ id, worker_id }, { id: 1 }, "worker_languages");
    if (existing.err) return wrapper.error(new NotFoundError("Language not found"));

    const document = {};
    if (language_name !== undefined) {
      document.language_name = language_name;
      document.language_id = await this.resolveLanguageId(language_name);
    }
    if (proficiency_level_id !== undefined) document.proficiency_level_id = proficiency_level_id;
    if (is_primary !== undefined) document.is_primary = is_primary;
    if (Object.keys(document).length === 0) return wrapper.error(new BadRequestError("No data to update"));

    const result = await this.db.updateOneNew({ id, worker_id }, document, "worker_languages");
    if (result.err) return wrapper.error(new InternalServerError("Failed to update language"));
    return wrapper.data({ id });
  }

  async deleteWorkerLanguage(payload) {
    const { worker_id, id } = payload;
    const rawQuery = `DELETE FROM worker_languages WHERE id = $1 AND worker_id = $2 RETURNING id`;
    const result = await this.db.executeQuery(rawQuery, [id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Language not found"));
    return wrapper.data("Language deleted successfully");
  }

  // Resumes: update title/is_default, delete termasuk file R2
  async updateWorkerResume(payload) {
    const { worker_id, id, title, is_default } = payload;
    const existing = await this.db.findOne({ id, worker_id }, { id: 1 }, "resumes");
    if (existing.err) return wrapper.error(new NotFoundError("Resume not found"));

    if (is_default === true) {
      await this.db.executeQuery(
        `UPDATE resumes SET is_default = FALSE WHERE worker_id = $1 AND is_default = TRUE AND id <> $2`,
        [worker_id, id]
      );
    }

    const rawQuery = `
      UPDATE resumes
      SET title = COALESCE($1, title),
          is_default = COALESCE($2, is_default),
          updated_at = NOW()
      WHERE id = $3 AND worker_id = $4
      RETURNING id, resume_url, title, is_default, updated_at
    `;
    const result = await this.db.executeQuery(rawQuery, [title, is_default, id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Resume not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteWorkerResume(payload) {
    const { worker_id, id } = payload;
    const rawQuery = `DELETE FROM resumes WHERE id = $1 AND worker_id = $2 RETURNING id, resume_url`;
    const result = await this.db.executeQuery(rawQuery, [id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Resume not found"));

    const resumeUrl = result.rows[0].resume_url;
    if (resumeUrl) {
      await objectStorage.deleteStored(resumeUrl);
    }
    return wrapper.data("Resume deleted successfully");
  }

  // Skills (composite PK worker_id + skill_id)
  async insertWorkerSkill(payload) {
    const { worker_id, skill_id } = payload;
    if (!(await this.findWorker(worker_id))) return wrapper.error(new NotFoundError("Worker not found"));

    const skill = await this.db.findOne({ id: skill_id }, { id: 1 }, "skills");
    if (skill.err) return wrapper.error(new NotFoundError("Skill not found"));

    const rawQuery = `
      INSERT INTO worker_skills (worker_id, skill_id)
      VALUES ($1, $2)
      ON CONFLICT (worker_id, skill_id) DO NOTHING
      RETURNING worker_id, skill_id
    `;
    const result = await this.db.executeQuery(rawQuery, [worker_id, skill_id]);
    if (result.rowCount === 0) return wrapper.error(new ConflictError("Worker already has this skill"));
    return wrapper.data(result.rows[0]);
  }

  async deleteWorkerSkill(payload) {
    const { worker_id, skill_id } = payload;
    const rawQuery = `DELETE FROM worker_skills WHERE worker_id = $1 AND skill_id = $2 RETURNING skill_id`;
    const result = await this.db.executeQuery(rawQuery, [worker_id, skill_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Worker skill not found"));
    return wrapper.data("Worker skill deleted successfully");
  }

  // Applications
  async updateWorkerApplication(payload) {
    const { worker_id, id, application_status_id, cover_letter } = payload;
    const rawQuery = `
      UPDATE job_applications
      SET application_status_id = COALESCE($1, application_status_id),
          cover_letter = COALESCE($2, cover_letter),
          updated_at = NOW()
      WHERE id = $3 AND worker_id = $4 AND deleted_at IS NULL
      RETURNING id, job_post_id, application_status_id, cover_letter, updated_at
    `;
    const result = await this.db.executeQuery(rawQuery, [application_status_id, cover_letter, id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Application not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteWorkerApplication(payload) {
    const { worker_id, id } = payload;
    const rawQuery = `
      UPDATE job_applications SET deleted_at = NOW()
      WHERE id = $1 AND worker_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await this.db.executeQuery(rawQuery, [id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Application not found"));
    return wrapper.data("Application deleted successfully");
  }

  // Job post answers (scoped via job_applications.worker_id)
  async updateWorkerJobPostAnswer(payload) {
    const { worker_id, id, answer } = payload;
    const answerJson = JSON.stringify(answer);
    const rawQuery = `
      UPDATE job_post_answers ans
      SET answer = $1::jsonb
      FROM job_applications a
      WHERE ans.id = $2 AND ans.job_application_id = a.id AND a.worker_id = $3
      RETURNING ans.id, ans.answer, ans.submitted_at
    `;
    const result = await this.db.executeQuery(rawQuery, [answerJson, id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Answer not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteWorkerJobPostAnswer(payload) {
    const { worker_id, id } = payload;
    const rawQuery = `
      DELETE FROM job_post_answers ans
      USING job_applications a
      WHERE ans.id = $1 AND ans.job_application_id = a.id AND a.worker_id = $2
      RETURNING ans.id
    `;
    const result = await this.db.executeQuery(rawQuery, [id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Answer not found"));
    return wrapper.data("Answer deleted successfully");
  }

  // Saved jobs
  async deleteWorkerSavedJob(payload) {
    const { worker_id, id } = payload;
    const rawQuery = `DELETE FROM saved_jobs WHERE id = $1 AND worker_id = $2 RETURNING id`;
    const result = await this.db.executeQuery(rawQuery, [id, worker_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Saved job not found"));
    return wrapper.data("Saved job deleted successfully");
  }

  // ==================== EMPLOYER SUB-RESOURCES ====================
  async deleteEmployerJobPost(payload) {
    const { employer_id, id } = payload;
    const rawQuery = `
      UPDATE job_posts SET deleted_at = NOW()
      WHERE id = $1 AND recruiter_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await this.db.executeQuery(rawQuery, [id, employer_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Job post not found"));
    return wrapper.data("Job post deleted successfully");
  }

  async updateEmployerSubscription(payload) {
    const { employer_id, id, expires_at, is_active } = payload;
    const rawQuery = `
      UPDATE recruiter_subscriptions
      SET expires_at = COALESCE($1, expires_at),
          is_active = COALESCE($2, is_active),
          updated_at = NOW()
      WHERE id = $3 AND recruiter_id = $4
      RETURNING id, plan_id, payment_order_id, starts_at, expires_at, is_active, updated_at
    `;
    const result = await this.db.executeQuery(rawQuery, [expires_at, is_active, id, employer_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Subscription not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteEmployerSubscription(payload) {
    const { employer_id, id } = payload;
    const rawQuery = `DELETE FROM recruiter_subscriptions WHERE id = $1 AND recruiter_id = $2 RETURNING id`;
    const result = await this.db.executeQuery(rawQuery, [id, employer_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Subscription not found"));
    return wrapper.data("Subscription deleted successfully");
  }

  // ==================== CHAT MODERATION ====================
  async deleteConversationMessage(payload) {
    const { conversation_id, message_id, admin_user_id, ip_address, user_agent } = payload;

    const rawQuery = `
      DELETE FROM messages
      WHERE id = $1 AND conversation_id = $2
      RETURNING id
    `;
    const result = await this.db.executeQuery(rawQuery, [message_id, conversation_id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Message not found"));

    await this._syncConversationLastMessage(conversation_id);

    await this.insertAuditLog({
      user_id: admin_user_id,
      action: ACTIONS.ADMIN_DELETE_CHAT_MESSAGE,
      ip_address,
      user_agent
    });

    return wrapper.data("Message deleted successfully");
  }

  /**
   * Bulk-delete messages in a conversation.
   * If message_ids omitted/empty → purge all messages in the conversation.
   */
  async bulkDeleteConversationMessages(payload) {
    const { conversation_id, message_ids, admin_user_id, ip_address, user_agent } = payload;

    const conv = await this.db.findOne({ id: conversation_id }, { id: 1 }, "conversations");
    if (conv.err) return wrapper.error(new NotFoundError("Conversation not found"));

    let result;
    const ids = Array.isArray(message_ids)
      ? message_ids.filter((id) => typeof id === "string" && id.length > 0)
      : [];

    if (ids.length > 0) {
      result = await this.db.executeQuery(
        `
        DELETE FROM messages
        WHERE conversation_id = $1
          AND id = ANY($2::uuid[])
        RETURNING id
        `,
        [conversation_id, ids]
      );
    } else {
      result = await this.db.executeQuery(
        `
        DELETE FROM messages
        WHERE conversation_id = $1
        RETURNING id
        `,
        [conversation_id]
      );
    }

    await this._syncConversationLastMessage(conversation_id);

    await this.insertAuditLog({
      user_id: admin_user_id,
      action: ACTIONS.ADMIN_BULK_DELETE_CHAT_MESSAGES,
      ip_address,
      user_agent,
    });

    return wrapper.data({
      conversation_id,
      deleted_count: result.rowCount || 0,
      deleted_ids: (result.rows || []).map((r) => r.id),
    });
  }

  async updateConversationStatus(payload) {
    const { id, status, reason, admin_user_id, ip_address, user_agent } = payload;

    const conv = await this.db.findOne({ id }, { id: 1, status: 1 }, "conversations");
    if (conv.err) return wrapper.error(new NotFoundError("Conversation not found"));

    const nextStatus = String(status || "").toUpperCase();
    if (!["ACTIVE", "ARCHIVED"].includes(nextStatus)) {
      return wrapper.error(new BadRequestError("status must be ACTIVE or ARCHIVED"));
    }

    const result = await this.db.executeQuery(
      `
      UPDATE conversations
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, worker_id, recruiter_id, job_id, status, last_message, last_message_at, created_at, updated_at
      `,
      [nextStatus, id]
    );

    await this.insertAuditLog({
      user_id: admin_user_id,
      action:
        nextStatus === "ARCHIVED"
          ? ACTIONS.ADMIN_ARCHIVE_CONVERSATION
          : ACTIONS.ADMIN_RESTORE_CONVERSATION,
      ip_address,
      user_agent,
    });

    return wrapper.data({
      ...result.rows[0],
      moderation_reason: reason || null,
    });
  }

  async _syncConversationLastMessage(conversation_id) {
    const latest = await this.db.executeQuery(
      `SELECT message, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [conversation_id]
    );
    const latestRow = latest?.rows?.[0];
    await this.db.executeQuery(
      `UPDATE conversations
       SET last_message = $1, last_message_at = $2, updated_at = NOW()
       WHERE id = $3`,
      [latestRow?.message ?? null, latestRow?.created_at ?? null, conversation_id]
    );
  }

  // ==================== PAYMENT ORDERS ====================
  async updatePaymentOrderStatus(payload) {
    const { id, status, admin_user_id, ip_address, user_agent } = payload;

    const rawQuery = `
      UPDATE payment_orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, recruiter_id, order_type, plan_id, plan_type, amount, status, updated_at
    `;
    const result = await this.db.executeQuery(rawQuery, [status, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Payment order not found"));

    await this.insertAuditLog({
      user_id: admin_user_id,
      action: `ADMIN_UPDATE_PAYMENT_ORDER_STATUS ${id} -> ${status}`,
      ip_address,
      user_agent
    });

    return wrapper.data(result.rows[0]);
  }

  // ==================== PLANS ====================
  async insertPlan(payload) {
    const { type, name, display_name, price_idr, duration_days, is_active } = payload;
    const config = PLAN_CONFIG[type];
    if (!config) return wrapper.error(new BadRequestError("Invalid plan type"));

    const extraValue = payload[config.extraColumn];
    const rawQuery = `
      INSERT INTO ${config.table} (name, display_name, price_idr, duration_days, is_active, ${config.extraColumn})
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${config.select}
    `;
    try {
      const result = await this.db.executeQuery(rawQuery, [name, display_name, price_idr, duration_days, is_active, extraValue]);
      return wrapper.data(result.rows[0]);
    } catch (err) {
      return wrapper.error(new InternalServerError("Failed to insert plan. Name might already exist."));
    }
  }

  async updatePlan(payload) {
    const { type, id, name, display_name, price_idr, duration_days, is_active } = payload;
    const config = PLAN_CONFIG[type];
    if (!config) return wrapper.error(new BadRequestError("Invalid plan type"));

    const extraValue = payload[config.extraColumn];
    const rawQuery = `
      UPDATE ${config.table}
      SET name = COALESCE($1, name),
          display_name = COALESCE($2, display_name),
          price_idr = COALESCE($3, price_idr),
          duration_days = COALESCE($4, duration_days),
          is_active = COALESCE($5, is_active),
          ${config.extraColumn} = COALESCE($6, ${config.extraColumn})
      WHERE id = $7
      RETURNING ${config.select}
    `;
    try {
      const result = await this.db.executeQuery(rawQuery, [name, display_name, price_idr, duration_days, is_active, extraValue, id]);
      if (result.rowCount === 0) return wrapper.error(new NotFoundError("Plan not found"));
      return wrapper.data(result.rows[0]);
    } catch (err) {
      return wrapper.error(new InternalServerError("Failed to update plan. Name might already exist."));
    }
  }

  async deletePlan(payload) {
    const { type, id } = payload;
    const config = PLAN_CONFIG[type];
    if (!config) return wrapper.error(new BadRequestError("Invalid plan type"));

    const refQuery = `SELECT COUNT(*) FROM payment_orders WHERE plan_type = $1 AND plan_id = $2`;
    const refResult = await this.db.executeQuery(refQuery, [config.table, id]);
    if (parseInt(refResult?.rows[0]?.count || 0) > 0) {
      return wrapper.error(new ConflictError("Plan is referenced by payment orders. Deactivate it instead (is_active = false)."));
    }

    const rawQuery = `DELETE FROM ${config.table} WHERE id = $1 RETURNING id`;
    try {
      const result = await this.db.executeQuery(rawQuery, [id]);
      if (result.rowCount === 0) return wrapper.error(new NotFoundError("Plan not found"));
      return wrapper.data("Plan deleted successfully");
    } catch (err) {
      return wrapper.error(new ConflictError("Plan is still in use. Deactivate it instead (is_active = false)."));
    }
  }

  // ==================== LOCATIONS ====================
  async insertProvince(payload) {
    const { name } = payload;
    const rawQuery = `INSERT INTO provinces (name) VALUES ($1) RETURNING id, name`;
    try {
      const result = await this.db.executeQuery(rawQuery, [name]);
      return wrapper.data(result.rows[0]);
    } catch (err) {
      return wrapper.error(new InternalServerError("Failed to insert province"));
    }
  }

  async updateProvince(payload) {
    const { id, name } = payload;
    const rawQuery = `UPDATE provinces SET name = $1 WHERE id = $2 RETURNING id, name`;
    const result = await this.db.executeQuery(rawQuery, [name, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Province not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteProvince(payload) {
    const { id } = payload;
    const countQuery = `SELECT COUNT(*) FROM cities WHERE province_id = $1`;
    const countResult = await this.db.executeQuery(countQuery, [id]);
    if (parseInt(countResult?.rows[0]?.count || 0) > 0) {
      return wrapper.error(new ConflictError("Province still has related cities"));
    }

    const rawQuery = `DELETE FROM provinces WHERE id = $1 RETURNING id`;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Province not found"));
    return wrapper.data("Province deleted successfully");
  }

  async insertCity(payload) {
    const { name, province_id } = payload;
    const province = await this.db.executeQuery(`SELECT id FROM provinces WHERE id = $1`, [province_id]);
    if (province.rows.length === 0) return wrapper.error(new NotFoundError("Province not found"));

    const rawQuery = `INSERT INTO cities (name, province_id) VALUES ($1, $2) RETURNING id, name, province_id`;
    try {
      const result = await this.db.executeQuery(rawQuery, [name, province_id]);
      return wrapper.data(result.rows[0]);
    } catch (err) {
      return wrapper.error(new InternalServerError("Failed to insert city"));
    }
  }

  async updateCity(payload) {
    const { id, name, province_id } = payload;
    if (province_id !== undefined) {
      const province = await this.db.executeQuery(`SELECT id FROM provinces WHERE id = $1`, [province_id]);
      if (province.rows.length === 0) return wrapper.error(new NotFoundError("Province not found"));
    }
    const rawQuery = `
      UPDATE cities
      SET name = COALESCE($1, name),
          province_id = COALESCE($2, province_id)
      WHERE id = $3
      RETURNING id, name, province_id
    `;
    const result = await this.db.executeQuery(rawQuery, [name, province_id, id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("City not found"));
    return wrapper.data(result.rows[0]);
  }

  async deleteCity(payload) {
    const { id } = payload;
    const rawQuery = `DELETE FROM cities WHERE id = $1 RETURNING id`;
    const result = await this.db.executeQuery(rawQuery, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("City not found"));
    return wrapper.data("City deleted successfully");
  }

  async deleteApplication(payload) {
    const { id, hard_delete } = payload;
    let query = "";
    if (String(hard_delete) === "true") {
       query = `DELETE FROM job_applications WHERE id = $1 RETURNING id`;
    } else {
       query = `UPDATE job_applications SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`;
    }
    const result = await this.db.executeQuery(query, [id]);
    if (result.rowCount === 0) return wrapper.error(new NotFoundError("Application not found"));
    return wrapper.data("Application deleted successfully");
  }

  /**
   * Resolve Trust & Safety queue item.
   * action: mark_clean | approve_job | reject_job | suspend_user
   */
  async resolveFraudEvent(payload) {
    const { id, action, note, admin_user_id } = payload;

    const eventResult = await this.db.executeQuery(
      `SELECT * FROM fraud_events WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!eventResult?.rows?.length) {
      return wrapper.error(new NotFoundError("Fraud event not found"));
    }
    const event = eventResult.rows[0];
    if (["resolved_clean", "resolved_actioned"].includes(event.status)) {
      return wrapper.error(new BadRequestError("Fraud event already resolved"));
    }

    let resolutionStatus = "resolved_actioned";

    if (action === "mark_clean") {
      resolutionStatus = "resolved_clean";
    } else if (action === "approve_job") {
      if (event.entity_type !== "job_post") {
        return wrapper.error(new BadRequestError("approve_job only applies to job_post events"));
      }
      const statusRecord = await this.db.findOne({ name: "OPEN" }, { id: 1 }, "job_post_statuses");
      if (statusRecord.err) return wrapper.error(new NotFoundError("OPEN status not found"));
      await this.db.executeQuery(
        `UPDATE job_posts SET status_id = $1, reject_reason = NULL, updated_at = NOW() WHERE id = $2`,
        [statusRecord.data.id, event.entity_id]
      );
    } else if (action === "reject_job") {
      if (event.entity_type !== "job_post") {
        return wrapper.error(new BadRequestError("reject_job only applies to job_post events"));
      }
      const statusRecord = await this.db.findOne({ name: "REJECTED" }, { id: 1 }, "job_post_statuses");
      if (statusRecord.err) return wrapper.error(new NotFoundError("REJECTED status not found"));
      const reason = note && String(note).trim() ? String(note).trim() : null;
      await this.db.executeQuery(
        `UPDATE job_posts SET status_id = $1, reject_reason = $2, updated_at = NOW() WHERE id = $3`,
        [statusRecord.data.id, reason, event.entity_id]
      );
    } else if (action === "suspend_user") {
      let userId = null;
      if (event.entity_type === "job_post") {
        const owner = await this.db.executeQuery(
          `SELECT r.user_id FROM job_posts jp
           JOIN recruiters r ON r.id = jp.recruiter_id
           WHERE jp.id = $1 LIMIT 1`,
          [event.entity_id]
        );
        userId = owner?.rows?.[0]?.user_id || null;
        const statusRecord = await this.db.findOne({ name: "REJECTED" }, { id: 1 }, "job_post_statuses");
        if (!statusRecord.err) {
          await this.db.executeQuery(
            `UPDATE job_posts SET status_id = $1, updated_at = NOW() WHERE id = $2`,
            [statusRecord.data.id, event.entity_id]
          );
        }
      } else if (event.entity_type === "user") {
        userId = event.entity_id;
      } else if (event.entity_type === "chat_message") {
        const meta =
          typeof event.metadata === "string"
            ? JSON.parse(event.metadata || "{}")
            : event.metadata || {};
        userId = meta.reported_user_id || null;
        if (!userId) {
          const sender = await this.db.executeQuery(
            `SELECT sender_id FROM messages WHERE id = $1 LIMIT 1`,
            [event.entity_id]
          );
          userId = sender?.rows?.[0]?.sender_id || null;
        }
      }
      if (!userId) {
        return wrapper.error(new BadRequestError("Unable to resolve user to suspend for this event"));
      }
      await this.db.executeQuery(
        `UPDATE users SET is_suspended = TRUE, updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    } else {
      return wrapper.error(new BadRequestError("Invalid resolution action"));
    }

    const updated = await this.db.executeQuery(
      `
      UPDATE fraud_events SET
        status = $2,
        resolved_by = $3,
        resolved_at = NOW(),
        resolution_action = $4,
        resolution_note = $5,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, resolutionStatus, admin_user_id || null, action, note || null]
    );

    // Sync linked chat_reports if present in metadata
    try {
      const meta =
        typeof event.metadata === "string"
          ? JSON.parse(event.metadata || "{}")
          : event.metadata || {};
      if (meta.chat_report_id) {
        await this.db.executeQuery(
          `
          UPDATE chat_reports SET
            status = 'resolved',
            resolved_by = $2,
            resolved_at = NOW(),
            resolution_note = $3,
            updated_at = NOW()
          WHERE id = $1 AND status = 'open'
          `,
          [meta.chat_report_id, admin_user_id || null, note || null]
        );
      }
    } catch (_) {
      // non-fatal
    }

    await this.insertAuditLog({
      user_id: admin_user_id,
      action: ACTIONS.FRAUD_EVENT_RESOLVE(action),
      ip_address: payload.ip_address || null,
      user_agent: payload.user_agent || null,
    });

    return wrapper.data(updated.rows[0]);
  }
}

module.exports = AdminCommand;
