const config = require("../../../config/global_config");

/**
 * Cosine similarity between two equal-length vectors (clamped to [0, 1]).
 */
const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    const av = Number(a[i]) || 0;
    const bv = Number(b[i]) || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  // Map [-1,1] → [0,1] for scoring
  return Math.max(0, Math.min(1, (sim + 1) / 2));
};

const SKILL_ALIASES = {
  js: "javascript",
  "node.js": "nodejs",
  "node js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  "react.js": "react",
  "react js": "react",
  reactjs: "react",
  "vue.js": "vue",
  "vue js": "vue",
  "next.js": "nextjs",
  "next js": "nextjs",
  nextjs: "nextjs",
  ts: "typescript",
  "c#": "csharp",
  "c++": "cpp",
  postgres: "postgresql",
  k8s: "kubernetes",
  aws: "amazon web services",
  gcp: "google cloud",
  ml: "machine learning",
  ai: "artificial intelligence",
  cyber: "cybersecurity",
  "info sec": "information security",
  infosec: "information security",
};

const normalizeSkillLabel = (value) => {
  let s = String(value || "")
    .trim()
    .toLowerCase();
  if (!s) return "";
  if (SKILL_ALIASES[s]) return SKILL_ALIASES[s];
  s = s
    .replace(/[#.+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (SKILL_ALIASES[s]) return SKILL_ALIASES[s];
  const compact = s.replace(/\s+/g, "");
  if (SKILL_ALIASES[compact]) return SKILL_ALIASES[compact];
  return s;
};

const skillMatches = (jobSkill, workerSet) => {
  if (workerSet.has(jobSkill)) return true;
  for (const w of workerSet) {
    if (w.includes(jobSkill) || jobSkill.includes(w)) return true;
    const jt = new Set(jobSkill.split(" ").filter((t) => t.length >= 2));
    const wt = new Set(w.split(" ").filter((t) => t.length >= 2));
    let hits = 0;
    for (const t of jt) {
      if (wt.has(t)) hits += 1;
    }
    if (jt.size > 0 && hits / jt.size >= 0.6) return true;
  }
  return false;
};

/**
 * Skill overlap percentage.
 * Prefers fuzzy name intersection; falls back to skill UUID overlap.
 * Returns null when job has no skills (weight should be dropped).
 */
const skillOverlapPct = ({
  jobSkillIds = [],
  workerSkillIds = [],
  jobSkillNames = [],
  workerSkillNames = [],
}) => {
  const jobNames = [
    ...new Set(
      [...jobSkillNames]
        .map((n) => normalizeSkillLabel(n))
        .filter(Boolean),
    ),
  ];
  const workerNames = new Set(
    [...workerSkillNames]
      .map((n) => normalizeSkillLabel(n))
      .filter(Boolean),
  );

  if (jobNames.length > 0) {
    let overlap = 0;
    for (const name of jobNames) {
      if (skillMatches(name, workerNames)) overlap += 1;
    }
    return Math.round((overlap / jobNames.length) * 100);
  }

  const jobIds = new Set(jobSkillIds.filter(Boolean).map(String));
  const workerIds = new Set(workerSkillIds.filter(Boolean).map(String));
  if (jobIds.size === 0) return null;

  let overlap = 0;
  for (const id of jobIds) {
    if (workerIds.has(id)) overlap += 1;
  }
  return Math.round((overlap / jobIds.size) * 100);
};

/**
 * Experience fit vs job experience level name / expected years.
 * Returns null when level unknown (weight dropped).
 */
const EXPERIENCE_BANDS = {
  fresh: { min: 0, max: 1 },
  graduate: { min: 0, max: 1 },
  junior: { min: 1, max: 3 },
  middle: { min: 3, max: 5 },
  mid: { min: 3, max: 5 },
  senior: { min: 5, max: 40 },
  lead: { min: 7, max: 40 },
  principal: { min: 8, max: 40 },
};

const resolveBand = (experienceLevelName) => {
  const name = String(experienceLevelName || "").toLowerCase();
  for (const [key, band] of Object.entries(EXPERIENCE_BANDS)) {
    if (name.includes(key)) return band;
  }
  return null;
};

const experienceFitPct = ({ experienceLevelName, totalYears = 0 }) => {
  const band = resolveBand(experienceLevelName);
  if (!band) return null;

  const years = Math.max(0, Number(totalYears) || 0);
  if (years >= band.min && years <= band.max) return 100;
  if (years < band.min) {
    const gap = band.min - years;
    return Math.max(0, Math.round(100 - gap * 25));
  }
  const over = years - band.max;
  return Math.max(40, Math.round(100 - over * 5));
};

const EDUCATION_KEYWORDS = [
  { re: /\b(s3|phd|doctoral|doktor)\b/i, rank: 4 },
  { re: /\b(s2|master|magister|mba)\b/i, rank: 3 },
  { re: /\b(s1|bachelor|sarjana|undergraduate)\b/i, rank: 2 },
  { re: /\b(d4|d3|diploma|associate)\b/i, rank: 1 },
];

const degreeRank = (text) => {
  const raw = String(text || "");
  for (const item of EDUCATION_KEYWORDS) {
    if (item.re.test(raw)) return item.rank;
  }
  return 0;
};

/**
 * Education fit: if job text mentions a degree level, compare to worker's highest.
 * Otherwise reward having any education mildly.
 */
const educationFitPct = ({ jobText = "", educations = [] }) => {
  const required = degreeRank(jobText);
  const workerBest = educations.reduce((max, edu) => {
    const rank = Math.max(
      degreeRank(edu.degree),
      degreeRank(edu.major),
      degreeRank(edu.description),
    );
    return Math.max(max, rank);
  }, 0);

  if (required === 0) {
    return educations.length > 0 ? 80 : null;
  }
  if (workerBest >= required) return 100;
  if (workerBest === 0) return 20;
  return Math.max(30, Math.round((workerBest / required) * 100));
};

const TITLE_STOPWORDS = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "of",
  "for",
  "to",
  "in",
  "at",
  "dengan",
  "dan",
  "untuk",
  "sebagai",
]);

