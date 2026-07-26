const CV_JSON_SCHEMA = {
  name: "cv_parsed_data",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["personal_info", "work_experiences", "educations", "skills"],
    properties: {
      personal_info: {
        type: "object",
        additionalProperties: false,
        required: ["full_name", "email", "phone", "location", "summary"],
        properties: {
          full_name: { type: ["string", "null"] },
          email: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
        },
      },
      work_experiences: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["company_name", "job_title", "start_date", "end_date", "is_current", "description"],
          properties: {
            company_name: { type: ["string", "null"] },
            job_title: { type: ["string", "null"] },
            start_date: { type: ["string", "null"] },
            end_date: { type: ["string", "null"] },
            is_current: { type: "boolean" },
            description: { type: ["string", "null"] },
          },
        },
      },
      educations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["institution_name", "degree", "major", "start_date", "end_date", "is_current", "description"],
          properties: {
            institution_name: { type: ["string", "null"] },
            degree: { type: ["string", "null"] },
            major: { type: ["string", "null"] },
            start_date: { type: ["string", "null"] },
            end_date: { type: ["string", "null"] },
            is_current: { type: "boolean" },
            description: { type: ["string", "null"] },
          },
        },
      },
      skills: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
};

module.exports = { CV_JSON_SCHEMA };
