const collection = "worker_skills"; // nama tabel di database

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne(document) {
    return this.db.insertOne(document, collection);
  }

  async deleteOne(parameter) {
    return this.db.deleteOne(parameter, collection);
  }
}

module.exports = Command;
