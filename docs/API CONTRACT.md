# API Contract

## Tabel Users

### Login or Signup By Google

**Method**: "GET"

**Endpoint**: "/api/v1/users/google?role_id"

**Req.Query**: role_id

**Response**:

```json
{
  "code": 200,
  "message": "Your request has been processed",
  "success": true,
  "data": {
    "token": string,
    "refreshToken": string
  }
}

```

## A. Tabel workers

### Get One Worker By User Id:

**Method** : "GET"

**Endpoint** : "/api/v1/workers/:user_id"

**Req.Param** : user_id

**Query**: JOIN Table with ALL TABLE that related to workers Table (Reference to ChatGPT for performance: https://chatgpt.com/share/68de21d2-a148-8007-b437-2971a1275732)

**Req.Headers** :

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get worker",
  data: {
      id,
      user_id,
      name,
      avatar_url,
      telephone,
      date_of_birth,
      gender_name,
      country_name,
      marriage_status_name,
      religion_name,
      address,
      profile_summary,
      current_salary,
      expected_salary,
      work_experiences: [{
        id,
        company_name,
        job_title,
        start_date,
        end_date,
        is_current,
        description,
        updated_at
      }],
      certifications: [{
        name,
        issuer,
        issue_date,
        expiry_date,
        credential_id,
        is_active,
        updated_at
      }],
      worker_skills: [{
        skill_id,
        skill_name,
      }],
      educations: [{
        id,
        institution_name,
        degree,
        major,
        start_date,
        end_date,
        is_current,
        description,
        updated_at
      }],
      languages: [{
        id,
        language_name,
        proficiency_level_name,
        is_primary,
      }],
      resume: [{
        id,
        resume_url,
        title,
        is_default
      }],
      portfolios: [{
        id,
        title,
        description,
        link,
        is_public
      }]
    }
  }
```

### Insert Data Worker

**Method** : "POST"

**Endpoint** : "/api/v1/workers"

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  user_id,
  name,
  avatar_url,
  telephone,
  date_of_birth,
  gender_id,
  nationality_id,
  region_id,
  marriage_status_id,
  address,
  profile_summary,
  current_salary,
  expected_salary
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert worker",
  "data": {
    id
  }
}
```

### Update Data Worker {

**Method**: "PUT"

**Endpont**: "/api/v1/workers/:id"

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  id,
  user_id,
  name,
  avatar_url,
  telephone,
  date_of_birth,
  gender_id,
  nationality_id,
  region_id,
  marriage_status_id,
  address,
  profile_summary,
  current_salary,
  expected_salary,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success update worker",
  "data": {
   id
  }
}
```

## Tabel work_experiences

### Get All Work Experiences By Worker Id

**Method**: "GET"

**Endpoint**: "/api/v1/workers/:worker_id/work-exp"

**Req.Params**: worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response** :

```json
{
  "success": true,
  "code": 200,
  "message": "Success get worker experiences",
  "data": [{
    id,
    company_name,
    job_title,
    start_date,
    end_date,
    is_current,
    description,
    updated_at
  }]
}
```

### Get One Work Exp By work exp id

**Method**: "GET"

**Endpoint**: "/api/v1/workers/:worker_id/work-exp/:id",

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get worker experience",
  "data": {
      id,
      company_name,
      job_title,
      start_date,
      end_date,
      is_current,
      description,
      updated_at
    }
}
```

### Insert One Work Experience By Worker Id

**Method**: "POST"

**Endpoint**: "/api/v1/workers/:worker_id/work-exp"

**Req.Params**: worker_id,

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  company_name,
  job_title,
  start_date,
  end_date,
  is_current,
  description,
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert worker experience",
  "data": {
    id
  }
}
```

### Update One Work Experience By Worker Experience Id

**Method**: "PUT"

**Endpoint**: "/api/v1/workers/:worker_id/worker-exp/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  company_name,
  job_title,
  start_date,
  end_date,
  is_current,
  description,
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success update worker experience",
  "data": {
    id
  }
}
```

### Delete One Work Experience By Worker Experience Id

**Method**: DELETE

**Endpoint**: "/api/v1/workers/:worker_id/worker-exp/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get worker",
  "data": "Successfully deleted"
}
```

## Tabel certifications

### Get All certifications By worker id

**Method**: "GET"

**Endpoint**: "/api/v1/workers/:worker_id/cert"

**Req.Params**: worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get certifications",
  "data": [{
    id,
    name,
    issuer,
    issue_date,
    expiry_date,
    credential_id,
    is_active,
    updated_at
  }]
}
```

### Get One certifications by worker id

**Method**: GET

**Endpoint**: "/api/v1/workers/:worker_id/cert/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get certifications",
  "data": {
    id,
    name,
    issuer,
    issue_date,
    expiry_date,
    credential_id,
    is_active,
    updated_at
  }
}
```

### Insert One certifications by worker id

**Method**: POST

**Endpoint**: "/api/v1/workers/:worker_id/cert"

**Req.Params**: worker_id

**Req.Body**:

```json
{
  name,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  is_active
}
```

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert certification",
  "data": {
    id
  }
}
```

### Update One certifications by worker id

**Method**: "PUT"

**Endpoint**: "/api/v1/workers/:worker_id/cert/:id"

**Req.Params**: worker_id, id

**Req.Body**:

```json
{
  name,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  is_active,
  updated_at
}
```

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success update certification",
  "data": {
    id
  }
}
```

### Delete One certification by worker id

**Method**: DELETE

**Endpoint**: "/api/v1/workers/:worker_id/cert/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get certifications",
  "data": "Certification successfully deleted"
}
```

## Tabel worker_skills

### Get All skill by worker id

**Method**: "GET"

**Endpoint**: "/api/v1/workers/:worker_id/skills"

**Query**: JOIN table skill_worker with skills

**Req.Params**: worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get skill worker",
  "data": [{
    skill_name
  }]
}
```

### Insert One Skill by worker id

**Method**: "POST"

**Endpoint**: "/api/v1/workers/:worker_id/skills"

**Req.Params**: worker_id

**Req.Body**:

```json
{
  skill_id
}
```

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert skill",
  "data": {
    id
  }
}
```

### Delete One Skill by worker id and skill id

**Method**: "DELETE"

