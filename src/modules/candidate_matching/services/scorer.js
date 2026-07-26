const config = require("../../../config/global_config");

/**
 * Cosine similarity in [0, 1] using only the positive lobe.
 * Unrelated vectors → ~0 (NOT ~0.5). Mapping [-1,1]→[0,1] unfairly
 * inflated mid scores for noisy local bag-of-words embeddings.
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
  return Math.max(0, Math.min(1, sim));
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
  siem: "siem",
  soc: "soc",
  pentest: "penetration testing",
  "pen test": "penetration testing",
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

/**
 * Match strength for one job skill against worker skills.
 * 1 = exact / alias, 0.65 = strong partial, 0.4 = weak token overlap, 0 = none.
 */
const skillMatchStrength = (jobSkill, workerSet) => {
  if (workerSet.has(jobSkill)) return 1;

  let best = 0;
  for (const w of workerSet) {
    if (w === jobSkill) return 1;
    // Avoid ultra-short substring false positives (e.g. "c" in "react")
    if (jobSkill.length >= 3 && w.length >= 3) {
      if (w.includes(jobSkill) || jobSkill.includes(w)) {
        const ratio = Math.min(jobSkill.length, w.length) / Math.max(jobSkill.length, w.length);
        best = Math.max(best, ratio >= 0.7 ? 0.85 : 0.65);
        continue;
      }
    }
    const jt = jobSkill.split(" ").filter((t) => t.length >= 2);
    const wt = new Set(w.split(" ").filter((t) => t.length >= 2));
    if (jt.length === 0) continue;
    let hits = 0;
    for (const t of jt) {
      if (wt.has(t)) hits += 1;
    }
    const tokenRatio = hits / jt.length;
    if (tokenRatio >= 0.8) best = Math.max(best, 0.75);
    else if (tokenRatio >= 0.5) best = Math.max(best, 0.4);
  }
  return best;
};

/**
 * Skill overlap with partial credit (fairer than binary hit/miss).
 * Returns null when job has no skills (weight dropped).
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
    let credit = 0;
    for (const name of jobNames) {
      credit += skillMatchStrength(name, workerNames);
    }
    return Math.round((credit / jobNames.length) * 100);
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

/**
 * Experience fit. Soft over-qualification (still valuable) vs harsh under-qualification.
 */
const experienceFitPct = ({ experienceLevelName, totalYears = 0 }) => {
  const band = resolveBand(experienceLevelName);
  if (!band) return null;

  const years = Math.max(0, Number(totalYears) || 0);
  if (years >= band.min && years <= band.max) return 100;
  if (years < band.min) {
    const gap = band.min - years;
    // gentler under-band: -20%/yr (was -25)
    return Math.max(0, Math.round(100 - gap * 20));
  }
  const over = years - band.max;
  // overqualified still useful — soft floor 55
  return Math.max(55, Math.round(100 - over * 4));
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
 * Education only scores when the job text asks for a degree.
 * Having random education without a requirement no longer injects 80.
 */
const educationFitPct = ({ jobText = "", educations = [] }) => {
  const required = degreeRank(jobText);
  if (required === 0) return null;

  const workerBest = educations.reduce((max, edu) => {
    const rank = Math.max(
      degreeRank(edu.degree),
      degreeRank(edu.major),
      degreeRank(edu.description),
    );
    return Math.max(max, rank);
  }, 0);

  if (workerBest >= required) return 100;
  if (workerBest === 0) return 25;
  return Math.max(35, Math.round((workerBest / required) * 100));
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
  "staff",
  "officer",
  "associate",
]);

