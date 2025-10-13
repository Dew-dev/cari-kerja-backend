const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createJobPost = async(payload) => {
    return domain.createJobPost(payload);
};

module.exports = {
    createJobPost,
};