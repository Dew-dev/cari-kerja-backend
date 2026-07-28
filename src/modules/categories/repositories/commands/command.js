const collection = "categories";

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne() {
    const result = await this.db.executeQuery(
      `INSERT INTO categories DEFAULT VALUES RETURNING id, created_at`
    );
    const row = result?.rows?.[0];
    if (!row) return { err: new Error("Failed to insert category"), data: null };
    return { err: null, data: row };
  }

  async deleteOne(parameter) {
    return this.db.deleteOne(parameter, collection);
  }

  async upsertTranslation({ category_id, locale, name }) {
    const result = await this.db.executeQuery(
      `
      INSERT INTO category_translations (category_id, locale, name, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (category_id, locale) DO UPDATE
        SET name = EXCLUDED.name,
            updated_at = NOW()
      RETURNING category_id, locale, name, created_at, updated_at
      `,
      [category_id, locale, name]
    );
    return result?.rows?.[0] || null;
  }
}

module.exports = Command;