const TITLE_SYNONYMS = {
  engineer: ["developer", "programmer", "software"],
  developer: ["engineer", "programmer"],
  consultant: ["advisor", "specialist"],
  cybersecurity: ["security", "infosec", "cyber"],
  security: ["cybersecurity", "infosec", "cyber"],
  analyst: ["specialist"],
};

const normalizeTokens = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !TITLE_STOPWORDS.has(t));

const expandTitleTokens = (tokens) => {
  const out = new Set(tokens);
  for (const t of tokens) {
    const syns = TITLE_SYNONYMS[t];
    if (syns) syns.forEach((s) => out.add(s));
  }
  return out;
};

/**
 * Position / job-title fit: worker titles vs job title only (never full JD text).
 * Returns null when job title empty (weight dropped).
 */
const positionFitPct = ({ jobTitle = "", workExperiences = [] }) => {
  const titleOnly = String(jobTitle || "").trim();
  const jobTokens = expandTitleTokens(normalizeTokens(titleOnly));
  if (jobTokens.size === 0) return null;

  const titles = (workExperiences || [])
    .map((e) => e.job_title || e.title || "")
    .filter(Boolean);
  if (titles.length === 0) return 20;

  let best = 0;
  for (const title of titles) {
    const tokens = expandTitleTokens(normalizeTokens(title));
    if (tokens.size === 0) continue;
    let overlap = 0;
    for (const t of tokens) {
      if (jobTokens.has(t)) overlap += 1;
    }
    const ratio = overlap / Math.max(jobTokens.size, 1);
    best = Math.max(best, Math.min(1, ratio));
  }
  return Math.round(best * 100);
};

/**
 * Expected salary vs job salary range.
 * Returns null when either side missing (weight dropped).
 */