**Endpoint**: "/api/v1/workers/:worker_id/skills/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Delete skill success",
  "data": "Worker skill successfully deleted"
}
```

## Tabel skills

### Get All skills

**Method**: "GET"

**Endpoint**: "/api/v1/skills?name="

**Req.Query**: name

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get skills",
  "data": [{
    id,
    skill_name,
    created_at
  }]
}
```

### Get One Skill

**Method**: "GET"

**Endpoint**: "/api/v1/skills/:id"

**Req.Params**: id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

Response:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get skill",
  "data": {
    id,
    skill_name,
    created_at
  }
}
```

### Insert One Skill

**Method**: POST

**Endpoint**: "/api/v1/skills"

**Req.Body**:

```json
{
 skill_name
}
```

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success get skill",
  "data": {
    id
  }
}
```

### Delete One Skill

**Method**: "DELETE"

**Endpoint**: "/api/v1/skills/:id"

**Req.Params**: id

**Req.Headers**:

```json
{
  "Authorization": " Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success deleted skill",
  "data": "Skill succesfully deleted"
}
```

## Tabel educations

### Get All Educations by worker id

**Method**: GET

**Endpoint**: "/api/v1/workers/:worker_id/edu"

**Req.Params**: worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get educations",
  "data": [{
    id,
    institution_name,
    degree,
    major,
    start_date,
    end_date,
    is_current,
    description,
    updated_at
  }]
}
```

### Get One Education by worker id

**Method**: "GET"

**Endpoint**: "/api/v1/workers/:worker_id/edu/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get education",
  "data": [{
    id,
    institution_name,
    degree,
    major,
    start_date,
    end_date,
    is_current,
    description,
    updated_at
  }]
}
```

### Insert one Education by worker id

**Method**: POST

**Endpoint**: "/api/v1/workers/:worker_id/edu"

**Req.Params**: worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  institution_name,
  degree,
  major,
  start_date,
  end_date,
  is_current,
  description,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert education",
  "data": {
    id
  }
}
```

### Update one Education by worker id

**Method**: PUT

**Endpoint**: "/api/v1/workers/:worker_id/edu/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  institution_name,
  degree,
  major,
  start_date,
  end_date,
  is_current,
  description,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success updated certification",
  "data": {
    id
  }
}
```

### Delete one Education by worker id

**Method**: DELETE

**Endpoint**: "/api/v1/workers/:worker_id/edu/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success delete education",
  "data": "Education successfully deleted"
}
```

## Tabel languages

### Get all languages by worker id

**Method**: GET

**Endpoint**: "/api/v1/workers/:worker_id/lang"

**Req.Params** : worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get languages",
  "data": [{
    id,
    language_name,
    proficiency_level_name,
    proficiency_level_id,
    is_primary,
    created_at,
    updated_at`
  }]
}
```

### Insert One languange by worker id

**Method**: POST

**Endpoint**: "/api/v1/workers/:worker_id/lang"

**Req.Params** : worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  language_name,
  proficiency_level_name,
  proficiency_level_id,
  is_primary,
  created_at,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success isnert certification",
  "data": {
    id
  }
}
```

### Update One languange by worker id

**Method**: PUT

**Endpoint**: "/api/v1/workers/:worker_id/lang/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  language_name,
  proficiency_level_name,
  proficiency_level_id,
  is_primary,
  created_at,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success update language",
  "data": {
    id
  }
}
```

### Delete One language by worker id

**Method**: DELETE

**Endpoint**: "/api/v1/workers/:worker_id/lang/id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get education",
  "data": "Education successfully deleted"
}
```

## Tabel resumes

### Get all resumes by worker id

**Method**: GET

**Endpoint**: "/api/v1/workers/:worker_id/resumes"

**Req.Params** : worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get resumes",
  "data": [{
    id,
    resume_url,
    title,
    is_default,
    created_at,
    updated_at
  }]
}
```

### Insert One resume by worker id

**Method**: POST

**Endpoint**: "/api/v1/workers/:worker_id/resumes"

**Req.Params** : worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  resume_url,
  title,
  is_default,
  created_at,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert resume",
  "data": {
    id
  }
}
```

### Update One resume by worker id

**Method**: PUT

**Endpoint**: "/api/v1/workers/:worker_id/resumes/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Body**:

```json
{
  resume_url,
  title,
  is_default,
  created_at,
  updated_at
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success update resume",
  "data": {
    id
  }
}
```

### Delete One resume by worker id

**Method**: DELETE

**Endpoint**: "/api/v1/workers/:worker_id/resumes/:id"

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Req.Params**: worker_id, id

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success delete resume",
  "data": "Resume successfully deleted"
}
```

## Tabel portfolios

### Get all portfolios by worker id

**Method**: GET

**Endpoint**: "/api/v1/workers/:worker_id/portfolios"

**Req.Params** : worker_id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success get portfolios",
  "data": [{
    id,
    title,
    description,
    link,
    is_public,
    updated_at
  }]
}
```

### Insert One portfolio by worker id

**Method**: POST

**Endpoint**: "/api/v1/workers/:worker_id/portfolios"

**Req.Params** : worker_id

**Req.Body**:

```json
{
  title,
  description,
  link,
  is_public,
  updated_at
}
```

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 201,
  "message": "Success insert portfolio"
  "data": {
    id
  }
}
```

### Update One portfolio by worker id

**Method**: PUT

**Endpoint**: "/api/v1/workers/:worker_id/portfolios/:id"

**Req.Params**: worker_id, id

**Req.Body**:

```json
{
  title,
  description,
  link,
  is_public,
  updated_at
}
```

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success update portfolio",
  "data": {
    id
  }
}
```

### Delete One portfolio by worker id

**Method**: DELETE

**Endpoint**: "/api/v1/workers/:worker_id/portfolios/:id"

**Req.Params**: worker_id, id

**Req.Headers**:

