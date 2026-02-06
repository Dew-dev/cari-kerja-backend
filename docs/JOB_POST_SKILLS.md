# Job Post Skills Integration

## Overview
Added many-to-many relationship between `job_posts` and `skills` tables to enable skill-based job matching.

## Database Changes

### New Table: `job_post_skills`
```sql
CREATE TABLE job_post_skills (
  id UUID PRIMARY KEY,
  job_post_id UUID NOT NULL (FK -> job_posts),
  skill_id UUID NOT NULL (FK -> skills),
  created_at TIMESTAMP,
  UNIQUE(job_post_id, skill_id)
)
```

Migration file: `src/db/job_post_skills.sql`

## API Changes

### Create Job Post
**Endpoint:** `POST /api/v1/jobposts`
**New Field:**
```json
{
  "skills": ["uuid1", "uuid2", "uuid3"] // Array of skill IDs (optional)
}
```

### Update Job Post
**Endpoint:** `PUT /api/v1/jobposts/:id`
**New Field:**
```json
{
  "skills": ["uuid1", "uuid2"] // Array of skill IDs (optional)
}
```

## Response Changes

All endpoints that return job posts now include a `skills` array:

```json
{
  "id": "job-uuid",
  "title": "Software Engineer",
  "skills": [
    {
      "id": "skill-uuid-1",
      "name": "JavaScript"
    },
    {
      "id": "skill-uuid-2",
      "name": "Node.js"
    }
  ]
}
```

### Affected Endpoints:
- `GET /api/v1/jobposts` - List all job posts
- `GET /api/v1/jobposts/:id` - Get single job post
- `GET /api/v1/jobposts/applied` - Get applied jobs
- `GET /api/v1/jobposts/self` - Get recruiter's own jobs

## Future Use Cases

The skills data can be used for:
1. **Skill-based job recommendations** - Match worker skills with job requirements
2. **Priority sorting** - Show jobs matching worker's skills first
3. **Filtering** - Allow workers to filter jobs by required skills
4. **Analytics** - Track most demanded skills in job market

### Example Query for Matching:
```sql
-- Get jobs matching worker's skills, ordered by match count
SELECT j.*, COUNT(jps.skill_id) as skill_match_count
FROM job_posts j
JOIN job_post_skills jps ON jps.job_post_id = j.id
WHERE jps.skill_id IN (
  SELECT skill_id FROM worker_skills WHERE worker_id = $1
)
GROUP BY j.id
ORDER BY skill_match_count DESC;
```

## Implementation Details

### Files Modified:
- `src/modules/job_posts/repositories/commands/domain.js` - Added skills insert/update logic
- `src/modules/job_posts/repositories/queries/query.js` - Added skills to SELECT queries
- `src/modules/job_posts/repositories/commands/command_model.js` - Added skills validation

### Files Created:
- `src/db/job_post_skills.sql` - Migration for junction table
