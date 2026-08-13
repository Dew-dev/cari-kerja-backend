const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "JobAlerts-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findWorkerJobAlertsPreference(worker_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT w.id, w.job_alerts_enabled, w.job_alerts_last_sent_at,
                u.email, u.login_provider, u.telegram_chat_id
         FROM workers w
         JOIN users u ON u.id = w.user_id
         WHERE w.id = $1 AND w.deleted_at IS NULL
         LIMIT 1`,
        [worker_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findWorkerJobAlertsPreference", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  /**
   * Workers eligible for today's digest:
   * - job_alerts_enabled
   * - local/google with email OR telegram login with bot linked (telegram_chat_id)
   * - not soft-deleted
   * - not already sent today (Asia/Jakarta calendar day)
   */
  async findEligibleWorkers({ limit = 200, offset = 0 } = {}) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            w.id AS worker_id,
            w.name AS worker_name,
            w.expected_salary,
            u.id AS user_id,
            u.email,
            u.login_provider,
            u.telegram_chat_id
         FROM workers w
         JOIN users u ON u.id = w.user_id
         WHERE w.deleted_at IS NULL
           AND w.job_alerts_enabled = TRUE
           AND (
             (
               u.login_provider IN ('local', 'google')
               AND u.email IS NOT NULL
               AND TRIM(u.email) <> ''
             )
             OR (
               u.login_provider = 'telegram'
               AND u.telegram_chat_id IS NOT NULL
             )
           )
           AND (
             w.job_alerts_last_sent_at IS NULL
             OR (w.job_alerts_last_sent_at AT TIME ZONE 'Asia/Jakarta')::date
                < (NOW() AT TIME ZONE 'Asia/Jakarta')::date
           )
         ORDER BY w.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findEligibleWorkers", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  /**
   * Match OPEN jobs by skill overlap, salary fit, and recent job title keywords.
   */
  async findMatchingJobsForWorker(worker_id, { limit = 10 } = {}) {
    try {
      const res = await this.db.executeQuery(
        `WITH worker_ctx AS (
           SELECT
             w.id,
             w.expected_salary,
             (
               SELECT string_agg(DISTINCT LOWER(we.job_title), ' ')
               FROM work_experiences we
               WHERE we.worker_id = w.id
             ) AS title_keywords
           FROM workers w
           WHERE w.id = $1 AND w.deleted_at IS NULL
         ),
         scored AS (
           SELECT
             jp.id,
             jp.title,
             jp.location,
             jp.salary_min,
             jp.salary_max,
             jp.created_at,
             r.company_name,
             c.code AS currency,
             COALESCE(skill_match.cnt, 0)::int AS skill_match_count,
             CASE
               WHEN wc.expected_salary IS NULL THEN 0
               WHEN jp.salary_max IS NOT NULL AND jp.salary_max < (wc.expected_salary * 0.7) THEN 0
               WHEN jp.salary_min IS NOT NULL AND jp.salary_min > (wc.expected_salary * 1.5) THEN 0
               ELSE 1
             END AS salary_fit,
             CASE
               WHEN wc.title_keywords IS NULL OR LENGTH(TRIM(wc.title_keywords)) = 0 THEN 0
               WHEN EXISTS (
                 SELECT 1
                 FROM unnest(string_to_array(wc.title_keywords, ' ')) AS kw(word)
                 WHERE LENGTH(kw.word) >= 3
                   AND LOWER(jp.title) ILIKE '%' || kw.word || '%'
               ) THEN 1
               ELSE 0
             END AS title_fit
           FROM job_posts jp
           CROSS JOIN worker_ctx wc
           JOIN recruiters r ON r.id = jp.recruiter_id
           LEFT JOIN currencies c ON c.id = jp.currency_id
           LEFT JOIN LATERAL (
             SELECT COUNT(*) AS cnt
             FROM job_post_skills jps
             JOIN worker_skills ws ON ws.skill_id = jps.skill_id AND ws.worker_id = wc.id
             WHERE jps.job_post_id = jp.id
           ) skill_match ON TRUE
           WHERE jp.status_id = 1
             AND jp.archived_at IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM job_applications ja
               WHERE ja.job_post_id = jp.id AND ja.worker_id = wc.id
             )
         )
         SELECT id, title, location, salary_min, salary_max, company_name, currency,
                skill_match_count, salary_fit, title_fit
         FROM scored
         WHERE skill_match_count > 0 OR salary_fit > 0 OR title_fit > 0
         ORDER BY
           (skill_match_count * 3 + salary_fit * 2 + title_fit * 2) DESC,
           skill_match_count DESC,
           created_at DESC
         LIMIT $2`,
        [worker_id, limit],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findMatchingJobsForWorker", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
