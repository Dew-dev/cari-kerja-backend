const {
  emailLayout,
  primaryButton,
  escapeHtml,
  BRAND,
} = require("./emailLayout");

/**
 * Email verification template (register / change-email / resend).
 * @param {{ name?: string, verifyUrl: string }} params
 */
module.exports = ({ name, verifyUrl }) => {
  const displayName = escapeHtml(name || "di sana");

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${BRAND.text};">
      Verifikasi email Anda
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Halo <strong style="color:${BRAND.text};">${displayName}</strong>,
    </p>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Terima kasih telah bergabung di <strong style="color:${BRAND.text};">Cari Kerja</strong>.
      Silakan verifikasi alamat email Anda agar akun siap digunakan untuk notifikasi lowongan,
      newsletter, dan pemulihan kata sandi.
    </p>
    <div style="text-align:center;margin:28px 0;">
      ${primaryButton({ href: verifyUrl, label: "Verifikasi Email" })}
    </div>
    <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Tautan ini berlaku selama <strong>30 menit</strong>. Jika tombol tidak berfungsi, salin tautan berikut ke browser:
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;color:${BRAND.primary};">
      ${escapeHtml(verifyUrl)}
    </p>
    <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Jika Anda tidak membuat akun atau tidak meminta perubahan email, abaikan pesan ini.
    </p>
  `;

  return emailLayout({
    title: "Verifikasi Email — Cari Kerja",
    preheader: "Verifikasi email Anda untuk mengaktifkan notifikasi di Cari Kerja.",
    bodyHtml,
    footerNote: "Email verifikasi dikirim otomatis oleh Cari Kerja.",
  });
};
