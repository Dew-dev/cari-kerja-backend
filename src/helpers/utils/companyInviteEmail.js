const {
  emailLayout,
  primaryButton,
  escapeHtml,
  BRAND,
} = require("./emailLayout");

/**
 * Company team invitation email.
 * @param {{ inviterName?: string, companyName: string, role: string, inviteUrl: string, expiresInDays?: number }} params
 */
module.exports = ({
  inviterName,
  companyName,
  role,
  inviteUrl,
  expiresInDays = 7,
}) => {
  const inviter = escapeHtml(inviterName || "Seorang rekan");
  const company = escapeHtml(companyName || "perusahaan");
  const roleLabel = escapeHtml(role || "recruiter");

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${BRAND.text};">
      Undangan bergabung sebagai recruiter
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Halo,
    </p>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      <strong style="color:${BRAND.text};">${inviter}</strong> mengundang Anda bergabung ke
      <strong style="color:${BRAND.text};">${company}</strong> di Cari Kerja
      dengan peran <strong style="color:${BRAND.text};">${roleLabel}</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      ${primaryButton({ href: inviteUrl, label: "Terima Undangan" })}
    </div>
    <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Tautan ini berlaku selama <strong>${expiresInDays} hari</strong>. Jika tombol tidak berfungsi, salin tautan berikut:
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;color:${BRAND.primary};">
      ${escapeHtml(inviteUrl)}
    </p>
    <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Jika Anda tidak mengharapkan undangan ini, abaikan email ini.
    </p>
  `;

  return emailLayout({
    preheader: `Undangan bergabung ke ${companyName || "perusahaan"}`,
    bodyHtml,
  });
};
