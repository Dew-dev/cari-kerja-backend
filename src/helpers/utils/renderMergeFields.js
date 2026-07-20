/**
 * Replace merge-field placeholders in subject/body.
 * Supported: {{candidate_name}}, {{name}}, {{job_title}}, {{company_name}}, {{stage_name}}
 */
function renderMergeFields(text, fields = {}) {
  if (!text || typeof text !== "string") return text;

  const map = {
    candidate_name: fields.candidate_name ?? fields.name ?? "",
    name: fields.name ?? fields.candidate_name ?? "",
    job_title: fields.job_title ?? "",
    company_name: fields.company_name ?? "",
    stage_name: fields.stage_name ?? "",
  };

  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return String(map[key]);
    }
    return "";
  });
}

module.exports = { renderMergeFields };
