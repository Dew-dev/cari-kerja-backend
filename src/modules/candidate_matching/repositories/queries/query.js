const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "CandidateMatching-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findApplicationContext(application_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            ja.id AS application_id,
            ja.job_post_id,
            ja.worker_id,
            jp.recruiter_id,
            jp.title AS job_title
         FROM job_applications ja
         JOIN job_posts jp ON jp.id = ja.job_post_id
         WHERE ja.id = $1
         LIMIT 1`,
        [application_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findApplicationContext", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findMatchByApplication(application_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            ams.id,
            ams.application_id,
            ams.job_post_id,
            ams.worker_id,
            ams.match_score,
            ams.match_status,
            ams.match_breakdown,
            ams.match_reasons,
            ams.model_version,
            ams.job_text_hash,
            ams.candidate_text_hash,
            ams.computed_at,
            ams.created_at,
            ams.updated_at
         FROM application_match_scores ams
         WHERE ams.application_id = $1
         LIMIT 1`,
        [application_id],
      );
      return wrapper.data(res?.rows?.[0] || null);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findMatchByApplication", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findJobTextSources(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            jp.id,
            jp.title,
            jp.description,
            el.name AS experience_level_name,
            COALESCE(
              (
                SELECT array_agg(s.skill_name ORDER BY s.skill_name)
                FROM job_post_skills jps
                JOIN skills s ON s.id = jps.skill_id
                WHERE jps.job_post_id = jp.id
              ),
              ARRAY[]::text[]
            ) AS skill_names,
            COALESCE(
              (
                SELECT array_agg(jps.skill_id::text)
                FROM job_post_skills jps
                WHERE jps.job_post_id = jp.id
              ),
              ARRAY[]::text[]
            ) AS skill_ids,
            COALESCE(
              (
                SELECT array_agg(r.requirement ORDER BY r.order_index)
                FROM job_post_requirements r
                WHERE r.job_post_id = jp.id
              ),
              ARRAY[]::text[]
            ) AS requirements,
            COALESCE(
              (
                SELECT array_agg(resp.responsibility ORDER BY resp.order_index)
                FROM job_post_responsibilities resp
                WHERE resp.job_post_id = jp.id
              ),
              ARRAY[]::text[]
            ) AS responsibilities,
            COALESCE(
              (
                SELECT array_agg(b.benefit ORDER BY b.order_index)
                FROM job_post_benefits b
                WHERE b.job_post_id = jp.id
              ),
              ARRAY[]::text[]
            ) AS benefits
         FROM job_posts jp
         LEFT JOIN experience_levels el ON el.id = jp.experience_level_id
         WHERE jp.id = $1
         LIMIT 1`,
        [job_post_id],
      );
      return wrapper.data(res?.rows?.[0] || null);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findJobTextSources", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findWorkerTextSources(worker_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            w.id,
            w.profile_summary,
            COALESCE(
              (
                SELECT array_agg(s.skill_name ORDER BY s.skill_name)
                FROM worker_skills ws
                JOIN skills s ON s.id = ws.skill_id
                WHERE ws.worker_id = w.id
              ),
              ARRAY[]::text[]
            ) AS skill_names,
            COALESCE(
              (
                SELECT array_agg(ws.skill_id::text)
                FROM worker_skills ws
                WHERE ws.worker_id = w.id
              ),
              ARRAY[]::text[]
            ) AS skill_ids
         FROM workers w
         WHERE w.id = $1 AND w.deleted_at IS NULL
         LIMIT 1`,
        [worker_id],
      );
      if (!res?.rows?.[0]) return wrapper.data(null);

      const worker = res.rows[0];

      const [expRes, eduRes, certRes] = await Promise.all([
        this.db.executeQuery(
          `SELECT job_title, company_name, description, start_date, end_date, is_current
           FROM work_experiences
           WHERE worker_id = $1
           ORDER BY start_date DESC`,
          [worker_id],
        ),
        this.db.executeQuery(
          `SELECT institution_name, degree, major, description
           FROM educations
           WHERE worker_id = $1
           ORDER BY start_date DESC`,
          [worker_id],
        ),
        this.db.executeQuery(
          `SELECT name, issuer, description
           FROM certifications
           WHERE worker_id = $1
           ORDER BY issue_date DESC`,
          [worker_id],
        ),
      ]);

      worker.work_experiences = expRes?.rows || [];
      worker.educations = eduRes?.rows || [];
      worker.certifications = certRes?.rows || [];

      return wrapper.data(worker);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findWorkerTextSources", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findEmbedding({ entity_type, entity_id, model_version }) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, entity_type, entity_id, text_hash, model_version, embedding, source_text
         FROM entity_embeddings
         WHERE entity_type = $1 AND entity_id = $2 AND model_version = $3
         LIMIT 1`,
        [entity_type, entity_id, model_version],
      );
      return wrapper.data(res?.rows?.[0] || null);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findEmbedding", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findApplicationIdsByJobPost(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id AS application_id
         FROM job_applications
         WHERE job_post_id = $1`,
        [job_post_id],
      );
      return wrapper.data((res?.rows || []).map((r) => r.application_id));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findApplicationIdsByJobPost", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findApplicationIdsByWorker(worker_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id AS application_id
         FROM job_applications
         WHERE worker_id = $1`,
        [worker_id],
      );
      return wrapper.data((res?.rows || []).map((r) => r.application_id));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findApplicationIdsByWorker", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAllApplicationIds({ limit = 500, offset = 0 } = {}) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id AS application_id
         FROM job_applications
         ORDER BY applied_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      return wrapper.data((res?.rows || []).map((r) => r.application_id));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllApplicationIds", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findJobPostOwner(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, recruiter_id FROM job_posts WHERE id = $1 LIMIT 1`,
        [job_post_id],
      );
      return wrapper.data(res?.rows?.[0] || null);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findJobPostOwner", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
