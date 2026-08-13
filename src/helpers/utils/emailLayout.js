const BRAND = {
  name: "Cari Kerja",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  indigo: "#4f46e5",
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  soft: "#eff6ff",
};

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shared Cari Kerja email shell (table-based for email clients).
 */
function emailLayout({
  title,
  preheader = "",
  bodyHtml,
  footerNote = "Email ini dikirim otomatis oleh Cari Kerja.",
}) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const safeFooter = escapeHtml(footerNote);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.indigo} 100%);padding:28px 32px;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.2px;color:#ffffff;">${BRAND.name}</div>
              <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.9);">Temukan peluang kerja yang tepat</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <div style="border-top:1px solid ${BRAND.border};padding-top:18px;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
                ${safeFooter}<br/>
                © ${new Date().getFullYear()} ${BRAND.name}. Semua hak dilindungi.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function primaryButton({ href, label }) {
  return `<a href="${escapeHtml(href)}"
    style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;box-shadow:0 8px 16px rgba(37,99,235,0.25);">
    ${escapeHtml(label)}
  </a>`;
}

function infoCard(rows = []) {
  const content = rows
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "")
    .map(
      (row) => `<tr>
        <td style="padding:8px 0;font-size:13px;color:${BRAND.muted};width:120px;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;font-size:14px;color:${BRAND.text};font-weight:600;vertical-align:top;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  if (!content) return "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${BRAND.soft};border:1px solid #dbeafe;border-radius:12px;padding:4px 16px;">
    ${content}
  </table>`;
}

module.exports = {
  BRAND,
  escapeHtml,
  emailLayout,
  primaryButton,
  infoCard,
};