```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response**:

```json
{
  "success": true,
  "code": 200,
  "message": "Success delete portfolio"
  "data": "Portfolios successfully deleted"
}
```

B. Recruiters Section

## Recruiters Table

### Get One Recruiter By User Id:

**Method**: GET
**Endpoint**: "/api/v1/recruiters/:user_id"
**req.param**: user_id
**Query**: - SELECT recruiters.id,
recruiters.user_id,
recruiters.company_name,
recruiters.avatar_url,
recruiters.company_website,
recruiters.contact_name,
recruiters.contact_phone,
recruiters.address,
industries.name,
recruiters.description,
recruiters.created_at,
recruiters.updated_at FROM recruiters
JOIN industries ON industries.id = recruiters.industry_id
WHERE recruiters.user_id='1111-dddd-...';

              - SELECT  job_posts.id,
                        job_posts.recruiter_id,
                        job_posts.title,
                        job_posts.description,
                        job_posts.location,
                        employment_types.name AS employment_type,
                        job_posts.salary_min,
                        job_posts.salary_max,
                        currencies.name AS currency,
                        job_posts.published_at,
                        job_posts.deadline,
                        job_post_statuses.name AS status,
                        job_posts.created_at,
                        job_posts.updated_at FROM job_posts
                        JOIN employment_types ON employment_types.id = job_posts.employment_type_id
                        JOIN currencies ON currencies.id = job_posts.currency_id
                        JOIN job_post_statuses ON job_post_statuses.id = job_posts.status_id
                        WHERE job_posts.recruiter_id = '1111-dddd-....';

**Response**: {
data: {
id,
user_id,
company_name,
avatar_url,
company_website,
contact_name,
contact_phone,
address,
industry,
description,
created_at,
updated_at,
job_posts: [{
id,
recruiter_id,
title,
description,
location,
employment_type,
salary_min,
salary_max,
currency,
published_at,
deadline,
status,
created_at,
updated_at
}]
}
}

### Get All Recruiters:

**Method**: GET
**Endpoint**: "/api/v1/recruiters"
**req.param**: None
**Query**: - SELECT recruiters.id,
recruiters.user_id,
recruiters.company_name,
recruiters.avatar_url,
recruiters.company_website,
recruiters.contact_name,
recruiters.contact_phone,
recruiters.address,
industries.name,
recruiters.description,
recruiters.created_at,
recruiters.updated_at FROM recruiters
JOIN industries ON industries.id = recruiters.industry_id; - SELECT job_posts.id,  
 job_posts.recruiter_id,  
 job_posts.title,  
 job_posts.description,  
 job_posts.location,  
 employment_types.name AS employment_type,
job_posts.salary_min,  
 job_posts.salary_max,  
 currencies.name AS currency,  
 job_posts.published_at,  
 job_posts.deadline,  
 job_post_statuses.name AS status,  
 job_posts.created_at,  
 job_posts.updated_at FROM job_posts
JOIN employment_types ON employment_types.id = job_posts.employment_type_id  
 JOIN currencies ON currencies.id = job_posts.currency_id  
 JOIN job_post_statuses ON job_post_statuses.id = job_posts.status_id  
 WHERE job_posts.recruiter_id IN (SELECT id FROM recruiters);
**Response**: {
data: [{
id,
user_id,
company_name,
avatar_url,
company_website,
contact_name,
contact_phone,
address,
industry,
description,
created_at,
updated_at,
job_posts: [{
id,
recruiter_id,
title,
description,
location,
employment_type,
salary_min,
salary_max,
currency,
published_at,
deadline,
status,
created_at,
updated_at
}]
}]
}

### Create Recruiter

**Method**: POST
**Endpoint**: /api/v1/recruiters
**Request Body (JSON)**: {
"user_id": "usr-1111-dddd-aaaa",
"company_name": "Innovatech Solutions",
"avatar_url": "https://example.com/avatars/innovatech.jpg",
"company_website": "https://innovatech.com",
"contact_name": "John Doe",
"contact_phone": "+1-555-765-4321",
"address": "456 Innovation Drive, Austin, TX",
"industry_id": 1,
"description": "We build cutting-edge tools for developers."
}
**Validation Rules**: - user_id: required, must reference an existing user - company_name: required, max 255 characters - contact_name: required - industry: must exist in allowed lookup (e.g., from industries table) - Email/phone format validation applied
**Query**: INSERT INTO recruiters (
user_id,
company_name,
avatar_url,
company_website,
contact_name,
contact_phone,
address,
industry_id,
description,
created_at,
updated_at
) VALUES (
'usr-1111-dddd-aaaa',
'Innovatech Solutions',
'https://example.com/avatars/innovatech.jpg',
'https://innovatech.com',
'John Doe',
'+1-555-765-4321',
'456 Innovation Drive, Austin, TX',
1,
'We build cutting-edge tools for developers.',
NOW(),
NOW()
);
**Authentication & Permissions**: Requires authenticated user session matching the user_id. Only one recruiter profile allowed per user_id.
**Response (Success - 201 Created)**:
{
"data": {
"id": "rec-002",
"user_id": "usr-1111-dddd-aaaa",
"company_name": "Innovatech Solutions",
"avatar_url": "https://example.com/avatars/innovatech.jpg",
"company_website": "https://innovatech.com",
"contact_name": "John Doe",
"contact_phone": "+1-555-765-4321",
"address": "456 Innovation Drive, Austin, TX",
"industry": "Software Development",
"description": "We build cutting-edge tools for developers.",
"created_at": "2025-03-01T08:00:00Z",
"updated_at": "2025-03-01T08:00:00Z"
}
}
**Error Responses**:
400 Bad Request – Invalid or missing fields
409 Conflict – A recruiter profile already exists for this user_id
401 Unauthorized – Missing or invalid authentication

### Edit Recruiter

**Method**: PUT
**Endpoint**: /api/v1/recruiters/:user_id
**Request Parameters**: - user_id (in path): The unique identifier of the user (also tied to the recruiter profile)
**Request Body (JSON)**: {
"company_name": "Updated Tech Corp",
"avatar_url": "https://example.com/avatars/updatedtech.jpg",
"company_website": "https://updatedtech.com",
"contact_name": "Jane Smith",
"contact_phone": "+1-555-888-9999",
"address": "789 Updated Street, Seattle, WA",
"industry_id": 2,
"description": "A next-gen cybersecurity firm protecting digital infrastructure."
}
**Validation Rules**: - user_id must match the authenticated user or require admin privileges - company_name: required, max 255 characters - industry: must exist in the allowed list (e.g., from industries lookup table) - Email/phone format validation enforced - Partial updates not allowed — full replacement expected (use PATCH if partial updates are desired later)
**SQL Update Logic**:
UPDATE recruiters
SET
company_name = 'Updated Tech Corp',
avatar_url = 'https://example.com/avatars/updatedtech.jpg',
company_website = 'https://updatedtech.com',
contact_name = 'Jane Smith',
contact_phone = '+1-555-888-9999',
address = '789 Updated Street, Seattle, WA',
industry_id = 2,
description = 'A next-gen cybersecurity firm protecting digital infrastructure.',
updated_at = NOW()
WHERE user_id = 'usr-1111-dddd-aaaa';

-- Fetch updated record with related job posts (same logic as GET)
SELECT
r.id,
r.user_id,
r.company_name,
r.avatar_url,
r.company_website,
r.contact_name,
r.contact_phone,
r.address,
r.industry_id,
r.description,
r.created_at,
r.updated_at,
COALESCE(json_agg(
json_build_object(
'id', j.id,
'recruiter_id', j.recruiter_id,
'title', j.title,
'description', j.description,
'location', j.location,
'employment_type', et.name,
'salary_min', j.salary_min,
'salary_max', j.salary_max,
'currency', c.name,
'published_at', j.published_at,
'deadline', j.deadline,
'status', jps.name,
'created_at', j.created_at,
'updated_at', j.updated_at
)
ORDER BY j.created_at DESC
) FILTER (WHERE j.id IS NOT NULL), '[]') AS job_posts
FROM recruiters r
LEFT JOIN job_posts j ON r.id = j.recruiter_id
LEFT JOIN employment_types et ON et.id = j.employment_type_id
LEFT JOIN currencies c ON c.id = j.currency_id
LEFT JOIN job_post_statuses jps ON jps.id = j.status_id
WHERE r.user_id = 'usr-1111-dddd-aaaa'
GROUP BY r.id;

Authentication & Permissions: User must be authenticated and authorized to update the given user_id. Admin override possible if needed.
Response (Success - 200 OK):
{
"data": {
"id": "rec-003",
"user_id": "usr-1111-dddd-aaaa",
"company_name": "Updated Tech Corp",
"avatar_url": "https://example.com/avatars/updatedtech.jpg",
"company_website": "https://updatedtech.com",
"contact_name": "Jane Smith",
"contact_phone": "+1-555-888-9999",
"address": "789 Updated Street, Seattle, WA",
"industry": "Cybersecurity",
"description": "A next-gen cybersecurity firm protecting digital infrastructure.",
"created_at": "2025-01-10T07:15:00Z",
"updated_at": "2025-03-03T10:00:00Z",
"job_posts": [
{
"id": "job-105",
"recruiter_id": "rec-003",
"title": "Security Analyst",
"description": "Monitor and respond to security threats.",
"location": "Seattle, WA",
"employment_type": "Full-time",
"salary_min": 85000,
"salary_max": 110000,
"currency": "USD",
"published_at": "2025-01-12T09:00:00Z",
"deadline": "2025-04-15T23:59:59Z",
"status": "Open",
"created_at": "2025-01-12T09:00:00Z",
"updated_at": "2025-01-12T09:00:00Z"
}
]
}
}

Error Responses: - 400 Bad Request – Invalid or missing fields - 404 Not Found – No recruiter profile found for this user_id - 401 Unauthorized – Missing or invalid authentication - 403 Forbidden – User does not have permission to edit this profile

### Delete Recruiter

Method: DELETE
Endpoint: /api/v1/recruiters/:user_id
Request Parameters: - user_id (in path): The unique identifier of the user whose recruiter profile is to be deleted
Authentication & Permissions: - User must be authenticated and authorized to delete this profile - User can only delete their own recruiter profile unless admin override is enabled
SQL Deletion Logic:
-- Start transaction to ensure data consistency
BEGIN;

    -- Soft delete approach (recommended): Mark recruiter as deleted instead of removing physically
    -- UPDATE recruiters
    -- SET
    --    is_deleted = TRUE,
    --    deleted_at = NOW(),
    --    updated_at = NOW()
    -- WHERE user_id = 'usr-1111-dddd-aaaa';

    -- Alternatively, if hard-delete is required (with cascade enabled in schema):
    DELETE FROM recruiters WHERE user_id = 'usr-1111-dddd-aaaa';

    COMMIT;

Validation Rules: - user_id must exist and have an associated recruiter profile - Must check for active job posts: - If jobs exist, return 409 Conflict unless force-delete (admin) is used - Only allow deletion by the owner or admin

Response (Success - 200 OK):
{
"message": "Recruiter profile successfully deleted (or marked as deleted).",
"data": {
"user_id": "usr-1111-dddd-aaaa",
"deleted_at": "2025-03-03T12:30:00Z"
}
}
Error Responses:
404 Not Found – No recruiter profile found for this user_id
400 Bad Request – Invalid user_id format
409 Conflict – Cannot delete; active job posts are associated with this recruiter
401 Unauthorized – Missing or invalid authentication
403 Forbidden – User does not have permission to delete this profile

## Job Post Table

### Get a job post

**Method**: GET
**Endpoint**: /api/v1/job-posts/:id
**Request Parameters**: - id: (string, path) – Job post identifier (e.g., job-105)
**SQL Query (Schema-Compliant, with JOINs)**:
SELECT
j.id,
j.recruiter_id,
r.company_name,
r.avatar_url,
j.title,
j.description,
j.location,
et.name AS employment_type,
j.salary_min,
j.salary_max,
c.name AS currency,
j.status_id,
jps.name AS status,
j.published_at,
j.deadline,
j.created_at,
j.updated_at
FROM job_posts j
JOIN recruiters r ON r.id = j.recruiter_id
JOIN employment_types et ON et.id = j.employment_type_id
JOIN currencies c ON c.id = j.currency_id
JOIN job_post_statuses jps ON jps.id = j.status_id
WHERE j.id = 'job-105';

**Response (200 OK)**:
{
"data": {
"id": "job-105",
"recruiter_id": "rec-003",
"company_name": "Updated Tech Corp",
"avatar_url": "https://example.com/avatars/updatedtech.jpg",
"title": "Security Analyst",
"description": "Monitor and respond to security threats in real time.",
"location": "Seattle, WA",
"employment_type": "Full-time",
"salary_min": 85000,
"salary_max": 110000,
"currency": "USD",
"status": "Open",
"published_at": "2025-01-12T09:00:00Z",
"deadline": "2025-04-15T23:59:59Z",
"created_at": "2025-01-12T09:00:00Z",
"updated_at": "2025-01-12T09:00:00Z"
}
}
**Error Responses**: - 400 Bad Request – Invalid job post ID format - 404 Not Found – Job post not found or deleted - 500 Internal Server Error – Server error

### Get All Job posts

**Method**:  GET 
**Endpoint**:  /api/v1/job-posts 
**Query Parameters**:
Parameter Type Required Default Description
page integer No 1 Page number for pagination
limit integer No 10 Number of records per page (max: 100)
status_id integer No null Filter by job post status ID
employment_type_id integer No null Filter by employment type ID
recruiter_id string No null Filter by recruiter ID
location string No null Filter by location (partial match)
currency_id integer No null Filter by currency ID
salary_min integer No null Filter by minimum salary (greater than or equal)
salary_max integer No null Filter by maximum salary (less than or equal)
**SQL Query**:
SELECT
j.id,
j.recruiter_id,
r.company_name,
r.avatar_url,
j.title,
j.description,
j.location,
et.name AS employment_type,
j.salary_min,
j.salary_max,
c.name AS currency,
j.status_id,
jps.name AS status,
j.created_at,
j.updated_at
FROM job_posts j
JOIN recruiters r ON r.id = j.recruiter_id
JOIN employment_types et ON et.id = j.employment_type_id
JOIN currencies c ON c.id = j.currency_id
JOIN job_post_statuses jps ON jps.id = j.status_id
WHERE 1=1
-- Dynamically add filters based on query parameters
AND (:status_id IS NULL OR j.status_id = :status_id)
AND (:employment_type_id IS NULL OR j.employment_type_id = :employment_type_id)
AND (:recruiter_id IS NULL OR j.recruiter_id = :recruiter_id)
AND (:location IS NULL OR j.location ILIKE CONCAT('%', :location, '%'))
AND (:currency_id IS NULL OR j.currency_id = :currency_id)
AND (:salary_min IS NULL OR j.salary_min >= :salary_min)
AND (:salary_max IS NULL OR j.salary_max <= :salary_max)
ORDER BY j.created_at DESC
LIMIT :limit OFFSET (:page - 1) \* :limit;

**Success Response (200 OK)**:
{
"data": [
{
"id": "job-105",
"recruiter_id": "rec-003",
"company_name": "Tech Innovations Inc.",
"avatar_url": "https://example.com/avatars/tech-innovations.jpg",
"title": "Senior Software Engineer",
"description": "We are looking for an experienced software engineer to join our team...",
"location": "San Francisco, CA",
"employment_type": "Full-time",
"salary_min": 120000,
"salary_max": 180000,
"currency": "USD",
"status_id": 1,
"status": "Open",
"created_at": "2025-01-15T10:30:00Z",
"updated_at": "2025-01-15T10:30:00Z"
},
{
"id": "job-104",
"recruiter_id": "rec-002",
"company_name": "Digital Solutions LLC",
"avatar_url": "https://example.com/avatars/digital-solutions.jpg",
"title": "Product Manager",
"description": "Seeking a product manager with experience in agile methodologies...",
"location": "New York, NY",
"employment_type": "Full-time",
"salary_min": 100000,
"salary_max": 150000,
"currency": "USD",
"status_id": 1,
"status": "Open",
"created_at": "2025-01-14T14:20:00Z",
"updated_at": "2025-01-14T14:20:00Z"
}
],
"pagination": {
"page": 1,
"limit": 10,
"total_items": 45,
"total_pages": 5
}
}

**400 Bad Request**:
Returned when one or more query parameters are invalid.
{
"error": {
"code": "INVALID_PARAMETERS",
"message": "One or more query parameters are invalid",
"details": {
"limit": "must be between 1 and 100",
"page": "must be a positive integer"
}
}
}

**500 Internal Server Error**:
Returned when an unexpected error occurs on the server.
{
"error": {
"code": "INTERNAL_SERVER_ERROR",
"message": "An unexpected error occurred while processing your request"
}
}

### Get All Job Posts per Recruiter

Method**: **GET
**Endpoint**: /api/v1/recruiters/:recruiter_id/job-posts
**Path parameter**:
Parameter Type Required Description
recruiter_id string Yes The unique identifier of the recruiter

**Query Parameters**:
Parameter Type Required Default Description
page integer No 1 The page number for pagination
limit integer No 20 The number of job posts to return per page
status string No null Filter by job post status (e.g., “Open”, “Closed”)
employment_type string No null Filter by employment type (e.g., “Full-time”, “Part-time”)
location string No null Filter by location (partial match)
salary_min integer No null Filter by minimum salary
salary_max integer No null Filter by maximum salary
currency string No null Filter by currency code (e.g., “USD”, “EUR”)
created_after string No null Filter job posts created after this date (ISO 8601 format)
created_before string No null Filter job posts created before this date (ISO 8601 format)
sort_by string No “created_at” Field to sort by (e.g., “created_at”, “salary_min”)
sort_order string No “desc” Sort order (“asc” or “desc”)

**Authentication and Authorization**:
This endpoint requires authentication. The requester must have a valid API token or be authenticated via the appropriate authentication mechanism.

**Authorization Rules**:
• Recruiters can only view their own job posts
• Administrators can view job posts for any recruiter
• Other roles might have restricted access based on business logic

**Query parameters for filtering (e.g., status, employment_type, location) and pagination (page, limit)**
**Schema-compliant SQL query with accurate JOINs to**: - recruiters → company_name, avatar_url - employment_types → name - currencies → name - job_post_statuses → name

**SQL Query**:
The following SQL query demonstrates how the endpoint retrieves job posts for a specific recruiter from the database, including joins with related tables to resolve foreign key references:
SELECT
j.id,
j.recruiter_id,
r.company_name,
r.avatar_url,
j.title,
j.description,
j.location,
et.name AS employment_type,
j.salary_min,
j.salary_max,
c.name AS currency,
j.job_post_status_id,
jps.name AS status,
j.created_at,
j.updated_at
FROM job_posts j
JOIN recruiters r ON r.id = j.recruiter_id
JOIN employment_types et ON et.id = j.employment_type_id
JOIN currencies c ON c.id = j.currency_id
JOIN job_post_statuses jps ON jps.id = j.job_post_status_id
WHERE j.recruiter_id = 'rec-003'
-- Optional filters based on query parameters
AND (:status IS NULL OR jps.name = :status)
AND (:employment_type IS NULL OR et.name = :employment_type)
AND (:location IS NULL OR j.location ILIKE CONCAT('%', :location, '%'))
AND (:salary_min IS NULL OR j.salary_min >= :salary_min)
AND (:salary_max IS NULL OR j.salary_max <= :salary_max)
AND (:currency IS NULL OR c.name = :currency)
AND (:created_after IS NULL OR j.created_at >= :created_after)
AND (:created_before IS NULL OR j.created_at <= :created_before)
ORDER BY
CASE
WHEN :sort_by = 'title' THEN j.title
WHEN :sort_by = 'location' THEN j.location
WHEN :sort_by = 'salary_min' THEN j.salary_min::text
WHEN :sort_by = 'salary_max' THEN j.salary_max::text
WHEN :sort_by = 'created_at' THEN j.created_at::text
ELSE j.created_at::text
END
CASE WHEN :sort_order = 'asc' THEN ASC ELSE DESC END
LIMIT :limit OFFSET (:page - 1) \* :limit;

**Count Query for Pagination Metadata**:
To support pagination, a separate count query is used to determine the total number of job posts:
SELECT COUNT(\*)
FROM job_posts j
JOIN recruiters r ON r.id = j.recruiter_id
JOIN employment_types et ON et.id = j.employment_type_id
JOIN currencies c ON c.id = j.currency_id
JOIN job_post_statuses jps ON jps.id = j.job_post_status_id
WHERE j.recruiter_id = 'rec-003'
-- Same filters as above
AND (:status IS NULL OR jps.name = :status)
AND (:employment_type IS NULL OR et.name = :employment_type)
AND (:location IS NULL OR j.location ILIKE CONCAT('%', :location, '%'))
AND (:salary_min IS NULL OR j.salary_min >= :salary_min)
AND (:salary_max IS NULL OR j.salary_max &lt;= :salary_max)
AND (:currency IS NULL OR c.name = :currency)
AND (:created_after IS NULL OR j.created_at >= :created_after)
AND (:created_before IS NULL OR j.created_at &lt;= :created_before);

**Success Response (200 OK)**:
The response includes a paginated list of job posts with metadata about the pagination.
{
"data": [
{
"id": "job-105",
"recruiter_id": "rec-003",
"company_name": "Updated Tech Corp",
"avatar_url": "https://example.com/avatars/updatedtech.jpg",
"title": "Security Analyst",
"description": "Monitor and respond to security threats in real time.",
"location": "Seattle, WA",
"employment_type": "Full-time",
"salary_min": 85000,
"salary_max": 110000,
"currency": "USD",
"job_post_status_id": 1,
"status": "Open",
"created_at": "2025-01-12T09:00:00Z",
"updated_at": "2025-01-12T09:00:00Z"
},
{
"id": "job-108",
"recruiter_id": "rec-003",
"company_name": "Updated Tech Corp",
"avatar_url": "https://example.com/avatars/updatedtech.jpg",
"title": "Frontend Developer",
"description": "Create engaging user interfaces using React and TypeScript.",
"location": "Remote",
"employment_type": "Full-time",
"salary_min": 95000,
"salary_max": 130000,
"currency": "USD",
"job_post_status_id": 1,
"status": "Open",
"created_at": "2025-02-01T14:30:00Z",
"updated_at": "2025-02-01T14:30:00Z"
}
],
"pagination": {
"page": 1,
"limit": 20,
"total_items": 2,
"total_pages": 1
}
}

**400 Bad Request**:
Returned when the request parameters are invalid or malformed.
{
"error": {
"code": "invalid_parameters",
"message": "Invalid request parameters",
"details": {
"page": "Must be a positive integer",
"limit": "Must be between 1 and 100"
}
}
}

**401 Unauthorized**:
Returned when the request lacks valid authentication credentials.
{
"error": {
"code": "unauthorized",
"message": "Authentication required"
}
}

**403 Forbidden**:
Returned when the authenticated user does not have permission to access the requested recruiter's job posts.
{
"error": {
"code": "forbidden",
"message": "You do not have permission to access this recruiter's job posts"
}
}

**404 Not Found**:
Returned when the specified recruiter does not exist.
{
"error": {
"code": "not_found",
"message": "Recruiter not found"
}
}

**500 Internal Server Error**:
Returned when an unexpected error occurs on the server.
{
"error": {
"code": "server_error",
"message": "An internal server error occurred"
}
}

### Create a Job Post

**Method**: POST
**URL**: /api/v1/job-posts
**Authentication**: Required (Bearer Token) Authorization: Recruiter role required
**Request Body Example**:
{
"id": "1111-aaaa-....",
"recruiter_id": "2222-pppp-....",
"title": "Senior Software Engineer",
"description": "We are looking for an experienced software engineer with expertise in backend development and cloud technologies. The ideal candidate will have 5+ years of experience in building scalable web applications.",
"employment_type_id": 1,
"location": "San Francisco, CA",
"salary_min": 120000,
"salary_max": 180000,
"currency_id": 1,
"job_post_status_id": 2
}
**201 Created Response Example**:
{
"id": "1111-aaaa-....",
"recruiter_id": "2222-pppp-....",
"title": "Senior Software Engineer",
"description": "We are looking for an experienced software engineer with expertise in backend development and cloud technologies. The ideal candidate will have 5+ years of experience in building scalable web applications.",
"employment_type_id": 1,
"location": "San Francisco, CA",
"salary_min": 120000,
"salary_max": 180000,
"currency_id": 1,
"job_post_status_id": 2,
"published_at": "2025-03-10T15:30:00Z",
"created_at": "2025-03-10T15:30:00Z",
"updated_at": "2025-03-10T15:30:00Z"
}

**400 Bad Request**:
{
"error": {
"code": "VALIDATION_ERROR",
"message": "Request validation failed",
"details": [
{
"field": "title",
"message": "Title must be between 5 and 100 characters"
},
{
"field": "salary_max",
"message": "Maximum salary must be greater than or equal to minimum salary"
}
]
}
}
**401 Unauthorized**:
{
"error": {
"code": "UNAUTHORIZED",
"message": "Authentication token is missing or invalid"
}
}
**403 Forbidden**:
{
"error": {
"code": "FORBIDDEN",
"message": "User does not have recruiter privileges"
}
}
**404 Not Found**:
{
"error": {
"code": "FOREIGN_KEY_VIOLATION",
"message": "Referenced employment type does not exist"
}
}
**500 Internal Server Error**:
{
"error": {
"code": "INTERNAL_SERVER_ERROR",
"message": "An unexpected error occurred while processing your request"
}
}

**SQL Operation**:
The endpoint executes the following SQL INSERT statement:
INSERT INTO job_posts (
id,
recruiter_id,
title,
description,
employment_type_id,
location,
salary_min,
salary_max,
currency_id,
job_post_status_id,
published_at,
created_at,
updated_at
) VALUES (
:id,
:recruiter_id,
:title,
:description,
:employment_type_id,
:location,
:salary_min,
:salary_max,
:currency_id,
COALESCE(:job_post_status_id, 1),
NOW(),
NOW(),
NOW()
) RETURNING \*;

### Update a Job Post

**Method**:  PUT 
**Path**:  /api/v1/job-posts/:id 
**Description**: Updates an existing job post identified by its ID. Only the creator (recruiter) of the job post can update it.
**Authentication & Authorization**:
This endpoint requires authentication and authorization: - Authentication: Valid JWT token must be provided in the  Authorization  header - Authorization: The authenticated user must be a recruiter and must be the owner of the job post (i.e.,  recruiter_id  in the JWT must match the  recruiter_id  of the job post)
**Path Parameters**:
Parameter Type Required Description
id Integer Yes The unique identifier of the job post to update
**Request Body**:
The request body should contain the fields to be updated. All fields are optional - only provided fields will be updated.
{
"title": "Senior Frontend Developer",
"description": "We are looking for an experienced frontend developer...",
"employment_type_id": 1,
"location": "San Francisco, CA",
"salary_min": 80000,
"salary_max": 120000,
"currency_id": 1,
"job_post_status_id": 2
}
**SQL UPDATE Statement**:
UPDATE job_posts
SET
title = COALESCE($1, title),
description = COALESCE($2, description),
employment_type_id = COALESCE($3, employment_type_id),
location = COALESCE($4, location),
salary_min = COALESCE($5, salary_min),
salary_max = COALESCE($6, salary_max),
currency_id = COALESCE($7, currency_id),
job_post_status_id = COALESCE($8, job_post_status_id),
updated_at = NOW()
WHERE id = $9 AND recruiter_id = $10
RETURNING \*;

**200 OK - Success Response**:
{
"data": {
"id": "1111-dddd-....",
"title": "Senior Frontend Developer",
"description": "We are looking for an experienced frontend developer with strong React skills...",
"employment_type_id": 1,
"employment_type": "Full-time",
"location": "San Francisco, CA",
"salary_min": 80000,
"salary_max": 120000,
"currency_id": 1,
"currency": "USD",
"recruiter_id": "",
"company_name": "TechCorp Inc.",
"avatar_url": "https://example.com/avatars/techcorp.jpg",
"job_post_status_id": 2,
"status": "Active",
"published_at": "2025-03-10T10:00:00Z",
"created_at": "2025-03-10T10:00:00Z",
"updated_at": "2025-03-10T14:30:00Z"
}
}

**400 Bad Request**:
{
"error": {
"code": "VALIDATION_ERROR",
"message": "Invalid request data",
"details": {
"salary_max": ["salary_max must be greater than or equal to salary_min"]
}
}
}
**401 Unauthorized**:
{
"error": {
"code": "UNAUTHORIZED",
"message": "Missing or invalid authentication token"
}
}
**403 Forbidden**:
{
"error": {
"code": "FORBIDDEN",
"message": "You do not have permission to update this job post"
}
}
**404 Not Found**:
{
"error": {
"code": "NOT_FOUND",
"message": "Job post with ID 123 not found"
}
}
**500 Internal Server Error**:
{
"error": {
"code": "INTERNAL_SERVER_ERROR",
"message": "An unexpected error occurred while updating the job post"
}
}

### Delete a Job Post

**Method**: DELETE
**Path**: /api/v1/job-posts/:id
**Path parameter**:
Parameter Type Required Description
id Integer Yes ID of the job post to delete
**Description**: Permanently deletes a job post by its ID. Only the recruiter who created the job post can delete it.

**SQL DELETE Statement**:
DELETE FROM job_posts
WHERE id = :id AND recruiter_id = :recruiter_id
RETURNING id, title, NOW() as deleted_at;

**Success Response (200 OK)**:
Body
{
"success": true,
"message": "Job post deleted successfully",
"data": {
"id": 1,
"title": "Senior Frontend Developer",
"deleted_at": "2025-10-03T15:30:45Z"
}
}

**400 Bad Request**
Scenario: Invalid job post ID format
{
"success": false,
"error": "INVALID_JOB_POST_ID",
"message": "Job post ID must be a valid integer"
}
**401 Unauthorized**
Scenario: Missing or invalid JWT token
{
"success": false,
"error": "UNAUTHORIZED",
"message": "Authentication token is required"
}
**403 Forbidden**:
Scenario: User is not a recruiter or doesn’t own the job post
{
"success": false,
"error": "FORBIDDEN",
"message": "You do not have permission to delete this job post"
}
**404 Not Found**:
Scenario: Job post with specified ID doesn’t exist
{
"success": false,
"error": "JOB_POST_NOT_FOUND",
"message": "Job post with ID 123 does not exist"
}
**500 Internal Server Error**:
Scenario: Database error or server failure
{
"success": false,
"error": "INTERNAL_SERVER_ERROR",
"message": "An unexpected error occurred while deleting the job post"
}

## Job post tags Table

### Create a job post tags

**Method**: POST
**URL**: /api/v1/job-posts/:id/tags
**Content-Type**: application/json
**Authentication**: Required (Bearer JWT)
**Authorization**: Only the job post owner can add tags
**Path Parameters**:
Parameter Type Required Description
id UUID Yes The unique identifier of the job post
**Authentication & Authorization**:
This endpoint requires a valid JWT token in the Authorization header:
Authorization: Bearer <JWT_TOKEN>
The token must contain a recruiter_id claim, which will be used to: 1. Verify the user is a recruiter 2. Confirm the recruiter owns the specified job post 3. Prevent unauthorized tag modifications to other recruiters’ job posts
**Request Body Schema**:
The client must send a JSON object with the following structure:
{
"tags": ["string"]
}
**Example Request**
{
"tags": ["React", "Remote", "Mid-Level", "Full-Stack", "TypeScript"]
}
**Database Operations**: 1. Verify Job Post Ownership
SELECT recruiter_id FROM job_posts WHERE id = $1; 2. Tag Existence Check and Creation
For each tag, execute:
-- Check if tag exists
SELECT id FROM job_tags WHERE LOWER(name) = LOWER($1);

        -- If not exists, create new tag
        INSERT INTO job_tags (name, created_at)
        VALUES ($1, NOW())
        RETURNING id;
    3.  Create Tag Associations
        For each tag ID (existing or newly created):
        -- Prevent duplicate associations
        INSERT INTO job_post_tags (job_post_id, tag_id)
        SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1 FROM job_post_tags
          WHERE job_post_id = $1 AND tag_id = $2
        );

**Success Response (201 Created)**
{
"success": true,
"message": "Tags successfully added to job post",
"data": {
"job_post_id": "550e8400-e29b-41d4-a716-446655440000",
"tags_added": [
{
"id": 1,
"name": "React"
},
{
"id": 2,
"name": "Remote"
},
{
"id": 15,
"name": "Mid-Level"
},
{
"id": 16,
"name": "Full-Stack"
},
{
"id": 17,
"name": "TypeScript"
}
]
}
}

**400 Bad Request**
{
"success": false,
"error": {
"code": "INVALID_REQUEST",
"message": "Invalid request data",
"details": [
"Tags array cannot be empty",
"Tag names must be between 1 and 50 characters",
"Maximum 20 tags allowed per request"
]
}
}
**401 Unauthorized**
{
"success": false,
"error": {
"code": "UNAUTHORIZED",
"message": "Authentication required"
}
}
**403 Forbidden**
{
"success": false,
"error": {
"code": "FORBIDDEN",
"message": "You are not authorized to modify this job post"
}
}
**404 Not Found**
{
"success": false,
"error": {
"code": "NOT_FOUND",
"message": "Job post not found"
}
}
**500 Internal Server Error**
{
"success": false,
"error": {
"code": "INTERNAL_ERROR",
"message": "An unexpected error occurred while processing your request"
}
}

### Get tags per job post

**Request Method**: GET
**Endpoint URL**: /api/v1/job-posts/:id/tags
**Path Parameters**:
Parameter Type Required Description Example
id UUID Yes The unique identifier of the job post a1b2c3d4-e5f6-7890-abcd-ef1234567890
**Success Response (200 OK)**:
When the request is successful, the endpoint returns a JSON array of tag objects associated with the specified job post.
Response Format:
[
{
"id": "550e8400-e29b-41d4-a716-446655440000",
"name": "Remote",
"created_at": "2024-01-15T10:30:00Z"
},
{
"id": "550e8400-e29b-41d4-a716-446655440001",
"name": "React",
"created_at": "2024-01-15T10:30:00Z"
},
{
"id": "550e8400-e29b-41d4-a716-446655440002",
"name": "Mid-Level",
"created_at": "2024-01-15T10:30:00Z"
}
]
Response Fields: - id (UUID): The unique identifier of the tag - name (String): The human-readable name of the tag - created_at (ISO 8601 DateTime): The timestamp when the tag was created

**400 Bad Request**:
Trigger: Invalid job post ID format or missing required parameters
Response Example:
{
"error": {
"code": "INVALID_REQUEST",
"message": "Invalid job post ID format",
"details": "The provided ID 'invalid-id' is not a valid UUID"
}
}
**401 Unauthorized**:
Trigger: Missing or invalid JWT token
Response Example:
{
"error": {
"code": "UNAUTHORIZED",
"message": "Authentication required",
"details": "Valid JWT token must be provided in Authorization header"
}
}
**404 Not Found**
Trigger: Job post with the specified ID does not exist
Response Example:
{
"error": {
"code": "NOT_FOUND",
"message": "Job post not found",
"details": "No job post exists with ID '550e8400-e29b-41d4-a716-446655440000'"
}
}
**500 Internal Server Error**
Trigger: Unexpected server error during processing
Response Example:
{
"error": {
"code": "INTERNAL_ERROR",
"message": "An unexpected error occurred",
"details": "The system encountered an error while processing your request"
}
}

**Database Query Details**:
Primary Query
The main query for retrieving tags:
SELECT jt.id, jt.name, jt.created_at
FROM job_tags jt
INNER JOIN job_post_tags jpt ON jt.id = jpt.tag_id
WHERE jpt.job_post_id = $1
ORDER BY jt.name ASC;

**Alternative Query Approaches**:
For scenarios requiring additional information, consider these variations:
With Tag Count:
SELECT jt.id, jt.name, jt.created_at, COUNT(jpt2.job_post_id) as usage_count
FROM job_tags jt
INNER JOIN job_post_tags jpt ON jt.id = jpt.tag_id
LEFT JOIN job_post_tags jpt2 ON jt.id = jpt2.tag_id
WHERE jpt.job_post_id = $1
GROUP BY jt.id, jt.name, jt.created_at
ORDER BY jt.name ASC;
With Job Post Verification:
SELECT jt.id, jt.name, jt.created_at
FROM job_posts jp
INNER JOIN job_post_tags jpt ON jp.id = jpt.job_post_id
INNER JOIN job_tags jt ON jpt.tag_id = jt.id
WHERE jp.id = $1
ORDER BY jt.name ASC;

1. Tabel job_posts
2. Tabel job_post_tags
   2.1 Tabel job_tags
3. Tabel job_post_questions
4. Tabel job_post_answer
5. Tabel job_applications
