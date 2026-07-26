const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Company / bulk recruiter message.
 */
const renderBulkCommunicationTelegram = (data = {}) => {
  const subject = escapeHtml(data.subject || "Pesan dari perusahaan");
  const body = escapeHtml(data.body || "").slice(0, 3500);
  const company = data.companyName ? escapeHtml(data.companyName) : null;
  const lines = [
    `<b>${subject}</b>`,
    company ? `Dari: ${company}` : null,
    "",
    body,
  ].filter(Boolean);

  if (data.actionUrl) {
    lines.push("", `<a href="${escapeHtml(data.actionUrl)}">Buka di Cari Kerja</a>`);
  }

  return { text: lines.join("\n"), parseMode: "HTML" };
};

module.exports = {
  renderBulkCommunicationTelegram,
  renderCompanyMessageTelegram: renderBulkCommunicationTelegram,
};