const salaryFitPct = ({
  expectedSalary,
  salaryMin,
  salaryMax,
}) => {
  const expected = Number(expectedSalary);
  const min = Number(salaryMin);
  const max = Number(salaryMax);

  if (!Number.isFinite(expected) || expected <= 0) return null;
  if (!Number.isFinite(min) && !Number.isFinite(max)) return null;

  const lo = Number.isFinite(min) && min > 0 ? min : max;
  const hi = Number.isFinite(max) && max > 0 ? max : min;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0) return null;

  if (expected >= lo && expected <= hi) return 100;

  if (expected < lo) {
    const gap = (lo - expected) / lo;
    return Math.max(0, Math.round(100 - gap * 120));
  }

  const gap = (expected - hi) / hi;
  return Math.max(0, Math.round(100 - gap * 100));
};

const LOCATION_ALIASES = {
  jkt: "jakarta",
  "dki jakarta": "jakarta",
  "jakarta pusat": "jakarta",
  "jakarta selatan": "jakarta selatan",
  "jakarta barat": "jakarta barat",
  "jakarta timur": "jakarta timur",
  "jakarta utara": "jakarta utara",
  jogja: "yogyakarta",
  jogjakarta: "yogyakarta",
  "di yogyakarta": "yogyakarta",
  bandung: "bandung",
  surabaya: "surabaya",
};

const normalizeLocationPart = (value) => {
  let s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!s) return "";
  if (LOCATION_ALIASES[s]) s = LOCATION_ALIASES[s];
  return s;
};

/**
 * Location fit between job location fields and worker address.
 * Returns null when either side missing (weight dropped).
 */
