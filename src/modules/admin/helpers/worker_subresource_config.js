// Konfigurasi sub-resource worker sederhana (tabel per-worker dengan kolom updatable seragam).
// Dipakai oleh command domain admin untuk insert/update/delete generik.
const WORKER_SUBRESOURCES = {
  work_experiences: {
    table: "work_experiences",
    columns: ["company_name", "job_title", "job_title_id", "start_date", "end_date", "is_current", "description"],
    label: "Work experience",
  },
  educations: {
    table: "educations",
    columns: ["institution_name", "degree", "major", "start_date", "end_date", "is_current", "description"],
    label: "Education",
  },
  certifications: {
    table: "certifications",
    columns: ["name", "issuer", "link", "credential_id", "issue_date", "expiry_date", "is_active"],
    label: "Certification",
  },
  portfolios: {
    table: "portfolios",
    columns: ["title", "link", "description", "is_public"],
    label: "Portfolio",
  },
};

module.exports = { WORKER_SUBRESOURCES };
