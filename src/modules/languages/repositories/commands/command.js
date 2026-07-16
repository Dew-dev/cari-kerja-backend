const collection = "worker_languages"; // nama tabel di database

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne(document) {
    return this.db.insertOne(document, collection);
  }

  // Upsert nama bahasa ke master lookup `languages`, kembalikan id-nya
  async upsertMasterLanguage(languageName) {
    const query = `
      WITH ins AS (
        INSERT INTO languages (name)
        VALUES (INITCAP(TRIM($1)))
        ON CONFLICT (name) DO NOTHING
        RETURNING id
      )
      SELECT id FROM ins
      UNION
      SELECT id FROM languages WHERE name = INITCAP(TRIM($1));
    `;
    return this.db.executeQuery(query, [languageName]);
  }

  async updateOneNew(parameter, document) {
    return this.db.updateOneNew(parameter, document, collection);
  }

  async deleteOne(parameter) {
    return this.db.deleteOne(parameter, collection);
  }
}

module.exports = Command;
