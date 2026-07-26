/**
 * Structured output for GPT CV↔job fit used by hybrid matching.
 * Strict JSON schema for OpenAI Responses API.
 */
const MATCHING_CV_FIT_SCHEMA = {
  name: "matching_cv_job_fit",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "cv_fit_score",
      "skills_from_cv",
      "job_titles_from_cv",
      "years_experience_estimate",
      "location_hints",
      "fit_reasons",
      "profile_summary",
    ],
    properties: {
      cv_fit_score: {
        type: "number",
        description: "0-100 how well this CV fits the given job posting",
      },
      skills_from_cv: {
        type: "array",
        items: { type: "string" },
      },
      job_titles_from_cv: {
        type: "array",
        items: { type: "string" },
      },
      years_experience_estimate: {
        type: "number",
        description: "Estimated total years of relevant experience; use -1 if unknown",
      },
      location_hints: {
        type: "array",
        items: { type: "string" },
      },
      fit_reasons: {
        type: "array",
        items: { type: "string" },
      },
      profile_summary: {
        type: "string",
        description: "Short factual summary from the CV (no speculation)",
      },
    },
  },
};

module.exports = { MATCHING_CV_FIT_SCHEMA };
