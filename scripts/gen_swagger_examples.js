/**
 * One-off script: replaces the generic "exampleField" placeholders in
 * swagger_output.json with realistic request body schemas/examples,
 * generated from the actual Joi validation schemas used by each endpoint.
 *
 * Usage: node scripts/gen_swagger_examples.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SWAGGER_PATH = path.join(ROOT, "swagger_output.json");

const UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

// ---------------------------------------------------------------------------
// Load Joi schemas from each module
// ---------------------------------------------------------------------------
const mod = (p) => require(path.join(ROOT, "src/modules", p));

const admin = mod("admin/repositories/commands/command_model");
const categories = mod("categories/repositories/commands/command_model");
const certifications = mod("certifications/repositories/commands/command_model");
const educations = mod("educations/repositories/commands/command_model");
const employmentTypes = mod("employment_types/repositories/commands/command_model");
const experienceLevels = mod("experience_levels/repositories/commands/command_model");
const genders = mod("genders/repositories/commands/command_model");
const industries = mod("industries/repositories/commands/command_model");
const jobPosts = mod("job_posts/repositories/commands/command_model");
const jobPostBenefits = mod("job_post_benefits/repositories/commands/command_model");
const jobPostRequirements = mod("job_post_requirements/repositories/commands/command_model");
const jobPostResponsibilities = mod("job_post_responsibilities/repositories/commands/command_model");
const languages = mod("languages/repositories/commands/command_model");
const nationalities = mod("nationalities/repositories/commands/command_model");
const portofolios = mod("portofolios/repositories/commands/command_model");
const recruiters = mod("recruiters/repositories/commands/command_model");
const resumes = mod("resumes/repositories/commands/command_model");
const savedJobs = mod("saved_jobs/repositories/commands/command_model");
const skills = mod("skills/repositories/commands/command_model");
const users = mod("users/repositories/commands/command_model");
const workers = mod("workers/repositories/commands/command_model");
const workerSkills = mod("worker-skills/repositories/commands/command_model");
const workExperiences = mod("work-experiences/repositories/commands/command_model");

// ---------------------------------------------------------------------------
// Heuristic example-value generator based on Joi's schema.describe() output
// ---------------------------------------------------------------------------
function ruleNames(desc) {
  return (desc.rules || []).map((r) => r.name);
}

function stringExample(key, desc) {
  const k = key.toLowerCase();
  const rules = ruleNames(desc);

  if (rules.includes("email") || k.includes("email")) return "user@example.com";
  if (rules.includes("uri") || k.includes("website") || k.includes("url") || k === "link")
    return "https://example.com";
  if (rules.includes("guid") || k === "id" || k.endsWith("_id")) return UUID;

  if (k.includes("password")) return "P@ssw0rd123";
  if (k === "username") return "johndoe";
  if (k.includes("telephone") || k.includes("phone")) return "+6281234567890";
  if (k.includes("token")) return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.token";
  if (k === "date_of_birth") return "1998-05-20";
  if (k === "start_date") return "2022-01-01";
  if (k === "end_date" || k === "expiry_date") return "2023-12-31";
  if (k === "issue_date") return "2022-06-15";
  if (k === "deadline") return "2026-12-31";
  if (k === "credential_id") return "CERT-2024-00123";
  if (k === "iso_alpha2") return "ID";
  if (k === "iso_alpha3") return "IDN";
  if (k === "employee_count") return "50-100";
  if (k === "support_email") return "support@cari-kerja.co.id";
  if (k === "ip_address") return "127.0.0.1";
  if (k === "user_agent") return "Mozilla/5.0";
  if (k === "status") return "OPEN";
  if (k === "status_name") return "REVIEWED";
  if (k === "order_type") return "subscription";
  if (k === "location") return "Jakarta, Indonesia";
  if (k === "city") return "Jakarta";
  if (k === "province") return "DKI Jakarta";
  if (k === "country") return "Indonesia";
  if (k === "note" || k === "message") return "Kandidat sangat sesuai dengan kualifikasi.";
  if (k === "cover_letter")
    return "Saya sangat tertarik dengan posisi ini dan yakin dapat berkontribusi secara maksimal.";
  if (k === "subject") return "Pertanyaan terkait lowongan kerja";
  if (k === "question_text") return "Berapa tahun pengalaman Anda di bidang ini?";
  if (k === "answer") return "3 tahun";
  if (k === "benefit") return "Asuransi kesehatan & BPJS";
  if (k === "requirement") return "Minimal 2 tahun pengalaman di bidang terkait";
  if (k === "responsibility") return "Mengelola dan memelihara API backend";
  if (k === "platform_name") return "Cari Kerja";
  if (k === "title") return "Backend Developer";
  if (k === "profile_summary")
    return "Backend developer dengan 3 tahun pengalaman di Node.js dan PostgreSQL.";
  if (k === "address") return "Jl. Sudirman No. 1, Jakarta";
  if (k === "description" || k.includes("description"))
    return "Contoh deskripsi yang menjelaskan detail terkait.";
  if (k === "company_name") return "PT Contoh Sejahtera";
  if (k === "institution_name") return "Universitas Indonesia";
  if (k === "contact_name" || k === "full_name") return "Budi Santoso";
  if (k === "skill_name") return "JavaScript";
  if (k === "language_name") return "English";
  if (k === "gender_name") return "Male";
  if (k === "country_name") return "Indonesia";
  if (k === "name") return "Contoh Nama";
  if (k.endsWith("_name")) return "Contoh " + key.replace(/_/g, " ");

  return "Contoh " + key.replace(/_/g, " ");
}

function numberExample(key) {
  const k = key.toLowerCase();
  if (k.includes("salary_min")) return 5000000;
  if (k.includes("salary_max")) return 10000000;
  if (k.includes("current_salary") || k.includes("expected_salary")) return 7000000;
  if (k === "order_index") return 0;
  if (k === "paid_amount") return 150000;
  if (k === "max_upload_size_mb") return 10;
  if (k === "proficiency_level_id") return 3;
  if (k === "role_id") return 2;
  if (k === "plan_id") return 1;
  if (k === "id") return 1;
  if (k.endsWith("_id")) return 1;
  return 1;
}

function booleanExample(key) {
  const k = key.toLowerCase();
  if (["is_suspended", "hard_delete", "maintenance_mode", "is_remote"].includes(k)) return false;
  return true;
}

function mapJoiTypeToOpenApiType(joiType) {
  switch (joiType) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "string";
    case "array":
      return "array";
    case "object":
      return "object";
    default:
      return "string";
  }
}

// Build both an OpenAPI property node (with type/example) AND a plain example value for a single key
function describeToProperty(key, desc) {
  if (!desc) return { property: { type: "string", example: "" }, example: "" };

  switch (desc.type) {
    case "number": {
      const ex = numberExample(key);
      return { property: { type: "number", example: ex }, example: ex };
    }
    case "boolean": {
      const ex = booleanExample(key);
      return { property: { type: "boolean", example: ex }, example: ex };
    }
    case "date": {
      const ex = "2024-01-15T00:00:00.000Z";
      return { property: { type: "string", format: "date-time", example: ex }, example: ex };
    }
    case "object": {
      const { properties, required, example } = describeObject(desc);
      return {
        property: { type: "object", properties, ...(required.length ? { required } : {}) },
        example,
      };
    }
    case "array": {
      const itemDesc = desc.items && desc.items[0];
      const itemResult = itemDesc ? describeToProperty(key, itemDesc) : null;
      return {
        property: {
          type: "array",
          items: itemResult ? itemResult.property : { type: "string" },
        },
        example: itemResult ? [itemResult.example] : [],
      };
    }
    case "alternatives": {
      const firstMatch = desc.matches && desc.matches[0] && desc.matches[0].schema;
      if (firstMatch) return describeToProperty(key, firstMatch);
      const ex = stringExample(key, {});
      return { property: { type: "string", example: ex }, example: ex };
    }
    case "string":
    default: {
      const ex = stringExample(key, desc);
      return { property: { type: "string", example: ex }, example: ex };
    }
  }
}

function describeObject(desc) {
  const properties = {};
  const example = {};
  const required = [];
  const keys = desc.keys || {};

  for (const [key, keyDesc] of Object.entries(keys)) {
    const { property, example: ex } = describeToProperty(key, keyDesc);
    properties[key] = property;
    example[key] = ex;
    if (keyDesc.flags && keyDesc.flags.presence === "required") required.push(key);
  }

  return { properties, required, example };
}

/**
 * Build a full OpenAPI requestBody object from a Joi schema, optionally
 * excluding some keys (e.g. ones injected server-side from params/token).
 */
