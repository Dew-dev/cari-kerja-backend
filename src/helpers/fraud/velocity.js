const wrapper = require("../utils/wrapper");
const logger = require("../utils/logger");
const { TooManyRequestsError } = require("../errors");

const ctx = "Fraud-Velocity";

/** Batas velocity default (domain layer). */
const LIMITS = {
  applyPerHour: 20,
  chatPerHour: 60,
  invoiceCreatePerHour: 10,
  maxPendingInvoices: 3,
};

/**
 * Hitung baris dalam window waktu, gagal-tutup jika query error.
 * @param {{ executeQuery: Function }} db
 * @param {{ sql: string, values: any[], max: number, message: string }} opts
 */
const assertCountUnderLimit = async (db, { sql, values, max, message }) => {
  try {
    const result = await db.executeQuery(sql, values);
    const count = Number(result?.rows?.[0]?.count ?? 0);
    if (count >= max) {
      return wrapper.error(
        new TooManyRequestsError(message, { retry_after_seconds: 3600 })
      );
    }
    return wrapper.data({ count, max });
  } catch (err) {
    logger.error(ctx, "assertCountUnderLimit", "velocity query failed", err);
    return wrapper.error(
      new TooManyRequestsError(
        "RATE_LIMITED: Unable to verify request rate. Please try again later.",
        { retry_after_seconds: 60 }
      )
    );
  }
};

const assertApplyVelocity = async (db, workerId) =>
  assertCountUnderLimit(db, {
    sql: `
      SELECT COUNT(*)::int AS count
      FROM job_applications
      WHERE worker_id = $1
        AND applied_at >= NOW() - INTERVAL '1 hour'
    `,
    values: [workerId],
    max: LIMITS.applyPerHour,
    message: `RATE_LIMITED: Too many applications. Limit is ${LIMITS.applyPerHour} per hour.`,
  });

const assertChatVelocity = async (db, senderId) =>
  assertCountUnderLimit(db, {
    sql: `
      SELECT COUNT(*)::int AS count
      FROM messages
      WHERE sender_id = $1
        AND created_at >= NOW() - INTERVAL '1 hour'
    `,
    values: [senderId],
    max: LIMITS.chatPerHour,
    message: `RATE_LIMITED: Too many messages. Limit is ${LIMITS.chatPerHour} per hour.`,
  });

const assertInvoiceCreateVelocity = async (db, recruiterId) =>
  assertCountUnderLimit(db, {
    sql: `
      SELECT COUNT(*)::int AS count
      FROM payment_orders
      WHERE recruiter_id = $1
        AND created_at >= NOW() - INTERVAL '1 hour'
    `,
    values: [recruiterId],
    max: LIMITS.invoiceCreatePerHour,
    message: `RATE_LIMITED: Too many invoice requests. Limit is ${LIMITS.invoiceCreatePerHour} per hour.`,
  });

const assertPendingInvoiceCap = async (db, recruiterId) =>
  assertCountUnderLimit(db, {
    sql: `
      SELECT COUNT(*)::int AS count
      FROM payment_orders
      WHERE recruiter_id = $1
        AND status = 'pending'
        AND (invoice_expires_at IS NULL OR invoice_expires_at > NOW())
    `,
    values: [recruiterId],
    max: LIMITS.maxPendingInvoices,
    message: `RATE_LIMITED: Too many pending invoices. Limit is ${LIMITS.maxPendingInvoices}. Pay or wait for expiry.`,
  });

module.exports = {
  LIMITS,
  assertApplyVelocity,
  assertChatVelocity,
  assertInvoiceCreateVelocity,
  assertPendingInvoiceCap,
};
