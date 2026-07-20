/**
 * Heuristik konten lowongan → risk_score + flags.
 * Dipakai sebelum publish (OPEN) untuk menahan ke PENDING bila mencurigakan.
 */

const REVIEW_THRESHOLD = 40;
const PENDING_JOB_STATUS_ID = 4;

const RULES = [
  {
    code: "WHATSAPP_CONTACT",
    weight: 35,
    detail: "Promotes WhatsApp-only / WA contact",
    test: (text) =>
      /\b(wa\.me|whatsapp|hubungi\s*wa|chat\s*wa|dm\s*wa|nomor\s*wa)\b/i.test(text) ||
      /\b08\d{8,12}\b/.test(text),
  },
  {
    code: "TELEGRAM_CONTACT",
    weight: 30,
    detail: "Promotes Telegram-only contact",
    test: (text) => /\b(t\.me\/|telegram\.me|hubungi\s*telegram|dm\s*telegram)\b/i.test(text),
  },
  {
    code: "PAYMENT_ASK",
    weight: 45,
    detail: "Asks candidate to pay / transfer money",
    test: (text) =>
      /\b(bayar\s*dulu|transfer\s*(dulu|biaya)|biaya\s*admin|biaya\s*pendaftaran|payment\s*required|pay\s*to\s*apply|registration\s*fee|upfront\s*fee)\b/i.test(
        text
      ),
  },
  {
    code: "SHORTLINK",
    weight: 25,
    detail: "Contains URL shortener",
    test: (text) =>
      /\b(bit\.ly|tinyurl\.com|t\.co\/|cutt\.ly|s\.id\/|linktr\.ee|rb\.gy)\b/i.test(text),
  },
  {
    code: "CRYPTO_SCAM_SIGNAL",
    weight: 40,
    detail: "Crypto / investment scam signals",
    test: (text) =>
      /\b(crypto|bitcoin|forex|trading\s*signal|investasi\s*modal|passive\s*income|profit\s*jaminan)\b/i.test(
        text
      ),
  },
  {
    code: "TOO_SHORT",
    weight: 20,
    detail: "Description too short for a real job post",
    test: (_text, { description }) =>
      !description || String(description).trim().length < 40,
  },
];

const normalizeText = (job) => {
  const parts = [
    job?.title,
    job?.description,
    job?.location,
    ...(Array.isArray(job?.requirements)
      ? job.requirements.map((r) => (typeof r === "string" ? r : r?.requirement))
      : []),
    ...(Array.isArray(job?.responsibilities)
      ? job.responsibilities.map((r) =>
          typeof r === "string" ? r : r?.responsibility
        )
      : []),
    ...(Array.isArray(job?.benefits)
      ? job.benefits.map((b) => (typeof b === "string" ? b : b?.benefit))
      : []),
  ];
  return parts.filter(Boolean).join(" \n ").toLowerCase();
};

/**
 * @param {object} job
 * @returns {{ risk_score: number, flags: Array<{code:string,detail:string,weight:number}>, needs_review: boolean, threshold: number }}
 */
const scoreJobPost = (job) => {
  const text = normalizeText(job);
  const flags = [];
  let risk_score = 0;

  for (const rule of RULES) {
    if (rule.test(text, job || {})) {
      flags.push({ code: rule.code, detail: rule.detail, weight: rule.weight });
      risk_score += rule.weight;
    }
  }

  return {
    risk_score,
    flags,
    needs_review: risk_score >= REVIEW_THRESHOLD,
    threshold: REVIEW_THRESHOLD,
  };
};

module.exports = {
  REVIEW_THRESHOLD,
  PENDING_JOB_STATUS_ID,
  scoreJobPost,
};
