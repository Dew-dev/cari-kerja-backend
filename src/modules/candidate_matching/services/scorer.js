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

/**
 * Skill overlap percentage: |intersection| / |job skills| * 100.
 * If job has no skills, returns 50 (neutral).
 */
const skillOverlapPct = ({ jobSkillIds = [], workerSkillIds = [] }) => {
  const jobSet = new Set(jobSkillIds.filter(Boolean).map(String));
  const workerSet = new Set(workerSkillIds.filter(Boolean).map(String));
  if (jobSet.size === 0) return 50;

  let overlap = 0;
  for (const id of jobSet) {
    if (workerSet.has(id)) overlap += 1;
  }
  return Math.round((overlap / jobSet.size) * 100);
};

/**
 * Experience fit vs job experience level name / expected years.
 * Levels: Fresh Graduate ~0-1, Junior ~1-3, Middle ~3-5, Senior 5+.
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
  if (!band) return 50;

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
    return educations.length > 0 ? 80 : 50;
  }
  if (workerBest >= required) return 100;
  if (workerBest === 0) return 20;
  return Math.max(30, Math.round((workerBest / required) * 100));
};

const normalizeTokens = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);

/**
 * Position / job-title fit: how well worker titles align with the job title.
 */
const positionFitPct = ({ jobTitle = "", workExperiences = [] }) => {
  const jobTokens = new Set(normalizeTokens(jobTitle));
  if (jobTokens.size === 0) return 50;

  const titles = (workExperiences || [])
    .map((e) => e.job_title || e.title || "")
    .filter(Boolean);
  if (titles.length === 0) return 25;

  let best = 0;
  for (const title of titles) {
    const tokens = normalizeTokens(title);
    if (tokens.length === 0) continue;
    let overlap = 0;
    for (const t of tokens) {
      if (jobTokens.has(t)) overlap += 1;
    }
    const ratio = overlap / jobTokens.size;
    best = Math.max(best, ratio);
  }
  return Math.round(best * 100);
};

/**
 * Expected salary vs job salary range.
 * Inside range → 100; near range → scaled; missing data → neutral 50.
 */
const salaryFitPct = ({
  expectedSalary,
  salaryMin,
  salaryMax,
}) => {
  const expected = Number(expectedSalary);
  const min = Number(salaryMin);
  const max = Number(salaryMax);

  if (!Number.isFinite(expected) || expected <= 0) return 50;
  if (!Number.isFinite(min) && !Number.isFinite(max)) return 50;

  const lo = Number.isFinite(min) && min > 0 ? min : max;
  const hi = Number.isFinite(max) && max > 0 ? max : min;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0) return 50;

  if (expected >= lo && expected <= hi) return 100;

  if (expected < lo) {
    const gap = (lo - expected) / lo;
    return Math.max(0, Math.round(100 - gap * 120));
  }

  const gap = (expected - hi) / hi;
  return Math.max(0, Math.round(100 - gap * 100));
};

/**
 * Location fit between job location fields and worker address.
 */
const locationFitPct = ({
  jobLocation = "",
  jobCity = "",
  jobProvince = "",
  workerAddress = "",
}) => {
  const jobParts = [jobLocation, jobCity, jobProvince]
    .map((p) => String(p || "").trim().toLowerCase())
    .filter(Boolean);
  const address = String(workerAddress || "").trim().toLowerCase();

  if (jobParts.length === 0 || !address) return 50;

  let hits = 0;
  for (const part of jobParts) {
    if (part.length >= 3 && address.includes(part)) hits += 1;
  }
  if (hits === 0) {
    // Token-level fallback (e.g. "Jakarta Selatan" vs "jakarta")
    const addrTokens = new Set(normalizeTokens(address));
    const jobTokens = normalizeTokens(jobParts.join(" "));
    let tokenHits = 0;
    for (const t of jobTokens) {
      if (addrTokens.has(t)) tokenHits += 1;
    }
    if (tokenHits === 0) return 20;
    return Math.min(90, Math.round((tokenHits / Math.max(jobTokens.length, 1)) * 100));
  }
  return Math.min(100, Math.round((hits / jobParts.length) * 100));
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Hybrid match score 0–100.
 * Components: semantic, skills, position, experience (work history), salary, location.
 * @param {object} opts
 * @param {number} [opts.semanticPctOverride] - optional 0–100 from ES knn
 */
const computeHybridScore = ({
  jobEmbedding,
  workerEmbedding,
  jobSkillIds,
  workerSkillIds,
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
}) => {
  const cfg = config.get("/matching") || {};
  const weights = weightsOverride || cfg.weights || {};
  const wSemantic = Number(weights.semantic ?? 0.25);
  const wSkills = Number(weights.skills ?? 0.25);
  const wPosition = Number(weights.position ?? 0.15);
  const wExperience = Number(weights.experience ?? 0.15);
  const wSalary = Number(weights.salary ?? 0.1);
  const wLocation = Number(weights.location ?? 0.1);
  // Keep education as soft bonus folded into remaining weight if explicitly provided
  const wEducation = Number(weights.education ?? 0);

  const semanticPct =
    semanticPctOverride != null && Number.isFinite(Number(semanticPctOverride))
      ? Math.max(0, Math.min(100, Number(semanticPctOverride)))
      : cosineSimilarity(jobEmbedding, workerEmbedding) * 100;
  const skillsPct = skillOverlapPct({ jobSkillIds, workerSkillIds });
  const positionPct = positionFitPct({
    jobTitle: jobTitle || jobText,
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

  const weightSum =
    wSemantic + wSkills + wPosition + wExperience + wSalary + wLocation + wEducation || 1;

  const match_score = clampScore(
    (wSemantic * semanticPct +
      wSkills * skillsPct +
      wPosition * positionPct +
      wExperience * experiencePct +
      wSalary * salaryPct +
      wLocation * locationPct +
      wEducation * educationPct) /
      weightSum,
  );

  const match_breakdown = {
    semantic: clampScore(semanticPct),
    skills: clampScore(skillsPct),
    position: clampScore(positionPct),
    experience: clampScore(experiencePct),
    salary: clampScore(salaryPct),
    location: clampScore(locationPct),
    education: clampScore(educationPct),
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
  ].sort((a, b) => b.score - a.score);

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
};
