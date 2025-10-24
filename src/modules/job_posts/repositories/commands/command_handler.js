const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createJobPost = async(payload) => {
    return domain.createJobPost(payload);
};

const createJobPostQuestions = async(payload, id) => {
    return domain.createJobPostQuestions(payload,id);
};

const updateJobPostQuestion = async(payload, id) => {
    return domain.updateJobPostQuestion(payload,id);
};

module.exports = {
    createJobPost,
    createJobPostQuestions,
    updateJobPostQuestion, 
};