const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");



const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);
const getJobpostsByRecruiterId = async (payload) => {
    return domain.getJobpostsByRecruiterId(payload);
};

const getJobpostById = async(payload) => {
    return domain.getJobpostById(payload);
}

module.exports = {
    getJobpostsByRecruiterId,
    getJobpostById
}