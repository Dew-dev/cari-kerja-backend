/**
 * Slugify title/name for news URLs.
 * Keeps a-z, 0-9, hyphens; collapses repeats; max length 200.
 */
const slugify = (input, maxLen = 200) => {
  const base = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!base) return "item";
  return base.slice(0, maxLen).replace(/-+$/g, "") || "item";
};

module.exports = { slugify };
