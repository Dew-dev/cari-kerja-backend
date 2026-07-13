const verifyToken = require("../middlewares/verifyToken");
const paymentsHandler = require("../modules/payments/handlers/api_handler");

module.exports = (server) => {
  // ----------------------------
  // PUBLIC — Daftar semua paket (tidak perlu login)
  // ----------------------------
  server.get("/api/v1/payments/plans", paymentsHandler.getAllPlans);

  // ----------------------------
  // WEBHOOK Xendit — tanpa auth JWT (verifikasi via x-callback-token)
  // Harus didaftarkan SEBELUM route yang memerlukan verifyToken
  // ----------------------------
  server.post("/api/v1/payments/webhook/xendit", paymentsHandler.handleXenditWebhook);

  // ----------------------------
  // PRIVATE — Perlu login sebagai recruiter
  // ----------------------------

  // Buat invoice pembayaran (subscription, satuan, atau boost)
  server.post("/api/v1/payments/create-invoice", verifyToken, paymentsHandler.createInvoice);

  // Riwayat transaksi recruiter
  server.get("/api/v1/payments/orders", verifyToken, paymentsHandler.getPaymentOrders);

  // Detail satu transaksi
  server.get("/api/v1/payments/orders/:id", verifyToken, paymentsHandler.getOrderDetail);

  // Cek paket aktif recruiter saat ini
  server.get("/api/v1/payments/active-plan", verifyToken, paymentsHandler.getActivePlan);

  // Terapkan slot satuan job post ke job post tertentu
  server.post("/api/v1/payments/single-post/apply", verifyToken, paymentsHandler.applySinglePostToJob);
};
