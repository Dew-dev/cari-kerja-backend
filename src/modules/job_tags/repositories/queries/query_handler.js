const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getOneTagByName = async (payload) => {
    return domain.getOneTagByName(payload);
}

const getTagsPerJobPost = async (payload) => {
    return domain.getTagsPerJobPost(payload);
}

const getOneJobPostTagByTagIdAndJobPostId = async (payload) => {
    return domain.getOneJobPostTagByTagIdAndJobPostId(payload);
}


module.exports = {
    getTagsPerJobPost,
    getOneTagByName,
    getOneJobPostTagByTagIdAndJobPostId,
}