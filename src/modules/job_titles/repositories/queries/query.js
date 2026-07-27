class Query {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    const result = await this.db.executeQuery(
      `SELECT id, name, slug, is_active, created_at, updated_at
       FROM job_titles
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async findAll({ page = 1, limit = 20, search = "" }) {
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    const searchQuery = search ? `%${search}%` : "%";
    const result = await this.db.executeQuery(
      `SELECT id, name, slug
       FROM job_titles
       WHERE deleted_at IS NULL
         AND is_active IS TRUE
         AND (name ILIKE $1 OR slug ILIKE $1)
       ORDER BY name ASC
       LIMIT $2 OFFSET $3`,
      [searchQuery, Number(limit), offset]
    );
    return result?.rows || [];
  }

  async countAll(search = "") {
    const searchQuery = search ? `%${search}%` : "%";
    const result = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total
       FROM job_titles
       WHERE deleted_at IS NULL
         AND is_active IS TRUE
         AND (name ILIKE $1 OR slug ILIKE $1)`,
      [searchQuery]
    );
    return result?.rows?.[0]?.total || 0;
  }
}

module.exports = Query;
