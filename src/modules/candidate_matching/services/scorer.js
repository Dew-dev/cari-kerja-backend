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

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Hybrid match score 0–100.
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
  weights: weightsOverride,
}) => {
  const cfg = config.get("/matching") || {};
  const weights = weightsOverride || cfg.weights || {};
  const wSemantic = Number(weights.semantic ?? 0.5);
  const wSkills = Number(weights.skills ?? 0.25);
  const wExperience = Number(weights.experience ?? 0.15);
  const wEducation = Number(weights.education ?? 0.1);

  const semanticPct = cosineSimilarity(jobEmbedding, workerEmbedding) * 100;
  const skillsPct = skillOverlapPct({ jobSkillIds, workerSkillIds });
  const experiencePct = experienceFitPct({ experienceLevelName, totalYears });
  const educationPct = educationFitPct({ jobText, educations });

  const match_score = clampScore(
    wSemantic * semanticPct +
      wSkills * skillsPct +
      wExperience * experiencePct +
      wEducation * educationPct,
  );

  const match_breakdown = {
    semantic: clampScore(semanticPct),
    skills: clampScore(skillsPct),
    experience: clampScore(experiencePct),
    education: clampScore(educationPct),
    weights: {
      semantic: wSemantic,
      skills: wSkills,
      experience: wExperience,
      education: wEducation,
    },
  };

  const reasonCandidates = [
    { type: "skills", label: "Skill overlap with job requirements", score: match_breakdown.skills },
    { type: "semantic", label: "Profile similarity to job description", score: match_breakdown.semantic },
    { type: "experience", label: "Experience level fit", score: match_breakdown.experience },
    { type: "education", label: "Education fit", score: match_breakdown.education },
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
  computeHybridScore,
  clampScore,
};
