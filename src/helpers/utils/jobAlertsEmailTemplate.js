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
 * Build HTML email for daily job alerts.
 * @param {{ name: string, jobs: Array<{ id: string, title: string, company_name: string, location: string, salary_min: any, salary_max: any, currency: string }> }}
 */
module.exports = ({ name, jobs }) => {
  const base = (config.get("/frontendUrl") || process.env.FE_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );

  const items = (jobs || [])
    .map((job) => {
      const url = `${base}/jobposts/${job.id}`;
      const location = job.location || "Lokasi fleksibel";
      const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
      const company = job.company_name || "Perusahaan";

      return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
          <a href="${url}" style="color:#111827;font-size:16px;font-weight:600;text-decoration:none;">
            ${escapeHtml(job.title)}
          </a>
          <div style="margin-top:4px;color:#4b5563;font-size:14px;">
            ${escapeHtml(company)} · ${escapeHtml(location)}
          </div>
          <div style="margin-top:4px;color:#6b7280;font-size:13px;">
            ${escapeHtml(salary)}
          </div>
          <div style="margin-top:10px;">
            <a href="${url}"
               style="display:inline-block;background:#2563eb;color:#ffffff;padding:8px 14px;border-radius:6px;text-decoration:none;font-size:13px;">
              Lihat lowongan
            </a>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rekomendasi Lowongan untuk Anda</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827;background:#f9fafb;margin:0;padding:24px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;">
    <tr>
      <td>
        <h1 style="font-size:20px;margin:0 0 8px;">Halo ${escapeHtml(name || "Job Seeker")},</h1>
        <p style="margin:0 0 20px;color:#4b5563;font-size:14px;">
          Berikut rekomendasi lowongan hari ini yang cocok dengan profil, skill, dan ekspektasi gaji Anda.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${items}
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
          Anda menerima email ini karena Job Alerts aktif di akun Cari Kerja.
          Nonaktifkan kapan saja dari pengaturan profil Anda.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
