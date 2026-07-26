const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderInterviewInvitationTelegram = (data = {}) => {
  const name = escapeHtml(data.name || "Kandidat");
  const jobTitle = escapeHtml(data.jobTitle || "Lowongan");
  const company = data.companyName ? escapeHtml(data.companyName) : "perusahaan";

  const lines = [
    `<b>Undangan wawancara</b>`,
    `Halo ${name},`,
    "",
    `Kamu diundang wawancara untuk posisi <b>${jobTitle}</b> di ${company}.`,
  ];

  if (data.actionUrl) {
    lines.push("", `<a href="${escapeHtml(data.actionUrl)}">Lihat detail & jadwal</a>`);
  }

  return { text: lines.join("\n"), parseMode: "HTML" };
};

module.exports = { renderInterviewInvitationTelegram };
