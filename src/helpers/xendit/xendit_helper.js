const axios = require("axios");
const config = require("../../config/global_config");
const logger = require("../utils/logger");

const ctx = "Xendit-Helper";

/**
 * Buat base64 encoded credential untuk Basic Auth Xendit
 * Format: Base64(secret_key + ":")
 */
const getXenditAuthHeader = () => {
  const secretKey = config.get("/xendit/secretKey");
  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY is not configured");
  }
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
};

/**
 * Buat Xendit Invoice
 * @param {Object} payload
 * @param {string} payload.external_id - ID unik dari sisi kita (payment_order.id)
 * @param {number} payload.amount - Nominal dalam Rupiah
 * @param {string} payload.payer_email - Email pembayar
 * @param {string} payload.description - Deskripsi transaksi
 * @returns {Object} Xendit invoice object
 */
const createInvoice = async ({ external_id, amount, payer_email, description }) => {
  try {
    const callbackUrl = config.get("/xendit/callbackUrl");
    const successRedirectUrl = config.get("/xendit/successRedirectUrl");
    const failureRedirectUrl = config.get("/xendit/failureRedirectUrl");

    const payload = {
      external_id,
      amount,
      payer_email,
      description,
      currency: "IDR",
      invoice_duration: 86400, // 24 jam dalam detik
      callback_virtual_account_created: false,
    };

    if (callbackUrl) {
      payload.success_redirect_url = successRedirectUrl || undefined;
      payload.failure_redirect_url = failureRedirectUrl || undefined;
    }

    const response = await axios.post(
      "https://api.xendit.co/v2/invoices",
      payload,
      {
        headers: {
          Authorization: getXenditAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    return { err: null, data: response.data };
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    logger.error(ctx, "createInvoice", "Failed to create Xendit invoice", errorMessage);
    return { err: new Error(errorMessage), data: null };
  }
};

/**
 * Ambil detail invoice Xendit berdasarkan invoice ID
 * @param {string} invoiceId - ID invoice dari Xendit
 * @returns {Object} Xendit invoice object
 */
const getInvoiceById = async (invoiceId) => {
  try {
    const response = await axios.get(
      `https://api.xendit.co/v2/invoices/${invoiceId}`,
      {
        headers: {
          Authorization: getXenditAuthHeader(),
        },
      }
    );

    return { err: null, data: response.data };
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    logger.error(ctx, "getInvoiceById", "Failed to get Xendit invoice", errorMessage);
    return { err: new Error(errorMessage), data: null };
  }
};

/**
 * Verifikasi callback token dari webhook Xendit
 * Xendit mengirim header: x-callback-token
 * @param {string} token - Token dari header request
 * @returns {boolean}
 */
const verifyWebhookToken = (token) => {
  const webhookToken = config.get("/xendit/webhookToken");
  if (!webhookToken) {
    logger.error(ctx, "verifyWebhookToken", "XENDIT_WEBHOOK_TOKEN is not configured", null);
    return false;
  }
  return token === webhookToken;
};

module.exports = {
  createInvoice,
  getInvoiceById,
  verifyWebhookToken,
};
