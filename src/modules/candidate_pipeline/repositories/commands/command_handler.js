const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createStage = async (payload) => domain.createStage(payload);
const updateStage = async (payload) => domain.updateStage(payload);
const reorderStages = async (payload) => domain.reorderStages(payload);
const deleteStage = async (payload) => domain.deleteStage(payload);

module.exports = {
  createStage,
  updateStage,
  reorderStages,
  deleteStage,
};
