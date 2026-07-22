const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const config = require("../../../../config/global_config");
const {
  NotFoundError,
  ForbiddenError,
  InternalServerError,
  BadRequestError,
} = require("../../../../helpers/errors");
const {
  buildJobText,
  buildWorkerText,
  hashText,
  isInsufficientText,
} = require("../../services/text_builder");
const { embedText } = require("../../services/embedding_client");
const { computeHybridScore } = require("../../services/scorer");
const {
  indexEntity,
  knnSemanticSimilarity,
  ensureIndices,
  reindexFromRows,
} = require("../../services/elasticsearch_index");
const { isEnabled: isEsEnabled } = require("../../../../helpers/databases/elasticsearch/client");

const ctx = "CandidateMatching-Command-Domain";

const totalYearsFromExperiences = (experiences = []) => {
  let days = 0;
  const now = new Date();
  for (const exp of experiences) {
    if (!exp.start_date) continue;
    const start = new Date(exp.start_date);
    const end = exp.is_current || !exp.end_date ? now : new Date(exp.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    days += Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
  }
  return Math.round((days / 365.25) * 10) / 10;
};

const parseEmbedding = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

class CandidateMatchingCommand {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async _getOrCreateEmbedding({ entity_type, entity_id, text, text_hash, model_version }) {
    const cached = await this.query.findEmbedding({
      entity_type,
      entity_id,
      model_version,
    });

    if (!cached.err && cached.data && cached.data.text_hash === text_hash) {
      const embedding = parseEmbedding(cached.data.embedding);
      // Keep ES index warm even on cache hit (idempotent upsert)
      await indexEntity({
        entity_type,
        entity_id,
        text_hash,
        model_version,
        embedding,
        source_text: text.slice(0, 4000),
      });
      return {
        embedding,
        provider: "cache",
      };
    }

    const result = await embedText(text);
    await this.command.upsertEmbedding({
      entity_type,
      entity_id,
      text_hash,
      model_version,
      embedding: result.embedding,
      source_text: text.slice(0, 4000),
    });

    await indexEntity({
      entity_type,
      entity_id,
      text_hash,
      model_version,
      embedding: result.embedding,
      source_text: text.slice(0, 4000),
    });

    return result;
  }

  /**
   * Compute and persist match score for one application.
   * Idempotent when hashes + model_version unchanged.
   */
  async computeApplicationMatch({ application_id, force = false }) {
    const matching = config.get("/matching") || {};
    if (matching.enabled === false) {
      return wrapper.data({ skipped: true, reason: "matching_disabled" });
    }

    const model_version = matching.modelVersion || "hybrid-v1";

    const app = await this.query.findApplicationContext(application_id);
    if (app.err || !app.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    const { job_post_id, worker_id } = app.data;

    const [jobSrc, workerSrc] = await Promise.all([
      this.query.findJobTextSources(job_post_id),
      this.query.findWorkerTextSources(worker_id),
    ]);

    if (jobSrc.err || !jobSrc.data) {
      return wrapper.error(new NotFoundError("Job post not found"));
    }
    if (workerSrc.err || !workerSrc.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    const jobText = buildJobText(jobSrc.data);
    const workerText = buildWorkerText(workerSrc.data);
    const job_text_hash = hashText(jobText);
    const candidate_text_hash = hashText(workerText);

    if (!force) {
      const existing = await this.query.findMatchByApplication(application_id);
      if (
        !existing.err &&
        existing.data &&
        existing.data.model_version === model_version &&
        existing.data.job_text_hash === job_text_hash &&
        existing.data.candidate_text_hash === candidate_text_hash &&
        existing.data.match_status === "ready"
      ) {
        return wrapper.data({ skipped: true, reason: "unchanged", match: existing.data });
      }
    }

    if (isInsufficientText(jobText, workerText)) {
      const saved = await this.command.upsertMatchScore({
        application_id,
        job_post_id,
        worker_id,
        match_score: 0,
        match_status: "insufficient_data",
        match_breakdown: {
          semantic: 0,
          skills: 0,
          experience: 0,
          education: 0,
        },
        match_reasons: [
          {
            type: "data",
            label: "Job or candidate profile text is too short to score reliably",
            score: 0,
          },
        ],
        model_version,
        job_text_hash,
        candidate_text_hash,
      });
      if (saved.err) {
        return wrapper.error(new InternalServerError("Failed to save match score"));
      }
      return wrapper.data(saved.data);
    }

    try {
      const [jobEmb, workerEmb] = await Promise.all([
        this._getOrCreateEmbedding({
          entity_type: "job",
          entity_id: job_post_id,
          text: jobText,
          text_hash: job_text_hash,
          model_version,
        }),
        this._getOrCreateEmbedding({
          entity_type: "worker",
          entity_id: worker_id,
          text: workerText,
          text_hash: candidate_text_hash,
          model_version,
        }),
      ]);

      let semanticProvider = "local_cosine";
      let semanticPctOverride;
      if (isEsEnabled()) {
        const knnSim = await knnSemanticSimilarity({
          jobEmbedding: jobEmb.embedding,
          worker_id,
        });
        if (knnSim != null) {
          semanticPctOverride = knnSim * 100;
          semanticProvider = "elasticsearch_knn";
        }
      }

      const scored = computeHybridScore({
        jobEmbedding: jobEmb.embedding,
        workerEmbedding: workerEmb.embedding,
        jobSkillIds: jobSrc.data.skill_ids || [],
        workerSkillIds: workerSrc.data.skill_ids || [],
        experienceLevelName: jobSrc.data.experience_level_name,
        totalYears: totalYearsFromExperiences(workerSrc.data.work_experiences),
        jobText,
        educations: workerSrc.data.educations || [],
        semanticPctOverride,
      });

      const saved = await this.command.upsertMatchScore({
        application_id,
        job_post_id,
        worker_id,
        match_score: scored.match_score,
        match_status: "ready",
        match_breakdown: {
          ...scored.match_breakdown,
          embedding_provider: {
            job: jobEmb.provider,
            worker: workerEmb.provider,
          },
          semantic_provider: semanticProvider,
        },
        match_reasons: scored.match_reasons,
        model_version,
        job_text_hash,
        candidate_text_hash,
      });

      if (saved.err) {
        logger.error(ctx, "computeApplicationMatch", "upsert failed", saved.err);
        return wrapper.error(new InternalServerError("Failed to save match score"));
      }

      return wrapper.data(saved.data);
    } catch (err) {
      logger.error(ctx, "computeApplicationMatch", "scoring failed", err);
      const failed = await this.command.upsertMatchScore({
        application_id,
        job_post_id,
        worker_id,
        match_score: 0,
        match_status: "failed",
        match_breakdown: { error: "scoring_failed" },
        match_reasons: [
          {
            type: "error",
            label: "Match scoring failed; try rematch later",
            score: 0,
          },
        ],
        model_version,
        job_text_hash,
        candidate_text_hash,
      });
      if (failed.err) {
        return wrapper.error(new InternalServerError("Match scoring failed"));
      }
      return wrapper.data(failed.data);
    }
  }

  async rematchJobPost({ job_post_id, recruiter_id }) {
    const owner = await this.query.findJobPostOwner(job_post_id);
    if (owner.err || !owner.data) {
      return wrapper.error(new NotFoundError("Job post not found"));
    }
    if (owner.data.recruiter_id !== recruiter_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to rematch this job post"));
    }

    const apps = await this.query.findApplicationIdsByJobPost(job_post_id);
    if (apps.err) {
      return wrapper.error(new InternalServerError("Failed to load applications"));
    }

    const { enqueueRecomputeJobMatches } = require("../../../../helpers/queues/matching.queue");
    await enqueueRecomputeJobMatches(job_post_id);

    return wrapper.data({
      job_post_id,
      enqueued: true,
      applicant_count: (apps.data || []).length,
    });
  }

  async backfillAllApplications() {
    const matching = config.get("/matching") || {};
    if (matching.enabled === false) {
      return wrapper.error(new BadRequestError("Matching is disabled"));
    }

    const { enqueueComputeApplicationMatch } = require("../../../../helpers/queues/matching.queue");
    let offset = 0;
    const limit = 200;
    let total = 0;

    for (;;) {
      const batch = await this.query.findAllApplicationIds({ limit, offset });
      if (batch.err) {
        return wrapper.error(new InternalServerError("Failed to load applications for backfill"));
      }
      const ids = batch.data || [];
      if (ids.length === 0) break;

      for (const application_id of ids) {
        await enqueueComputeApplicationMatch(application_id);
        total += 1;
      }
      offset += limit;
      if (ids.length < limit) break;
    }

    return wrapper.data({ enqueued: total });
  }

  /**
   * Reindex all rows from entity_embeddings into Elasticsearch dense_vector indices.
   */
  async reindexElasticsearchEmbeddings() {
    if (!isEsEnabled()) {
      return wrapper.error(new BadRequestError("Elasticsearch matching is disabled"));
    }

    await ensureIndices();

    let offset = 0;
    const limit = 200;
    let indexed = 0;
    let skipped = 0;
    let failed = 0;

    for (;;) {
      const batch = await this.query.findAllEmbeddings({ limit, offset });
      if (batch.err) {
        return wrapper.error(new InternalServerError("Failed to load embeddings for ES reindex"));
      }
      const rows = batch.data || [];
      if (rows.length === 0) break;

      const result = await reindexFromRows(rows);
      indexed += result.indexed || 0;
      skipped += result.skipped || 0;
      failed += result.failed || 0;

      offset += limit;
      if (rows.length < limit) break;
    }

    return wrapper.data({ indexed, skipped, failed });
  }
}

module.exports = CandidateMatchingCommand;
