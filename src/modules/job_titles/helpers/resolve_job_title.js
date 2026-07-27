const { v4: uuidv4 } = require("uuid");
const { slugify } = require("../../news/helpers/slugify");

const normalizeName = (input) =>
  String(input || "")
    .trim()
    .replace(/\s+/g, " ");

/**
 * Resolve a job title by id or free-text name (get-or-create on save).
 * @param {{ id?: string|null, name?: string|null }} input
 * @param {{ executeQuery: Function }} db
 * @returns {Promise<{ id: string, name: string, slug: string }|null>}
 */
const resolveJobTitle = async (input = {}, db) => {
  const id = input.id || null;
  const name = normalizeName(input.name);

  if (id) {
    const byId = await db.executeQuery(
      `SELECT id, name, slug
       FROM job_titles
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    if (byId?.rows?.[0]) return byId.rows[0];
  }

  if (!name) return null;

  const slug = slugify(name, 160);
  const existing = await db.executeQuery(
    `SELECT id, name, slug
     FROM job_titles
     WHERE slug = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [slug]
  );
  if (existing?.rows?.[0]) return existing.rows[0];

  const inserted = await db.executeQuery(
    `INSERT INTO job_titles (id, name, slug, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, NOW(), NOW())
     ON CONFLICT (slug) DO UPDATE
       SET name = COALESCE(NULLIF(EXCLUDED.name, ''), job_titles.name),
           is_active = TRUE,
           deleted_at = NULL,
           updated_at = NOW()
     RETURNING id, name, slug`,
    [uuidv4(), name.slice(0, 120), slug]
  );

  return inserted?.rows?.[0] || null;
};

module.exports = {
  normalizeName,
  resolveJobTitle,
  slugify,
};