const locationFitPct = ({
  jobLocation = "",
  jobCity = "",
  jobProvince = "",
  workerAddress = "",
}) => {
  const jobParts = [jobLocation, jobCity, jobProvince]
    .map((p) => normalizeLocationPart(p))
    .filter(Boolean);
  const address = normalizeLocationPart(workerAddress);

  if (jobParts.length === 0 || !address) return null;

  let hits = 0;
  for (const part of jobParts) {
    if (part.length >= 3 && (address.includes(part) || part.includes(address))) hits += 1;
  }
  if (hits === 0) {
    const addrTokens = new Set(normalizeTokens(address));
    const jobTokens = normalizeTokens(jobParts.join(" "));
    let tokenHits = 0;
    for (const t of jobTokens) {
      if (addrTokens.has(t) || LOCATION_ALIASES[t] && addrTokens.has(LOCATION_ALIASES[t])) {
        tokenHits += 1;
      }
    }
    if (tokenHits === 0) return 15;
    return Math.min(90, Math.round((tokenHits / Math.max(jobTokens.length, 1)) * 100));
  }
  return Math.min(100, Math.round((hits / jobParts.length) * 100));
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const isUsablePct = (value) => value != null && Number.isFinite(Number(value));

/**
 * Hybrid match score 0–100.
 * Missing signals drop their weight and remaining weights renormalize (fairer than neutral 50).
 * @param {object} opts
 * @param {number} [opts.semanticPctOverride]
 * @param {boolean} [opts.skipSemantic] - drop semantic weight (short text / unavailable)
 */
const computeHybridScore = ({
  jobEmbedding,
  workerEmbedding,
  jobSkillIds,
  workerSkillIds,
  jobSkillNames,
  workerSkillNames,
  experienceLevelName,
  totalYears,
  jobText,
  educations,
  jobTitle,
  workExperiences,
  expectedSalary,
  salaryMin,
  salaryMax,
  jobLocation,
  jobCity,
  jobProvince,
  workerAddress,
  weights: weightsOverride,
  semanticPctOverride,
  skipSemantic = false,
}) => {
  const cfg = config.get("/matching") || {};
  const weights = weightsOverride || cfg.weights || {};
  let wSemantic = Number(weights.semantic ?? 0.25);
  let wSkills = Number(weights.skills ?? 0.25);
  let wPosition = Number(weights.position ?? 0.15);
  let wExperience = Number(weights.experience ?? 0.15);
  let wSalary = Number(weights.salary ?? 0.1);
  let wLocation = Number(weights.location ?? 0.1);
  let wEducation = Number(weights.education ?? 0);

  const semanticPct = skipSemantic
    ? null
    : semanticPctOverride != null && Number.isFinite(Number(semanticPctOverride))
      ? Math.max(0, Math.min(100, Number(semanticPctOverride)))
      : cosineSimilarity(jobEmbedding, workerEmbedding) * 100;

  const skillsPct = skillOverlapPct({
    jobSkillIds,
    workerSkillIds,
    jobSkillNames,
    workerSkillNames,
  });
  // Title only — never fall back to full job description text.
  const positionPct = positionFitPct({
    jobTitle: jobTitle || "",
    workExperiences: workExperiences || [],
  });
  const experiencePct = experienceFitPct({ experienceLevelName, totalYears });
  const salaryPct = salaryFitPct({ expectedSalary, salaryMin, salaryMax });
  const locationPct = locationFitPct({
    jobLocation,
    jobCity,
    jobProvince,
    workerAddress,
  });
  const educationPct = educationFitPct({ jobText, educations });

  if (!isUsablePct(semanticPct)) wSemantic = 0;
  if (!isUsablePct(skillsPct)) wSkills = 0;
  if (!isUsablePct(positionPct)) wPosition = 0;
  if (!isUsablePct(experiencePct)) wExperience = 0;
  if (!isUsablePct(salaryPct)) wSalary = 0;
  if (!isUsablePct(locationPct)) wLocation = 0;
  if (!isUsablePct(educationPct)) wEducation = 0;

  const weightSum =
    wSemantic + wSkills + wPosition + wExperience + wSalary + wLocation + wEducation || 1;

  const match_score = clampScore(
    (wSemantic * (semanticPct || 0) +
      wSkills * (skillsPct || 0) +
      wPosition * (positionPct || 0) +
      wExperience * (experiencePct || 0) +
      wSalary * (salaryPct || 0) +
      wLocation * (locationPct || 0) +
      wEducation * (educationPct || 0)) /
      weightSum,
  );

  const match_breakdown = {
    semantic: isUsablePct(semanticPct) ? clampScore(semanticPct) : null,
    skills: isUsablePct(skillsPct) ? clampScore(skillsPct) : null,
    position: isUsablePct(positionPct) ? clampScore(positionPct) : null,
    experience: isUsablePct(experiencePct) ? clampScore(experiencePct) : null,
    salary: isUsablePct(salaryPct) ? clampScore(salaryPct) : null,
    location: isUsablePct(locationPct) ? clampScore(locationPct) : null,
    education: isUsablePct(educationPct) ? clampScore(educationPct) : null,
    weights: {
      semantic: wSemantic,
      skills: wSkills,
      position: wPosition,
      experience: wExperience,
      salary: wSalary,
      location: wLocation,
      education: wEducation,
    },
  };

  const reasonCandidates = [
    { type: "skills", label: "Skill overlap with job requirements", score: match_breakdown.skills },
    { type: "position", label: "Job title / role fit from work history", score: match_breakdown.position },
    { type: "experience", label: "Work history / experience level fit", score: match_breakdown.experience },
    { type: "salary", label: "Expected salary vs job range", score: match_breakdown.salary },
    { type: "location", label: "Location fit", score: match_breakdown.location },
    { type: "semantic", label: "Profile similarity to job description", score: match_breakdown.semantic },
  ]
    .filter((r) => r.score != null)
    .sort((a, b) => b.score - a.score);

  const match_reasons = reasonCandidates.slice(0, 3).map((r) => ({
    type: r.type,
    label: r.label,
    score: r.score,
  }));

  return { match_score, match_breakdown, match_reasons };
};

module.exports = {
  cosineSimilarity,
  skillOverlapPct,
  experienceFitPct,
  educationFitPct,
  positionFitPct,
  salaryFitPct,
  locationFitPct,
  computeHybridScore,
  clampScore,
  normalizeSkillLabel,
};
