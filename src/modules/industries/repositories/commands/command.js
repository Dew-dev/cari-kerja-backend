const collection = "industries"; // nama table
class Command {
  constructor(db) {
    this.db = db;
  }

  // document: data kolom apa saja yang mau dimasukin
  async insertOne(document) {
    return this.db.insertOne(document, collection);
  }

  async updateOneNew(parameter, document) {
    return this.db.updateOneNew(parameter, document, collection);
  }

  async deleteOne(parameter) {
    return this.db.deleteOne(parameter, collection);
  }
}

module.exports = Command;
