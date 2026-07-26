const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, ForbiddenError } = require("../../../../helpers/errors");
const ctx = "CandidatePipeline-Query-Domain";

const parseJobPostIds = (job_post_id) => {
  if (!job_post_id) return [];
  if (Array.isArray(job_post_id)) return job_post_id;
  return job_post_id
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

class CandidatePipeline {
  constructor(db) {
    this.query = new Query(db);
  }

  async _verifyJobPostOwnership(job_post_id, recruiter_id) {
    const owner = await this.query.findJobPostOwner(job_post_id);
    if (owner.err || !owner.data) {
      return wrapper.error(new NotFoundError("Job post not found"));
    }
    if (owner.data.recruiter_id !== recruiter_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to access this job post"));
    }
    return wrapper.data(owner.data);
  }

  async getStages(payload) {
    const { job_post_id, recruiter_id } = payload;

    const ownership = await this._verifyJobPostOwnership(job_post_id, recruiter_id);
    if (ownership.err) return ownership;

    const stages = await this.query.ensureStagesForJobPost(job_post_id);
    if (stages.err) {
      logger.error(ctx, "getStages", "Failed to load stages", stages.err);
      return wrapper.error(new NotFoundError("Failed to load stages"));
    }

    return wrapper.data(stages.data);
  }

  async getPipelineCandidates(payload) {
    const {
      recruiter_id,
      job_post_id,
      search,
      stage_type,
      sort = "updated_at",
      order = "desc",
      min_match_score,
      page = 1,
      limit = 10,
    } = payload;
    const jobPostIds = parseJobPostIds(job_post_id);
    const offset = (page - 1) * limit;

    const result = await this.query.findPipelineCandidates({
      recruiter_id,
      jobPostIds,
      search,
      stage_type,
      sort,
      order,
      min_match_score,
      limit,
      offset,
    });

    if (result.err) {
      logger.error(ctx, "getPipelineCandidates", "Failed to load candidates", result.err);
      return wrapper.error(new NotFoundError("Failed to load candidates"));
    }

    const rows = (result.data || []).map((row) => ({
      ...row,
      match_score: row.match_score == null ? 0 : Number(row.match_score),
      match_status: row.match_status || "pending",
      match_reasons: Array.isArray(row.match_reasons) ? row.match_reasons : row.match_reasons || [],
    }));

    const matchScoresAvailable = result.meta?.match_scores_available !== false;

    // Kick off scoring for still-pending applications so cards leave "Calculating…"
    // Prefer sync (await) for a few rows so drawer/list get terminal ready/failed quickly.
    // Skip entirely when AMS join fell back (fake pending on every row).
    if (matchScoresAvailable) {
      const pendingApps = rows
        .filter((row) => {
          if (!row.application_id) return false;
          const status = String(row.match_status || "pending");
          return !["ready", "failed", "insufficient_data"].includes(status);
        })
        .slice(0, 5);
      if (pendingApps.length > 0) {
        const {
          enqueueOrComputeApplicationMatch,
        } = require("../../../../helpers/queues/matching.queue");
        // Await sync for first batch so response can refresh statuses when possible.
        try {
          const settled = await Promise.allSettled(
            pendingApps.map((row) =>
              enqueueOrComputeApplicationMatch(row.application_id, { preferSync: true }),
            ),
          );
          for (let i = 0; i < settled.length; i += 1) {
            const item = settled[i];
            if (item.status !== "fulfilled" || !item.value || item.value.mode !== "sync") continue;
            const data = item.value.data;
            const scoreRow = data?.match || data;
            if (!scoreRow || scoreRow.match_score == null) continue;
            const appId = pendingApps[i].application_id;
            const target = rows.find((r) => r.application_id === appId);
            if (!target) continue;
            target.match_score = Number(scoreRow.match_score);
            target.match_status = scoreRow.match_status || "ready";
            if (scoreRow.match_breakdown) target.match_breakdown = scoreRow.match_breakdown;
            if (scoreRow.match_reasons) target.match_reasons = scoreRow.match_reasons;
          }
        } catch (err) {
          logger.error(ctx, "getPipelineCandidates", "pending match kickoff failed", err.message || err);
        }
      }
    }

    const total = result.meta?.total ?? 0;
    return wrapper.paginationData(rows, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPage: limit > 0 ? Math.ceil(total / limit) : 0,
      // Keep aliases expected by various FE clients
      total_data: total,
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
      per_page: parseInt(limit, 10),
    });
  }

  async getPipelineAnalytics(payload) {
    const { recruiter_id, job_post_id } = payload;
    const jobPostIds = parseJobPostIds(job_post_id);

    const stageCountsResult = await this.query.findStageCounts({ recruiter_id, jobPostIds });
    if (stageCountsResult.err) {
      logger.error(ctx, "getPipelineAnalytics", "Failed to load stage counts", stageCountsResult.err);
      return wrapper.error(new NotFoundError("Failed to load pipeline analytics"));
    }

    // Conversion Rate removed from product — keep empty array for backward-compatible clients.
    return wrapper.data({
      stage_counts: stageCountsResult.data,
      conversion_rates: [],
    });
  }

  async getApplicationTimeline(payload) {
    const { application_id, recruiter_id } = payload;

    const context = await this.query.findApplicationContext(application_id);
    if (context.err || !context.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }
    if (context.data.recruiter_id !== recruiter_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to access this application"));
    }

    const [historyResult, notesResult] = await Promise.all([
      this.query.findStageHistoryByApplication(application_id),
      this.query.findNotesByApplication(application_id),
    ]);

    const events = [];

    events.push({
      id: `applied-${application_id}`,
      type: "applied",
      title: "Melamar pekerjaan",
      description: `Melamar untuk ${context.data.job_title}`,
      created_at: context.data.applied_at,
      actor_name: null,
    });

    if (!historyResult.err) {
      for (const h of historyResult.data) {
        events.push({
          id: h.id,
          type: "stage_change",
          title: h.from_name
            ? `${h.from_name} \u2192 ${h.to_name}`
            : `Ditempatkan di ${h.to_name}`,
          description: h.note ?? null,
          created_at: h.created_at,
          actor_name: h.actor_name ?? null,
        });
      }
    }

    if (!notesResult.err) {
      for (const n of notesResult.data) {
        events.push({
          id: n.id,
          type: "note",
          title: "Catatan recruiter",
          description: n.note,
          created_at: n.created_at,
          actor_name: n.actor_name ?? null,
        });
      }
    }

    events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return wrapper.data(events);
  }
}

module.exports = CandidatePipeline;
