const config = require("../../config/global_config");

function buildUnsubscribeUrl(token) {
  const base = config.get("/frontendUrl") || process.env.FE_URL || "http://localhost:5173";
  return `${base.replace(/\/$/, "")}/unsubscribe?token=${token}`;
}

/**
 * Wrap recruiter message body with optional unsubscribe footer (GDPR).
 */
module.exports = ({ bodyHtml, unsubscribeUrl }) => {
  const footer = unsubscribeUrl
    ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
       <p style="font-size:12px;color:#6b7280;">
         Anda menerima email ini karena melamar posisi di platform kami.
         <a href="${unsubscribeUrl}" style="color:#6b7280;">Berhenti berlangganan email rekrutmen</a>
       </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
  <div>${bodyHtml}</div>
  ${footer}
</body>
</html>`;
};

module.exports.buildUnsubscribeUrl = buildUnsubscribeUrl;
