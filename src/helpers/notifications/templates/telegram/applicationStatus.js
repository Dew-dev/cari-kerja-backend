const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderApplicationStatusTelegram = (data = {}) => {
  const name = escapeHtml(data.name || "Kandidat");
  const jobTitle = escapeHtml(data.jobTitle || "Lowongan");
  const status = escapeHtml(data.stageName || data.status || "diperbarui");
  const company = data.companyName ? escapeHtml(data.companyName) : null;

  const lines = [
    `<b>Update lamaran</b>`,
    `Halo ${name},`,
    "",
    `Status lamaranmu untuk <b>${jobTitle}</b>${company ? ` di ${company}` : ""} sekarang: <b>${status}</b>.`,
  ];

  if (data.actionUrl) {
    lines.push("", `<a href="${escapeHtml(data.actionUrl)}">Lihat detail lamaran</a>`);
  }

  return { text: lines.join("\n"), parseMode: "HTML" };
};

module.exports = { renderApplicationStatusTelegram };
