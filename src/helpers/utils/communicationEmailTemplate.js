const config = require("../../config/global_config");
const { emailLayout, escapeHtml, BRAND } = require("./emailLayout");

function buildUnsubscribeUrl(token) {
  const base =
    config.get("/frontendUrl") || process.env.FE_URL || "http://localhost:5173";
  return `${base.replace(/\/$/, "")}/unsubscribe?token=${token}`;
}

/**
 * Wrap recruiter message body with Cari Kerja shell + optional unsubscribe footer.
 */
module.exports = ({ bodyHtml, unsubscribeUrl, subjectTitle }) => {
  const footer = unsubscribeUrl
    ? `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />
       <p style="font-size:12px;color:${BRAND.muted};line-height:1.6;">
         Anda menerima email ini karena melamar posisi di platform kami.
         <a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND.muted};">Berhenti berlangganan email rekrutmen</a>
       </p>`
    : "";

  const inner = `
    <div style="font-size:15px;line-height:1.7;color:${BRAND.text};">
      ${bodyHtml}
    </div>
    ${footer}
  `;

  return emailLayout({
    title: subjectTitle || "Pesan dari Perekrut — Cari Kerja",
    preheader: "Anda menerima pesan terkait lamaran di Cari Kerja.",
    bodyHtml: inner,
    footerNote: "Komunikasi rekrutmen dikirim melalui Cari Kerja.",
  });
};

module.exports.buildUnsubscribeUrl = buildUnsubscribeUrl;