function buildRequestBody(joiSchema, { exclude = [] } = {}) {
  const desc = joiSchema.describe();
  const { properties, required, example } = describeObject(desc);

  for (const key of exclude) {
    delete properties[key];
    delete example[key];
    const idx = required.indexOf(key);
    if (idx !== -1) required.splice(idx, 1);
  }

  return {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties,
          ...(required.length ? { required } : {}),
        },
        example,
      },
    },
  };
}

/** Build an OpenAPI requestBody wrapping an array of items matching a Joi schema */
function buildArrayRequestBody(joiSchema, { exclude = [] } = {}) {
  const single = buildRequestBody(joiSchema, { exclude });
  const itemSchema = single.content["application/json"].schema;
  const itemExample = single.content["application/json"].example;

  return {
    content: {
      "application/json": {
        schema: { type: "array", items: itemSchema },
        example: [itemExample],
      },
    },
  };
}

/** Build a simple, explicit requestBody (used for hand-picked special cases) */
function buildCustomRequestBody(properties, example) {
  return {
    content: {
      "application/json": {
        schema: { type: "object", properties },
        example,
      },
    },
  };
}

/** Patch specific field examples on an already-built requestBody (schema + example) */
function withOverrides(requestBody, overrides) {
  const body = requestBody.content["application/json"];
  for (const [key, value] of Object.entries(overrides)) {
    if (body.schema.properties[key]) body.schema.properties[key].example = value;
    body.example[key] = value;
  }
  return requestBody;
}

