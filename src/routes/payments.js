const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const paymentsHandler = require("../modules/payments/handlers/api_handler");

// Payment mutations / private reads are recruiter-owned.
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)

function verifyRecruiterRole(req, res, next) {
  return verifyRole(recruiterRoles)(req, res, next);
}

module.exports = (server) => {
  // PUBLIC — daftar paket
  server.get("/api/v1/payments/plans", paymentsHandler.getAllPlans);

  // WEBHOOK Xendit — tanpa JWT (verifikasi x-callback-token)
  server.post("/api/v1/payments/webhook/xendit", paymentsHandler.handleXenditWebhook);

  // PRIVATE — recruiter / super_admin
  server.post(
    "/api/v1/payments/create-invoice",
    verifyToken,
    verifyRecruiterRole,
    paymentsHandler.createInvoice
  );

  server.get(
    "/api/v1/payments/orders",
    verifyToken,
    verifyRecruiterRole,
    paymentsHandler.getPaymentOrders
  );

  server.get(
    "/api/v1/payments/orders/:id",
    verifyToken,
    verifyRecruiterRole,
    paymentsHandler.getOrderDetail
  );

  server.get(
    "/api/v1/payments/active-plan",
    verifyToken,
    verifyRecruiterRole,
    paymentsHandler.getActivePlan
  );

  server.post(
    "/api/v1/payments/single-post/apply",
    verifyToken,
    verifyRecruiterRole,
    paymentsHandler.applySinglePostToJob
  );
};
