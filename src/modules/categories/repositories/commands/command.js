const collection = "categories";

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne(document) {
    return this.db.insertOne(document, collection);
  }

  async updateOneNew(parameter, document) {
    return this.db.updateOneNew(parameter, document, collection);
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
