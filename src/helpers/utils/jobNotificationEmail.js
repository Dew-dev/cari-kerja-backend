const {
  emailLayout,
  primaryButton,
  infoCard,
  escapeHtml,
  BRAND,
} = require("./emailLayout");

/**
 * Job recommendation / alert notification (for future job alert workers).
 *
 * @param {{
 *   name?: string,
 *   jobTitle: string,
 *   companyName?: string,
 *   location?: string,
 *   employmentType?: string,
 *   salaryText?: string,
 *   snippet?: string,
 *   jobUrl: string,
 *   reason?: string
 * }} params
 */
module.exports = ({
  name,
  jobTitle,
  companyName,
  location,
  employmentType,
  salaryText,
  snippet,
  jobUrl,
  reason = "Cocok dengan profil atau preferensi Anda",
}) => {
  const displayName = escapeHtml(name || "di sana");

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${BRAND.text};">
      Lowongan baru untuk Anda
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Halo <strong style="color:${BRAND.text};">${displayName}</strong>,
    </p>
    <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Kami menemukan peluang yang mungkin menarik:
    </p>
    <div style="margin:18px 0;padding:18px;border:1px solid ${BRAND.border};border-radius:14px;background:#ffffff;">
      <div style="font-size:18px;font-weight:700;color:${BRAND.text};margin-bottom:6px;">
        ${escapeHtml(jobTitle)}
      </div>
      ${
        companyName
          ? `<div style="font-size:14px;color:${BRAND.primary};font-weight:600;margin-bottom:10px;">${escapeHtml(companyName)}</div>`
          : ""
      }
      ${
        snippet
          ? `<p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(snippet)}</p>`
          : ""
      }
    </div>
    ${infoCard([
      { label: "Lokasi", value: location },
      { label: "Tipe", value: employmentType },
      { label: "Gaji", value: salaryText },
      { label: "Alasan", value: reason },
    ])}
    <div style="text-align:center;margin:28px 0 8px 0;">
      ${primaryButton({ href: jobUrl, label: "Lihat Lowongan" })}
    </div>
    <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Anda menerima email ini karena notifikasi lowongan aktif di akun Cari Kerja.
    </p>
  `;

  return emailLayout({
    title: `Lowongan: ${String(jobTitle || "Cari Kerja")}`,
    preheader: `Lowongan baru: ${jobTitle || "Peluang kerja untuk Anda"}`,
    bodyHtml,
    footerNote: "Notifikasi lowongan dikirim otomatis oleh Cari Kerja.",
  });
};
