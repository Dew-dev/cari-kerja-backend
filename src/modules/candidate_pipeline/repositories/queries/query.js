const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "CandidatePipeline-Query";

const DEFAULT_STAGES = [
  { name: "Applied", stage_type: "applied", position: 0, is_system: true, color: "#64748B" },
  { name: "Screening", stage_type: "screening", position: 1, is_system: false, color: "#3B82F6" },
  { name: "Interview", stage_type: "interview", position: 2, is_system: false, color: "#F59E0B" },
  { name: "Offer", stage_type: "offer", position: 3, is_system: false, color: "#8B5CF6" },
  { name: "Hired", stage_type: "hired", position: 4, is_system: true, color: "#22C55E" },
  { name: "Rejected", stage_type: "rejected", position: 5, is_system: true, color: "#EF4444" },
];

class Query {
  constructor(db) {
    this.db = db;
  }

  async findJobPostOwner(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, recruiter_id FROM job_posts WHERE id = $1 LIMIT 1;`,
        [job_post_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findJobPostOwner", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findStagesByJobPost(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, name, stage_type, position, is_system, color
         FROM application_statuses
         WHERE job_post_id = $1
         ORDER BY position ASC, id ASC;`,
        [job_post_id],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findStagesByJobPost", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async ensureStagesForJobPost(job_post_id) {
    const existing = await this.findStagesByJobPost(job_post_id);
    if (existing.err) return existing;
    if (existing.data.length > 0) return existing;

    try {
      const values = [];
      const placeholders = DEFAULT_STAGES.map((stage, i) => {
        const base = i * 6;
        values.push(job_post_id, stage.name, stage.stage_type, stage.position, stage.is_system, stage.color);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      }).join(", ");

      const res = await this.db.executeQuery(
        `INSERT INTO application_statuses (job_post_id, name, stage_type, position, is_system, color)
         VALUES ${placeholders}
         RETURNING id, name, stage_type, position, is_system, color;`,
        values,
      );

      const rows = (res?.rows || []).sort((a, b) => a.position - b.position);
      return wrapper.data(rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "ensureStagesForJobPost", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findStageById({ stage_id, job_post_id }) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, name, stage_type, position, is_system, color, job_post_id
         FROM application_statuses
         WHERE id = $1 AND job_post_id = $2
         LIMIT 1;`,
        [stage_id, job_post_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findStageById", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findMaxStagePosition(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT COALESCE(MAX(position), -1) AS max_position
         FROM application_statuses
         WHERE job_post_id = $1;`,
        [job_post_id],
      );
      return wrapper.data(parseInt(res?.rows?.[0]?.max_position ?? -1, 10));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findMaxStagePosition", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countApplicationsByStage(stage_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT COUNT(*) AS count FROM job_applications WHERE application_status_id = $1;`,
        [stage_id],
      );
      return wrapper.data(parseInt(res?.rows?.[0]?.count ?? 0, 10));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countApplicationsByStage", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findPipelineCandidates({
    recruiter_id,
    jobPostIds,
    search,
    stage_type,
    sort = "updated_at",
    order = "desc",
    min_match_score,
    limit,
    offset,
  }) {
    try {
      const conditions = [`jp.recruiter_id = $1`];
      const values = [recruiter_id];
      let idx = 2;

      if (Array.isArray(jobPostIds) && jobPostIds.length > 0) {
        conditions.push(`ja.job_post_id = ANY($${idx}::uuid[])`);
        values.push(jobPostIds);
        idx += 1;
      }

      if (search) {
        conditions.push(`w.name ILIKE $${idx}`);
        values.push(`%${search}%`);
        idx += 1;
      }

      if (stage_type) {
        conditions.push(`ast.stage_type = $${idx}`);
        values.push(stage_type);
        idx += 1;
      }

      if (min_match_score !== undefined && min_match_score !== null && min_match_score !== "") {
        conditions.push(`ams.match_score >= $${idx}`);
        values.push(Number(min_match_score));
        idx += 1;
      }

      const whereClause = conditions.join(" AND ");

      const orderDirection = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";
      let orderClause = `ja.updated_at ${orderDirection}`;
      if (sort === "applied_at") {
        orderClause = `ja.applied_at ${orderDirection}`;
      } else if (sort === "match_score") {
        orderClause = `ams.match_score ${orderDirection} NULLS LAST, ja.updated_at DESC`;
      }

      const countRes = await this.db.executeQuery(
        `SELECT COUNT(*) AS total
         FROM job_applications ja
         JOIN job_posts jp ON jp.id = ja.job_post_id
         JOIN workers w ON w.id = ja.worker_id
         LEFT JOIN application_statuses ast ON ast.id = ja.application_status_id
         LEFT JOIN application_match_scores ams ON ams.application_id = ja.id
         WHERE ${whereClause};`,
        values,
      );
      const total = parseInt(countRes?.rows?.[0]?.total ?? 0, 10);

      const dataValues = [...values, limit, offset];
      const dataRes = await this.db.executeQuery(
        `SELECT
            ja.id AS application_id,
            ja.worker_id,
            w.name,
            u.email,
            w.avatar_url,
            ja.job_post_id,
            jp.title AS job_post_title,
            ast.id AS stage_id,
            ast.name AS stage_name,
            ast.stage_type,
            ja.applied_at,
            ja.updated_at,
            ams.match_score,
            ams.match_status,
            ams.match_breakdown,
            ams.match_reasons,
            ams.computed_at AS match_computed_at
         FROM job_applications ja
         JOIN job_posts jp ON jp.id = ja.job_post_id
         JOIN workers w ON w.id = ja.worker_id
         JOIN users u ON u.id = w.user_id
         LEFT JOIN application_statuses ast ON ast.id = ja.application_status_id
         LEFT JOIN application_match_scores ams ON ams.application_id = ja.id
         WHERE ${whereClause}
         ORDER BY ${orderClause}
         LIMIT $${idx} OFFSET $${idx + 1};`,
        dataValues,
      );

      return wrapper.paginationData(dataRes?.rows || [], { total });
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findPipelineCandidates", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findStageCounts({ recruiter_id, jobPostIds }) {
    try {
      const conditions = [`jp.recruiter_id = $1`];
      const values = [recruiter_id];
      let idx = 2;

      if (Array.isArray(jobPostIds) && jobPostIds.length > 0) {
        conditions.push(`ast.job_post_id = ANY($${idx}::uuid[])`);
        values.push(jobPostIds);
        idx += 1;
      }

      const res = await this.db.executeQuery(
        `SELECT
            ast.id AS stage_id,
            ast.stage_type,
            ast.name,
            COUNT(ja.id) AS count
         FROM application_statuses ast
         JOIN job_posts jp ON jp.id = ast.job_post_id
         LEFT JOIN job_applications ja ON ja.application_status_id = ast.id
         WHERE ${conditions.join(" AND ")}
         GROUP BY ast.id, ast.stage_type, ast.name, ast.position
         ORDER BY ast.position ASC;`,
        values,
      );

      const rows = (res?.rows || []).map((r) => ({ ...r, count: parseInt(r.count, 10) }));
      return wrapper.data(rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findStageCounts", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countTotalApplications({ recruiter_id, jobPostIds }) {
    try {
      const conditions = [`jp.recruiter_id = $1`];
      const values = [recruiter_id];
      let idx = 2;

      if (Array.isArray(jobPostIds) && jobPostIds.length > 0) {
        conditions.push(`ja.job_post_id = ANY($${idx}::uuid[])`);
        values.push(jobPostIds);
        idx += 1;
      }

      const res = await this.db.executeQuery(
        `SELECT COUNT(*) AS total
         FROM job_applications ja
         JOIN job_posts jp ON jp.id = ja.job_post_id
         WHERE ${conditions.join(" AND ")};`,
        values,
      );
      return wrapper.data(parseInt(res?.rows?.[0]?.total ?? 0, 10));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countTotalApplications", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findReachedCounts({ recruiter_id, jobPostIds }) {
    try {
      const conditions = [`jp.recruiter_id = $1`];
      const values = [recruiter_id];
      let idx = 2;

      if (Array.isArray(jobPostIds) && jobPostIds.length > 0) {
        conditions.push(`ja.job_post_id = ANY($${idx}::uuid[])`);
        values.push(jobPostIds);
        idx += 1;
      }

      const res = await this.db.executeQuery(
        `SELECT s.stage_type, COUNT(DISTINCT h.application_id) AS count
         FROM application_stage_history h
         JOIN application_statuses s ON s.id = h.to_stage_id
         JOIN job_applications ja ON ja.id = h.application_id
         JOIN job_posts jp ON jp.id = ja.job_post_id
         WHERE ${conditions.join(" AND ")}
           AND s.stage_type IN ('screening', 'interview', 'offer', 'hired')
         GROUP BY s.stage_type;`,
        values,
      );

      const rows = (res?.rows || []).map((r) => ({ ...r, count: parseInt(r.count, 10) }));
      return wrapper.data(rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findReachedCounts", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findStagesForSingleJobPost(job_post_id) {
    return this.findStagesByJobPost(job_post_id);
  }

  async findApplicationContext(application_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT ja.id, ja.applied_at, ja.job_post_id, jp.recruiter_id, jp.title AS job_title
         FROM job_applications ja
         JOIN job_posts jp ON jp.id = ja.job_post_id
         WHERE ja.id = $1
         LIMIT 1;`,
        [application_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findApplicationContext", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findStageHistoryByApplication(application_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            h.id,
            h.created_at,
            h.note,
            fs.name AS from_name,
            fs.stage_type AS from_stage_type,
            ts.name AS to_name,
            ts.stage_type AS to_stage_type,
            r.contact_name AS actor_name
         FROM application_stage_history h
         LEFT JOIN application_statuses fs ON fs.id = h.from_stage_id
         JOIN application_statuses ts ON ts.id = h.to_stage_id
         LEFT JOIN recruiters r ON r.id = h.changed_by_recruiter_id
         WHERE h.application_id = $1
         ORDER BY h.created_at ASC;`,
        [application_id],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findStageHistoryByApplication", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findNotesByApplication(application_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT n.id, n.note, n.created_at, r.contact_name AS actor_name
         FROM application_notes n
         JOIN recruiters r ON r.id = n.recruiter_id
         WHERE n.application_id = $1
         ORDER BY n.created_at ASC;`,
        [application_id],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findNotesByApplication", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
