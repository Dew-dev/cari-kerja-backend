/** Required + optional document types for employer company verification. */
const REQUIRED_DOC_TYPES = ["npwp", "nib", "akta", "ktp_pic"];

const OPTIONAL_DOC_TYPES = ["sk_kemenkumham", "domicile"];

const ALL_DOC_TYPES = [...REQUIRED_DOC_TYPES, ...OPTIONAL_DOC_TYPES];

const DOC_TYPE_LABELS = {
  npwp: "NPWP Perusahaan",
  nib: "NIB (Nomor Induk Berusaha)",
  akta: "Akta Pendirian / Perubahan Perusahaan",
  ktp_pic: "KTP Penanggung Jawab",
  sk_kemenkumham: "SK Pengesahan Kemenkumham (opsional)",
  domicile: "Surat Keterangan Domisili (opsional)",
};

const SUSPENSION_REASON_VERIFICATION = "verification_incomplete";

const VERIFICATION_STATUSES = {
  GRACE: "grace",
  PENDING_REVIEW: "pending_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
  BLOCKED_INCOMPLETE: "blocked_incomplete",
};

const APPLICATION_STATUSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

module.exports = {
  REQUIRED_DOC_TYPES,
  OPTIONAL_DOC_TYPES,
  ALL_DOC_TYPES,
  DOC_TYPE_LABELS,
  SUSPENSION_REASON_VERIFICATION,
  VERIFICATION_STATUSES,
  APPLICATION_STATUSES,
};
