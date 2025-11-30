const collection = "saved_jobs"

class Command {
    constructor(db) {
        this.db = db;
    }

    async insertOne(document,table = collection) {
        return this.db.insertOne(document, table);
    }

    async insertMany(document, table = collection) {
        return this.db.insertMany(document, table);
    }

    async updateOneNew(parameter, document, table = collection) {
        return this.db.updateOneNew(parameter, document, table);
    }

    async deleteOne(parameter, table = collection) {
        return this.db.deleteOne(parameter, table);
    }
}

module.exports = Command;