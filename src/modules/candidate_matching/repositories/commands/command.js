const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "CandidateMatching-Command";

class Command {
  constructor(db) {
    this.db = db;
  }

  async upsertMatchScore(payload) {
    try {
      const {
        application_id,
        job_post_id,
        worker_id,
        match_score,
        match_status,
        match_breakdown,
        match_reasons,
        model_version,
        job_text_hash,
        candidate_text_hash,
      } = payload;

      const res = await this.db.executeQuery(
        `INSERT INTO application_match_scores (
            application_id, job_post_id, worker_id,
            match_score, match_status, match_breakdown, match_reasons,
            model_version, job_text_hash, candidate_text_hash,
            computed_at, created_at, updated_at
         ) VALUES (
            $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, NOW(), NOW(), NOW()
         )
         ON CONFLICT (application_id) DO UPDATE SET
            job_post_id = EXCLUDED.job_post_id,
            worker_id = EXCLUDED.worker_id,
            match_score = EXCLUDED.match_score,
            match_status = EXCLUDED.match_status,
            match_breakdown = EXCLUDED.match_breakdown,
            match_reasons = EXCLUDED.match_reasons,
            model_version = EXCLUDED.model_version,
            job_text_hash = EXCLUDED.job_text_hash,
            candidate_text_hash = EXCLUDED.candidate_text_hash,
            computed_at = NOW(),
            updated_at = NOW()
         RETURNING
            id, application_id, job_post_id, worker_id,
            match_score, match_status, match_breakdown, match_reasons,
            model_version, job_text_hash, candidate_text_hash, computed_at`,
        [
          application_id,
          job_post_id,
          worker_id,
          match_score,
          match_status,
          JSON.stringify(match_breakdown || {}),
          JSON.stringify(match_reasons || []),
          model_version,
          job_text_hash || null,
          candidate_text_hash || null,
        ],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "upsertMatchScore failed", "command", error);
      return wrapper.error(error);
    }
  }

  async upsertEmbedding(payload) {
    try {
      const {
        entity_type,
        entity_id,
        text_hash,
        model_version,
        embedding,
        source_text,
      } = payload;

      const res = await this.db.executeQuery(
        `INSERT INTO entity_embeddings (
            entity_type, entity_id, text_hash, model_version, embedding, source_text,
            created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), NOW())
         ON CONFLICT (entity_type, entity_id, model_version) DO UPDATE SET
            text_hash = EXCLUDED.text_hash,
            embedding = EXCLUDED.embedding,
            source_text = EXCLUDED.source_text,
            updated_at = NOW()
         RETURNING id, entity_type, entity_id, text_hash, model_version`,
        [
          entity_type,
          entity_id,
          text_hash,
          model_version,
          JSON.stringify(embedding),
          source_text || null,
        ],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "upsertEmbedding failed", "command", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
