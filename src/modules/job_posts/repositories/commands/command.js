const collection = "job_posts"
const collections = "job_posts_questions"

class Command {
    constructor(db) {
        this.db = db;
    }

    async insertOne(document) {
        return this.db.insertOne(document, collection);
    }
    
    async insertMany(document, table){
        return this.db.insertMany(document, table);
    }

    async updateOneNew(parameter,document,table){
        return this.db.updateOneNew(parameter,document,table);
    }

    async deleteOne(parameter) {
        return this.db.deleteOne(parameter, collection);
    }
}

module.exports = Command;