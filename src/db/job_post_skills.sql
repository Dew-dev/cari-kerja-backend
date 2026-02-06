-- Create job_post_skills junction table (many-to-many)
CREATE TABLE IF NOT EXISTS job_post_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_job_post FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate entries
  CONSTRAINT unique_job_post_skill UNIQUE (job_post_id, skill_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_post_skills_job_post_id ON job_post_skills(job_post_id);
CREATE INDEX IF NOT EXISTS idx_job_post_skills_skill_id ON job_post_skills(skill_id);

-- Create index for matching worker skills to job posts
CREATE INDEX IF NOT EXISTS idx_job_post_skills_composite ON job_post_skills(skill_id, job_post_id);
