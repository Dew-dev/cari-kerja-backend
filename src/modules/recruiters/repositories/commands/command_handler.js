const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const updateOneRecruiter = async (payload) => {
    return domain.updateOneRecruiter(payload);
};

const updateRecruiterVip = async (payload) => {
    return domain.updateRecruiterVip(payload);
};

module.exports = {
    updateOneRecruiter,
    updateRecruiterVip,
}