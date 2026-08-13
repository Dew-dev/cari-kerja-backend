const {
  emailLayout,
  primaryButton,
  escapeHtml,
  BRAND,
} = require("./emailLayout");

/**
 * Password reset template.
 * @param {{ name?: string, resetUrl: string }} params
 */
module.exports = function resetPasswordEmail({ name, resetUrl }) {
  const displayName = escapeHtml(name || "di sana");

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${BRAND.text};">
      Reset kata sandi
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Halo <strong style="color:${BRAND.text};">${displayName}</strong>,
    </p>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Kami menerima permintaan untuk mengatur ulang kata sandi akun Cari Kerja Anda.
      Klik tombol di bawah untuk membuat kata sandi baru.
    </p>
    <div style="text-align:center;margin:28px 0;">
      ${primaryButton({ href: resetUrl, label: "Atur Ulang Kata Sandi" })}
    </div>
    <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Tautan ini berlaku selama <strong>30 menit</strong>. Jika tombol tidak berfungsi, salin tautan berikut:
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;color:${BRAND.primary};">
      ${escapeHtml(resetUrl)}
    </p>
    <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Jika Anda tidak meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.
    </p>
  `;

  return emailLayout({
    title: "Reset Kata Sandi — Cari Kerja",
    preheader: "Atur ulang kata sandi akun Cari Kerja Anda.",
    bodyHtml,
    footerNote: "Email reset kata sandi dikirim otomatis oleh Cari Kerja.",
  });
};
