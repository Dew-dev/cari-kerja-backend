const {
  emailLayout,
  primaryButton,
  infoCard,
  escapeHtml,
  BRAND,
} = require("./emailLayout");

function statusMessage(status) {
  const normalized = String(status || "").trim().toLowerCase();

  const map = {
    "in review": "Lamaran Anda sedang ditinjau oleh perekrut.",
    shortlisted: "Selamat! Anda masuk daftar singkat untuk tahap berikutnya.",
    interview: "Anda diundang ke tahap wawancara. Siapkan diri sebaik mungkin.",
    rejected: "Terima kasih atas minat Anda. Sayangnya lamaran belum dilanjutkan kali ini.",
    hired: "Selamat! Anda dipilih untuk posisi ini.",
    applied: "Lamaran Anda telah diterima dan sedang diproses.",
    screening: "Lamaran Anda sedang dalam tahap screening.",
    offered: "Anda menerima tawaran untuk posisi ini. Segera cek detailnya.",
  };

  return (
    map[normalized] ||
    `Status lamaran Anda diperbarui menjadi "${String(status || "").trim()}".`
  );
}

function statusAccent(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["hired", "offered", "shortlisted"].includes(normalized)) return "#059669";
  if (["rejected"].includes(normalized)) return "#dc2626";
  if (["interview", "screening", "in review"].includes(normalized)) return BRAND.primary;
  return BRAND.indigo;
}

/**
 * Application / pipeline status update email.
 * Backward compatible with: { name, jobTitle, status }
 * Extended: { companyName, stageName, note, actionUrl }
 */
module.exports = ({
  name,
  jobTitle,
  status,
  stageName,
  companyName,
  note,
  actionUrl,
}) => {
  const displayStatus = stageName || status || "Updated";
  const message = statusMessage(displayStatus);
  const accent = statusAccent(displayStatus);
  const displayName = escapeHtml(name || "Pelamar");

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${BRAND.text};">
      Update status lamaran
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Halo <strong style="color:${BRAND.text};">${displayName}</strong>,
    </p>
    <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      ${escapeHtml(message)}
    </p>
    <div style="margin:20px 0;padding:14px 16px;border-radius:12px;background:${BRAND.soft};border-left:4px solid ${accent};">
      <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Status saat ini</div>
      <div style="font-size:16px;font-weight:700;color:${accent};">${escapeHtml(displayStatus)}</div>
    </div>
    ${infoCard([
      { label: "Posisi", value: jobTitle },
      { label: "Perusahaan", value: companyName },
      note ? { label: "Catatan", value: note } : null,
    ])}
    ${
      actionUrl
        ? `<div style="text-align:center;margin:28px 0 8px 0;">
            ${primaryButton({ href: actionUrl, label: "Lihat Detail Lamaran" })}
          </div>`
        : ""
    }
    <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
      Tetap pantau aplikasi Cari Kerja untuk update berikutnya. Semoga berhasil!
    </p>
  `;

  return emailLayout({
    title: `Update Lamaran — ${String(jobTitle || "Cari Kerja")}`,
    preheader: `Status lamaran Anda: ${displayStatus}`,
    bodyHtml,
    footerNote: "Notifikasi status lamaran dikirim otomatis oleh Cari Kerja.",
  });
};
