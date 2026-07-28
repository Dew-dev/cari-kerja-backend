const { v4: uuidv4 } = require("uuid");
const { slugify } = require("../../news/helpers/slugify");

const normalizeName = (input) =>
  String(input || "")
    .trim()
    .replace(/\s+/g, " ");

class JobTitleResolveError extends Error {
  constructor(message, code = "JOB_TITLE_RESOLVE_ERROR") {
    super(message);
    this.name = "JobTitleResolveError";
    this.code = code;
  }
}

const assertCategoryMatch = (row, categoryId) => {
  if (categoryId === undefined || categoryId === null || categoryId === "") {
    return;
  }
  const requested = Number(categoryId);
  if (Number.isNaN(requested)) {
    throw new JobTitleResolveError("Invalid category_id", "INVALID_CATEGORY");
  }
  if (row.category_id === null || row.category_id === undefined) {
    return;
  }
  if (Number(row.category_id) !== requested) {
    throw new JobTitleResolveError(
      "Job title does not belong to the selected category",
      "JOB_TITLE_CATEGORY_MISMATCH"
    );
  }
};

const maybeAssignCategory = async (row, categoryId, db) => {
  if (categoryId === undefined || categoryId === null || categoryId === "") {
    return row;
  }
  if (row.category_id !== null && row.category_id !== undefined) {
    return row;
  }
  const updated = await db.executeQuery(
    `UPDATE job_titles
     SET category_id = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING id, name, slug, category_id`,
    [Number(categoryId), row.id]
  );
  return updated?.rows?.[0] || { ...row, category_id: Number(categoryId) };
};

/**
 * Resolve a job title by id or free-text name (get-or-create on save).
 * New inserts require category_id. Mismatch between existing title category
 * and caller category_id throws JobTitleResolveError.
 *
 * @param {{ id?: string|null, name?: string|null, category_id?: number|null }} input
 * @param {{ executeQuery: Function }} db
 * @returns {Promise<{ id: string, name: string, slug: string, category_id: number|null }|null>}
 */
const resolveJobTitle = async (input = {}, db) => {
  const id = input.id || null;
  const name = normalizeName(input.name);
  const categoryId =
    input.category_id === undefined || input.category_id === null || input.category_id === ""
      ? null
      : Number(input.category_id);

  if (id) {
    const byId = await db.executeQuery(
      `SELECT id, name, slug, category_id
       FROM job_titles
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    const row = byId?.rows?.[0];
    if (!row) {
      // fall through to name-based resolve if provided
    } else {
      assertCategoryMatch(row, categoryId);
      return maybeAssignCategory(row, categoryId, db);
    }
  }

  if (!name) return null;

  const slug = slugify(name, 160);
  const existing = await db.executeQuery(
    `SELECT id, name, slug, category_id
     FROM job_titles
     WHERE slug = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [slug]
  );
  if (existing?.rows?.[0]) {
    const row = existing.rows[0];
    assertCategoryMatch(row, categoryId);
    return maybeAssignCategory(row, categoryId, db);
  }

  if (categoryId === null || Number.isNaN(categoryId)) {
    throw new JobTitleResolveError(
      "category_id is required when creating a new job title",
      "CATEGORY_REQUIRED"
    );
  }

  const inserted = await db.executeQuery(
    `INSERT INTO job_titles (id, name, slug, category_id, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
     ON CONFLICT (slug) DO UPDATE
       SET name = COALESCE(NULLIF(EXCLUDED.name, ''), job_titles.name),
           category_id = COALESCE(job_titles.category_id, EXCLUDED.category_id),
           is_active = TRUE,
           deleted_at = NULL,
           updated_at = NOW()
     RETURNING id, name, slug, category_id`,
    [uuidv4(), name.slice(0, 120), slug, categoryId]
  );

  return inserted?.rows?.[0] || null;
};

module.exports = {
  normalizeName,
  resolveJobTitle,
  slugify,
  JobTitleResolveError,
};