// ---------------------------------------------------------------------------
// Endpoint → requestBody mapping
// ---------------------------------------------------------------------------
const ENDPOINTS = {
  "PUT /api/v1/admin/settings": () => buildRequestBody(admin.updateSystemSettingsParamType),
  "PUT /api/v1/admin/users/{id}/status": () => buildRequestBody(admin.updateUserStatusParamType, { exclude: ["id"] }),
  "PUT /api/v1/admin/employers/{id}/verify": () => buildRequestBody(admin.verifyEmployerParamType, { exclude: ["id"] }),
  "PUT /api/v1/admin/jobs/{id}/status": () => buildRequestBody(admin.updateJobStatusParamType, { exclude: ["id"] }),

  "POST /api/v1/categories": () => buildRequestBody(categories.addCategoryType),
  "PUT /api/v1/categories/{id}": () => buildRequestBody(categories.updateCategoryType, { exclude: ["id"] }),

  "POST /api/v1/workers/cert": () => buildRequestBody(certifications.addCertification),
  "PUT /api/v1/workers/cert/{id}": () => buildRequestBody(certifications.updateCertification, { exclude: ["id"] }),

  "POST /api/v1/workers/educations": () => buildRequestBody(educations.addEducationsParamType),
  "PUT /api/v1/workers/educations/{id}": () => buildRequestBody(educations.updateEducationsParamType, { exclude: ["id"] }),

  "POST /api/v1/employment_types": () => buildRequestBody(employmentTypes.addEmploymentTypeType),
  "PUT /api/v1/employment_types/{id}": () => buildRequestBody(employmentTypes.updateEmploymentTypeType, { exclude: ["id"] }),

  "POST /api/v1/experience_levels": () => buildRequestBody(experienceLevels.addExperienceLevelType),
  "PUT /api/v1/experience_levels/{id}": () => buildRequestBody(experienceLevels.updateExperienceLevelType, { exclude: ["id"] }),

  "POST /api/v1/genders": () => buildRequestBody(genders.addGenderType),
  "PUT /api/v1/genders/{id}": () => buildRequestBody(genders.updateGenderType, { exclude: ["id"] }),

  "POST /api/v1/industries": () => buildRequestBody(industries.addIndustryType),
  "PUT /api/v1/industries/{id}": () => buildRequestBody(industries.updateIndustryType, { exclude: ["id"] }),

  "POST /api/v1/job-posts": () => buildRequestBody(jobPosts.createJobPostParamType),
  "POST /api/v1/job-posts/status/{id}": () =>
    buildCustomRequestBody({ status_id: { type: "number", example: 2 } }, { status_id: 2 }),
  "POST /api/v1/job-posts/{id}/create-questions": () =>
    buildArrayRequestBody(jobPosts.jobPostQuestionCreateParamType),
  "POST /api/v1/job-posts/{question_id}/update-questions": () =>
    buildRequestBody(jobPosts.jobPostQuestionUpdateParamType, { exclude: ["id"] }),
  "POST /api/v1/job-posts/{job_post_id}/create-answers": () =>
    buildArrayRequestBody(jobPosts.createJobPostAnswerParamType),
  "POST /api/v1/job-posts/{job_post_id}/apply": () =>
    buildRequestBody(jobPosts.createJobApplicationParamType, { exclude: ["worker_id", "job_post_id"] }),
  "POST /api/v1/job-posts/{id}/duplicate": () => buildCustomRequestBody({}, {}),
  "POST /api/v1/job-posts/{id}/archive": () => buildCustomRequestBody({}, {}),
  "POST /api/v1/job-posts/{id}/restore": () => buildCustomRequestBody({}, {}),

  "POST /api/v1/job-posts/job-post-benefits/{job_post_id}": () =>
    buildRequestBody(jobPostBenefits.addJobPostBenefitParamType, { exclude: ["job_post_id"] }),
  "PUT /api/v1/job-posts/job-post-benefits/{job_post_id}": () =>
    buildRequestBody(jobPostBenefits.updateJobPostBenefitParamType, { exclude: ["job_post_id"] }),

  "POST /api/v1/job-posts/job-post-requirements/{job_post_id}": () =>
    buildRequestBody(jobPostRequirements.addJobPostRequirementParamType, { exclude: ["job_post_id"] }),
  "PUT /api/v1/job-posts/job-post-requirements/{job_post_id}": () =>
    buildRequestBody(jobPostRequirements.updateJobPostRequirementParamType, { exclude: ["job_post_id"] }),

  "POST /api/v1/job-posts/job-post-responsibilities/{job_post_id}": () =>
    buildRequestBody(jobPostResponsibilities.addJobPostResponsibilityParamType, { exclude: ["job_post_id"] }),
  "PUT /api/v1/job-posts/job-post-responsibilities/{job_post_id}": () =>
    buildRequestBody(jobPostResponsibilities.updateJobPostResponsibilityParamType, { exclude: ["job_post_id"] }),

  "POST /api/v1/workers/languages": () => buildRequestBody(languages.addLanguagesParamType),
  "PUT /api/v1/workers/languages/{id}": () => buildRequestBody(languages.updateLanguagesParamType, { exclude: ["id"] }),

  "POST /api/v1/nationalities": () => buildRequestBody(nationalities.addNationalityType),
  "PUT /api/v1/nationalities/{id}": () => buildRequestBody(nationalities.updateNationalityType, { exclude: ["id"] }),

  "POST /api/v1/workers/portfolios": () => buildRequestBody(portofolios.addPortfoliosParamType),
  "PUT /api/v1/workers/portfolios/{id}": () => buildRequestBody(portofolios.updatePortfoliosParamType, { exclude: ["id"] }),

  "PUT /api/v1/users/{user_id}/recruiters/{id}": () =>
    buildRequestBody(recruiters.updateRecruiterParamType, { exclude: ["id", "user_id"] }),
  "PUT /api/v1/users/recruiters": () => buildRequestBody(recruiters.updateRecruiterParamType, { exclude: ["id", "user_id"] }),

  "POST /api/v1/workers/resumes": () => buildRequestBody(resumes.addResumeType, { exclude: ["worker_id"] }),
  "PUT /api/v1/workers/resumes/{id}": () => buildRequestBody(resumes.updateResumeType, { exclude: ["id", "worker_id"] }),

  "POST /api/v1/saved-jobs/{job_post_id}": () => buildRequestBody(savedJobs.createSavedJobParamType, { exclude: ["job_post_id"] }),

  "POST /api/v1/skills": () => buildRequestBody(skills.addSkillType),
  "PUT /api/v1/skills/{id}": () => buildRequestBody(skills.updateSkillType, { exclude: ["id"] }),

  "POST /api/v1/users/register-worker": () =>
    withOverrides(buildRequestBody(users.registerParamType), { name: "Budi Santoso" }),
  "POST /api/v1/users/register-recruiter": () =>
    withOverrides(buildRequestBody(users.registerRecruiterParamType), { contact_name: "Budi Santoso" }),
  "PUT /api/v1/users/update-user/{id}": () => buildRequestBody(users.updateUserParamType, { exclude: ["id"] }),
  "POST /api/v1/users/login": () => buildRequestBody(users.loginParamType),
  "PUT /api/v1/users/refresh-token": () => buildRequestBody(users.refreshTokenParamType),
  "POST /api/v1/auth/change-password": () => buildRequestBody(users.changePasswordParamType),
  "POST /api/v1/auth/verify-email/send": () => buildRequestBody(users.sendVerifyEmailParamType),

  "PUT /api/v1/users/workers/me": () => buildRequestBody(workers.updateWorkerParamType, { exclude: ["id", "user_id"] }),
  "PUT /api/v1/users/{user_id}/workers/{id}": () => buildRequestBody(workers.updateWorkerParamType, { exclude: ["id", "user_id"] }),

  "POST /api/v1/workers/skills": () => buildRequestBody(workerSkills.addWorkerSkillsParamType, { exclude: ["worker_id"] }),

  "POST /api/v1/workers/work-exp": () => buildRequestBody(workExperiences.addWorkExperienceParamType, { exclude: ["worker_id"] }),
  "PUT /api/v1/workers/work-exp/{id}": () => buildRequestBody(workExperiences.updateWorkExperienceParamType, { exclude: ["id", "worker_id"] }),
};

// ---------------------------------------------------------------------------
// Apply to swagger_output.json
// ---------------------------------------------------------------------------
const doc = JSON.parse(fs.readFileSync(SWAGGER_PATH, "utf8"));

let applied = 0;
let missing = [];

for (const [key, builder] of Object.entries(ENDPOINTS)) {
  const [method, pathKey] = key.split(/ (.+)/); // split on first space only
  const op = doc.paths[pathKey] && doc.paths[pathKey][method.toLowerCase()];
  if (!op) {
    missing.push(key);
    continue;
  }
  op.requestBody = builder();
  applied++;
}

fs.writeFileSync(SWAGGER_PATH, JSON.stringify(doc, null, 2) + "\n", "utf8");

console.log(`Applied real examples to ${applied} endpoint(s).`);
if (missing.length) {
  console.log("No matching path/method found in swagger_output.json for:", missing);
}
