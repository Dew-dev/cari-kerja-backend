const PaymentQueryDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new PaymentQueryDomain(db);

const getAllPlans = async (payload) => {
  return domain.getAllPlans(payload);
};

const getPaymentOrders = async (payload) => {
  return domain.getPaymentOrders(payload);
};

const getOrderDetail = async (payload) => {
  return domain.getOrderDetail(payload);
};

const getActivePlan = async (payload) => {
  return domain.getActivePlan(payload);
};

module.exports = {
  getAllPlans,
  getPaymentOrders,
  getOrderDetail,
  getActivePlan,
};
