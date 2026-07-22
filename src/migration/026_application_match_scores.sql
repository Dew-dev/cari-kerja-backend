-- Smart Candidate Matching: persist hybrid match scores per application
CREATE TABLE IF NOT EXISTS application_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE
    REFERENCES job_applications(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  match_score SMALLINT NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_status VARCHAR(32) NOT NULL DEFAULT 'ready',
  match_breakdown JSONB,
  match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_version VARCHAR(64) NOT NULL,
  job_text_hash VARCHAR(64),
  candidate_text_hash VARCHAR(64),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ams_job_post_score
  ON application_match_scores (job_post_id, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_ams_worker
  ON application_match_scores (worker_id);

CREATE INDEX IF NOT EXISTS idx_ams_status
  ON application_match_scores (match_status);

-- Embedding cache for job/worker canonical text (JSON array of floats)
CREATE TABLE IF NOT EXISTS entity_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(16) NOT NULL,
  entity_id UUID NOT NULL,
  text_hash VARCHAR(64) NOT NULL,
  model_version VARCHAR(64) NOT NULL,
  embedding JSONB NOT NULL,
  source_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, model_version),
  CONSTRAINT chk_entity_embeddings_type CHECK (entity_type IN ('job', 'worker'))
);

CREATE INDEX IF NOT EXISTS idx_entity_embeddings_lookup
  ON entity_embeddings (entity_type, entity_id, text_hash);

-- Seed example scores for existing applications (idempotent)
INSERT INTO application_match_scores (
  application_id,
  job_post_id,
  worker_id,
  match_score,
  match_status,
  match_breakdown,
  match_reasons,
  model_version,
  computed_at
)
SELECT
  ja.id,
  ja.job_post_id,
  ja.worker_id,
  72,
  'ready',
  jsonb_build_object(
    'semantic', 70,
    'skills', 80,
    'experience', 65,
    'education', 70
  ),
  jsonb_build_array(
    jsonb_build_object(
      'type', 'skills',
      'label', 'Strong skill overlap with job requirements',
      'score', 80
    ),
    jsonb_build_object(
      'type', 'semantic',
      'label', 'Profile text aligns with job description',
      'score', 70
    )
  ),
  'hybrid-v1',
  NOW()
FROM job_applications ja
ON CONFLICT (application_id) DO NOTHING;
