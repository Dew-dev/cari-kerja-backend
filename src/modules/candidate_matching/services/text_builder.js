const crypto = require("crypto");

const MIN_TEXT_CHARS = 20;

const hashText = (text) =>
  crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");

const joinLines = (parts) =>
  parts
    .flat()
    .map((p) => (p == null ? "" : String(p).trim()))
    .filter((p) => p.length > 0)
    .join("\n");

/**
 * Canonical job text for embedding / hashing.
 * @param {object} job
 */
const buildJobText = (job = {}) => {
  const skillNames = Array.isArray(job.skill_names)
    ? job.skill_names
    : Array.isArray(job.skills)
      ? job.skills.map((s) => (typeof s === "string" ? s : s.skill_name || s.name))
      : [];

  const requirements = Array.isArray(job.requirements)
    ? job.requirements.map((r) => (typeof r === "string" ? r : r.requirement))
    : [];
  const responsibilities = Array.isArray(job.responsibilities)
    ? job.responsibilities.map((r) =>
        typeof r === "string" ? r : r.responsibility,
      )
    : [];
  const benefits = Array.isArray(job.benefits)
    ? job.benefits.map((b) => (typeof b === "string" ? b : b.benefit))
    : [];

  return joinLines([
    job.title,
    job.description,
    job.experience_level_name,
    job.location,
    job.city,
    job.province,
    job.salary_min != null ? `salary_min:${job.salary_min}` : null,
    job.salary_max != null ? `salary_max:${job.salary_max}` : null,
    skillNames,
    requirements,
    responsibilities,
    benefits,
  ]);
};

/**
 * Canonical worker/candidate text for embedding / hashing.
 * @param {object} worker
 */
const buildWorkerText = (worker = {}) => {
  const skillNames = Array.isArray(worker.skill_names)
    ? worker.skill_names
    : Array.isArray(worker.skills)
      ? worker.skills.map((s) =>
          typeof s === "string" ? s : s.skill_name || s.name,
        )
      : [];

  const experiences = Array.isArray(worker.work_experiences)
    ? worker.work_experiences.map((exp) =>
        joinLines([
          exp.job_title,
          exp.company_name,
          exp.description,
        ]),
      )
    : [];

  const educations = Array.isArray(worker.educations)
    ? worker.educations.map((edu) =>
        joinLines([edu.degree, edu.major, edu.institution_name, edu.description]),
      )
    : [];

  const certifications = Array.isArray(worker.certifications)
    ? worker.certifications.map((c) =>
        joinLines([c.name, c.issuer, c.description]),
      )
    : [];

  return joinLines([
    worker.profile_summary,
    worker.address,
    worker.expected_salary != null ? `expected_salary:${worker.expected_salary}` : null,
    skillNames,
    experiences,
    educations,
    certifications,
  ]);
};

const isInsufficientText = (jobText, workerText) =>
  String(jobText || "").trim().length < MIN_TEXT_CHARS ||
  String(workerText || "").trim().length < MIN_TEXT_CHARS;

module.exports = {
  MIN_TEXT_CHARS,
  hashText,
  buildJobText,
  buildWorkerText,
  isInsufficientText,
};
