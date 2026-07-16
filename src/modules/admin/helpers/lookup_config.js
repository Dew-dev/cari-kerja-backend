// Shared whitelist for generic admin lookup endpoints (/admin/lookups/:table).
// column = kolom utama yang di-insert/update, select = kolom yang dikembalikan di response.
const LOOKUP_CONFIG = {
  genders: { column: "gender_name", select: "id, gender_name" },
  marriage_statuses: { column: "status_name", select: "id, status_name" },
  religions: { column: "religion_name", select: "id, religion_name" },
  employment_types: { column: "name", select: "id, name" },
  experience_levels: { column: "name", select: "id, name" },
  salary_types: { column: "name", select: "id, name" },
  job_post_statuses: { column: "name", select: "id, name" },
  application_statuses: { column: "name", select: "id, name" },
  question_types: { column: "name", select: "id, name" },
  industries: { column: "name", select: "id, name" },
  proficiency_levels: { column: "name", select: "id, name" },
  job_tags: { column: "name", select: "id, name" },
  skills: { column: "skill_name", select: "id, skill_name" },
  nationalities: { column: "country_name", select: "id, country_name, iso_alpha2, iso_alpha3" },
  roles: { column: "name", select: "id, name" },
  currencies: { column: "name", select: "id, code, numeric_code, name, symbol" },
  categories: { column: "name", select: "id, name" },
};

module.exports = { LOOKUP_CONFIG };