const TITLE_SYNONYMS = {
  engineer: ["developer", "programmer", "software"],
  developer: ["engineer", "programmer", "software"],
  programmer: ["developer", "engineer"],
  consultant: ["advisor", "specialist", "analyst"],
  advisor: ["consultant", "specialist"],
  specialist: ["consultant", "analyst", "expert"],
  cybersecurity: ["security", "infosec", "cyber", "information"],
  security: ["cybersecurity", "infosec", "cyber"],
  cyber: ["cybersecurity", "security"],
  analyst: ["specialist", "consultant"],
  manager: ["lead", "head"],
  lead: ["manager", "senior"],
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
 * Position fit via Jaccard on synonym-expanded title tokens.
 * Also awards a domain bonus when core role nouns overlap (security/cyber/…).
 */
const positionFitPct = ({ jobTitle = "", workExperiences = [] }) => {
  const titleOnly = String(jobTitle || "").trim();
  const jobTokens = expandTitleTokens(normalizeTokens(titleOnly));
  if (jobTokens.size === 0) return null;

  const titles = (workExperiences || [])
    .map((e) => e.job_title || e.title || "")
    .filter(Boolean);
  if (titles.length === 0) return 15;

  let best = 0;
  for (const title of titles) {
    const workerTokens = expandTitleTokens(normalizeTokens(title));
    if (workerTokens.size === 0) continue;

    let intersection = 0;
    for (const t of jobTokens) {
      if (workerTokens.has(t)) intersection += 1;
    }
    const union = new Set([...jobTokens, ...workerTokens]).size || 1;
    const jaccard = intersection / union;
    // Asymmetric recall: how much of the job title is covered
    const recall = intersection / jobTokens.size;
    const blended = 0.45 * jaccard + 0.55 * recall;
    best = Math.max(best, blended);
  }
  return Math.round(Math.min(1, best) * 100);
};

/**
 * Salary fit with a soft corridor (±30% outside range still scores partially).
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
    if (gap <= 0.3) return Math.round(100 - (gap / 0.3) * 40); // 100 → 60
    return Math.max(0, Math.round(60 - ((gap - 0.3) / 0.7) * 60));
  }

  const gap = (expected - hi) / hi;
  if (gap <= 0.3) return Math.round(100 - (gap / 0.3) * 35); // 100 → 65
  return Math.max(0, Math.round(65 - ((gap - 0.3) / 0.7) * 65));
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
  tangerang: "tangerang",
  bekasi: "bekasi",
  depok: "depok",
  bogor: "bogor",
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
 * Location: city/core match is enough for a strong score (don't require every field).
 */
const locationFitPct = ({
  jobLocation = "",
  jobCity = "",
  jobProvince = "",
  workerAddress = "",
}) => {
  const city = normalizeLocationPart(jobCity);
  const province = normalizeLocationPart(jobProvince);
  const location = normalizeLocationPart(jobLocation);
  const address = normalizeLocationPart(workerAddress);

  if ((!city && !province && !location) || !address) return null;

  // Strong: city contained in address (or vice versa)
  if (city && city.length >= 3 && (address.includes(city) || city.includes(address))) {
    return 100;
  }

  const jobParts = [location, city, province].filter(Boolean);
  let bestPartScore = 0;
  for (const part of jobParts) {
    if (part.length >= 3 && (address.includes(part) || part.includes(address))) {
      bestPartScore = Math.max(bestPartScore, part === province ? 70 : 95);
    }
  }
  if (bestPartScore > 0) return bestPartScore;

  const addrTokens = new Set(normalizeTokens(address).map((t) => LOCATION_ALIASES[t] || t));
  const jobTokens = normalizeTokens(jobParts.join(" ")).map((t) => LOCATION_ALIASES[t] || t);
  let tokenHits = 0;
  for (const t of jobTokens) {
    if (addrTokens.has(t)) tokenHits += 1;
  }
  if (tokenHits === 0) return 10;
  return Math.min(85, Math.round((tokenHits / Math.max(jobTokens.length, 1)) * 100));
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const isUsablePct = (value) => value != null && Number.isFinite(Number(value));

/**
 * Hybrid match score 0–100 (hybrid-v2.2).
 * Prioritizes skills + role; semantic is supportive only; missing signals renormalize.
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
  // Defaults tuned for fairness: skills/role first, semantic less dominant.
  let wSemantic = Number(weights.semantic ?? 0.15);
  let wSkills = Number(weights.skills ?? 0.3);
  let wPosition = Number(weights.position ?? 0.2);
  let wExperience = Number(weights.experience ?? 0.15);
  let wSalary = Number(weights.salary ?? 0.08);
  let wLocation = Number(weights.location ?? 0.12);
  let wEducation = Number(weights.education ?? 0);

  let semanticPct = skipSemantic
    ? null
    : semanticPctOverride != null && Number.isFinite(Number(semanticPctOverride))
      ? Math.max(0, Math.min(100, Number(semanticPctOverride)))
      : cosineSimilarity(jobEmbedding, workerEmbedding) * 100;

  // Treat near-noise semantic (<15) as unavailable so it doesn't drag scores.
  if (isUsablePct(semanticPct) && semanticPct < 15) {
    semanticPct = null;
  }

  const skillsPct = skillOverlapPct({
    jobSkillIds,
    workerSkillIds,
    jobSkillNames,
    workerSkillNames,
  });
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

  // Auto-enable a small education weight only when job requires a degree.
  if (wEducation <= 0 && isUsablePct(educationPct)) {
    wEducation = 0.05;
  }

  if (!isUsablePct(semanticPct)) wSemantic = 0;
  if (!isUsablePct(skillsPct)) wSkills = 0;
  if (!isUsablePct(positionPct)) wPosition = 0;
  if (!isUsablePct(experiencePct)) wExperience = 0;
  if (!isUsablePct(salaryPct)) wSalary = 0;
  if (!isUsablePct(locationPct)) wLocation = 0;
  if (!isUsablePct(educationPct)) wEducation = 0;

  const weightSum =
    wSemantic + wSkills + wPosition + wExperience + wSalary + wLocation + wEducation || 1;

  const raw =
    (wSemantic * (semanticPct || 0) +
      wSkills * (skillsPct || 0) +
      wPosition * (positionPct || 0) +
      wExperience * (experiencePct || 0) +
      wSalary * (salaryPct || 0) +
      wLocation * (locationPct || 0) +
      wEducation * (educationPct || 0)) /
    weightSum;

  // Soft calibration: stretch mid scores slightly so strong skill/role fits read clearer,
  // without creating fake 100s. Piecewise around 50.
  let calibrated = raw;
  if (raw >= 40 && raw <= 70) {
    calibrated = 40 + (raw - 40) * (35 / 30); // 40→40, 70→75
  }

  const match_score = clampScore(calibrated);

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
    { type: "education", label: "Education requirement fit", score: match_breakdown.education },
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
  skillMatchStrength,
};
