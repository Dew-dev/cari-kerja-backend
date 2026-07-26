const config = require("../../config/global_config");

function formatSalary(min, max, currency) {
  const cur = currency || "IDR";
  const fmt = (n) => {
    if (n == null) return null;
    const num = Number(n);
    if (Number.isNaN(num)) return null;
    return `${cur} ${num.toLocaleString("id-ID")}`;
  };
  const minStr = fmt(min);
  const maxStr = fmt(max);
  if (minStr && maxStr) return `${minStr} – ${maxStr}`;
  if (minStr) return `dari ${minStr}`;
  if (maxStr) return `hingga ${maxStr}`;
  return "Gaji kompetitif";
}

/**
 * Plain-text chat digest for daily job recommendations.
 * @param {{ name?: string, jobs: Array<{ id: string, title: string, company_name: string, location: string, salary_min: any, salary_max: any, currency: string }> }}
 */
module.exports = ({ name, jobs }) => {
  const base = (config.get("/frontendUrl") || process.env.FE_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  const greeting = name && String(name).trim() ? String(name).trim() : "Job Seeker";
  const list = (jobs || [])
    .map((job, idx) => {
      const url = job.id && base ? `${base}/jobposts/${job.id}` : "";
      const company = job.company_name || "Perusahaan";
      const location = job.location || "Lokasi fleksibel";
      const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
      const lines = [
        `${idx + 1}. ${job.title || "Lowongan"} — ${company}`,
        `   Lokasi: ${location} | ${salary}`,
      ];
      if (url) lines.push(`   ${url}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return [
    `Halo ${greeting}!`,
    "",
    "Berikut rekomendasi lowongan hari ini yang cocok dengan posisi, skill, dan ekspektasi gaji Anda:",
    "",
    list,
    "",
    "Anda menerima pesan ini karena Job Alerts aktif. Nonaktifkan kapan saja dari pengaturan profil.",
  ].join("\n");
};
