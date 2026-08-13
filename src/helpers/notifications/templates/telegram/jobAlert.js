const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * @param {{ name?: string, jobs?: Array<{ title: string, company?: string, url?: string }>, actionUrl?: string }} data
 */
const renderJobAlertTelegram = (data = {}) => {
  const name = escapeHtml(data.name || "Job seeker");
  const jobs = Array.isArray(data.jobs) ? data.jobs.slice(0, 10) : [];
  const lines = [
    `<b>Job Alert harian</b>`,
    `Halo ${name}, ada lowongan yang cocok untukmu:`,
    "",
  ];

  jobs.forEach((job, idx) => {
    const title = escapeHtml(job.title || "Lowongan");
    const company = job.company ? ` — ${escapeHtml(job.company)}` : "";
    if (job.url) {
      lines.push(`${idx + 1}. <a href="${escapeHtml(job.url)}">${title}</a>${company}`);
    } else {
      lines.push(`${idx + 1}. ${title}${company}`);
    }
  });

  if (data.actionUrl) {
    lines.push("", `<a href="${escapeHtml(data.actionUrl)}">Lihat semua lowongan</a>`);
  }

  return { text: lines.join("\n"), parseMode: "HTML" };
};

module.exports = { renderJobAlertTelegram };
