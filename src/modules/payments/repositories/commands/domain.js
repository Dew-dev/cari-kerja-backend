const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
  ForbiddenError,
} = require("../../../../helpers/errors");
const xenditHelper = require("../../../../helpers/xendit/xendit_helper");
const {
  assertInvoiceCreateVelocity,
  assertPendingInvoiceCap,
} = require("../../../../helpers/fraud/velocity");
const {
  assertRecruiterVerifiedForPublish,
} = require("../../../../helpers/fraud/employer_verification");
const {
  flagPaymentSessionAnomaly,
} = require("../../../../helpers/fraud/session_anomaly");
const { ACTIONS } = require("../../../../helpers/audit/actions");
const { claimWebhookDelivery } = require("../../../../helpers/fraud/webhook_replay");

const ctx = "Payments-Command-Domain";

const FAILED_WEBHOOK_STATUSES = new Set([
  "FAILED",
  "PAYMENT_FAILED",
  "FAILURE",
]);

class PaymentCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  /**
   * Buat invoice pembayaran dan simpan order
   * Mendukung 3 tipe order: subscription, single_post, boost
   */
  async createInvoice({
    recruiter_id,
    user_email,
    user_id,
    order_type,
    plan_id,
    job_post_id,
    ip_address,
    user_agent,
  }) {
    try {
      const pendingCap = await assertPendingInvoiceCap(this.command.db, recruiter_id);
      if (pendingCap.err) {
        return pendingCap;
      }

      const createVelocity = await assertInvoiceCreateVelocity(
        this.command.db,
        recruiter_id
      );
      if (createVelocity.err) {
        return createVelocity;
      }

      let plan = null;
      let planType = null;
      let amount = 0;
      let description = "";

      if (order_type === "subscription") {
        const result = await this.query.getSubscriptionPlanById(plan_id);
        if (!result?.rows?.length) {
          return wrapper.error(new NotFoundError("Subscription plan not found"));
        }
        plan = result.rows[0];
        planType = "subscription_plans";
        amount = plan.price_idr;
        description = `Pembayaran ${plan.display_name} - ${plan.duration_days} hari`;

        if (amount === 0) {
          return wrapper.error(
            new BadRequestError("Paket Free tidak memerlukan pembayaran")
          );
        }
      } else if (order_type === "single_post") {
        const result = await this.query.getSinglePostPlanById(plan_id);
        if (!result?.rows?.length) {
          return wrapper.error(new NotFoundError("Single post plan not found"));
        }
        plan = result.rows[0];
        planType = "single_post_plans";
        amount = plan.price_idr;
        description = `Pembelian ${plan.display_name}`;
      } else if (order_type === "boost") {
        if (!job_post_id) {
          return wrapper.error(
            new BadRequestError("job_post_id wajib untuk order tipe boost")
          );
        }

        const verified = await assertRecruiterVerifiedForPublish(
          this.command.db,
          recruiter_id
        );
        if (verified.err) {
          return verified;
        }

        const jobPostResult = await this.query.getJobPostOwner(job_post_id);
        if (!jobPostResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Job post not found"));
        }
        if (jobPostResult.rows[0].recruiter_id !== recruiter_id) {
          return wrapper.error(
            new ForbiddenError("Job post ini bukan milik Anda")
          );
        }

        const result = await this.query.getBoostPlanById(plan_id);
        if (!result?.rows?.length) {
          return wrapper.error(new NotFoundError("Boost plan not found"));
        }
        plan = result.rows[0];
        planType = "boost_plans";
        amount = plan.price_idr;
        description = `Boost ${plan.display_name} untuk job post`;
      }

      const orderId = uuidv4();
      const externalId = `CK-${order_type.toUpperCase()}-${orderId}`;

      const xenditResult = await xenditHelper.createInvoice({
        external_id: externalId,
        amount,
        payer_email: user_email,
        description,
      });

      if (xenditResult.err) {
        logger.error(ctx, "createInvoice", "Xendit invoice creation failed", xenditResult.err);
        return wrapper.error(
          new InternalServerError("Gagal membuat invoice pembayaran")
        );
      }

      const xenditInvoice = xenditResult.data;
      const invoiceExpiresAt = xenditInvoice.expiry_date
        ? new Date(xenditInvoice.expiry_date)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const metadata = {
        plan_name: plan.name,
        plan_display_name: plan.display_name,
        xendit_invoice_url: xenditInvoice.invoice_url,
        request_ip: ip_address || null,
        request_user_agent: user_agent || null,
      };

      const insertResult = await this.command.insertPaymentOrder({
        id: orderId,
        recruiter_id,
        order_type,
        plan_id,
        plan_type: planType,
        job_post_id: job_post_id || null,
        xendit_invoice_id: xenditInvoice.id,
        xendit_external_id: externalId,
        amount,
        status: "pending",
        invoice_expires_at: invoiceExpiresAt,
        metadata,
      });

      if (!insertResult?.rows?.length) {
        logger.error(ctx, "createInvoice", "Payment order insert returned empty", {
          orderId,
          xenditInvoiceId: xenditInvoice.id,
        });
        return wrapper.error(
          new InternalServerError("Gagal menyimpan payment order")
        );
      }

      // Soft-signal only — never block payment on session anomaly
      const anomaly = await flagPaymentSessionAnomaly(this.command.db, {
        userId: user_id,
        recruiterId: recruiter_id,
        orderId,
        ip_address,
        user_agent,
        order_type,
      });
      if (anomaly?.data?.flagged) {
        metadata.session_anomaly = {
          risk_score: anomaly.data.risk_score,
          flags: anomaly.data.flags,
        };
        try {
          await this.command.db.executeQuery(
            `UPDATE payment_orders SET metadata = $2::jsonb, updated_at = NOW() WHERE id = $1`,
            [orderId, JSON.stringify(metadata)]
          );
          if (user_id) {
            await this.command.db.executeQuery(
              `INSERT INTO audit_logs (user_id, action, ip_address, user_agent)
               VALUES ($1, $2, $3, $4)`,
              [
                user_id,
                ACTIONS.PAYMENT_SESSION_ANOMALY,
                ip_address || null,
                user_agent || null,
              ]
            );
          }
        } catch (metaErr) {
          logger.error(ctx, "createInvoice", "Failed to persist session anomaly metadata", metaErr);
        }
      }

      return wrapper.data({
        order_id: orderId,
        xendit_invoice_id: xenditInvoice.id,
        xendit_external_id: externalId,
        payment_url: xenditInvoice.invoice_url,
        amount,
        description,
        status: "pending",
        expires_at: invoiceExpiresAt,
      });
    } catch (err) {
      logger.error(ctx, "createInvoice", "Unexpected error", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  /**
   * Handle webhook Xendit — PAID / EXPIRED / FAILED / PENDING
   */
  async handleXenditWebhook(webhookPayload) {
    try {
      const {
        id: xenditInvoiceId,
        external_id,
        status,
        paid_at,
        paid_amount,
      } = webhookPayload;

      const logId = uuidv4();
      const orderResult = await this.query.getOrderByExternalId(external_id);

      await this.command.insertPaymentLog({
        id: logId,
        payment_order_id: orderResult?.rows?.[0]?.id || null,
        xendit_external_id: external_id,
        event_type: `invoice.${status?.toLowerCase() || "unknown"}`,
        payload: webhookPayload,
      });

      if (!orderResult?.rows?.length) {
        logger.error(ctx, "handleXenditWebhook", "Order not found for external_id", external_id);
        return wrapper.error(new NotFoundError("Order not found"));
      }

      const order = orderResult.rows[0];
      const normalizedStatus = String(status || "").toUpperCase();

      // Soft replay guard: same external_id+status within TTL is ignored
      const claim = await claimWebhookDelivery(external_id, normalizedStatus);
      if (!claim.claimed) {
        return wrapper.data({
          order_id: order.id,
          status: order.status,
          message: "Duplicate webhook delivery ignored",
        });
      }

      const terminalStatuses = new Set(["paid", "expired", "failed"]);

      // PENDING — keep order pending; do not mark failed
      if (normalizedStatus === "PENDING") {
        return wrapper.data({ order_id: order.id, status: "pending" });
      }

      // EXPIRED — mark order expired (jangan downgrade paid)
      if (normalizedStatus === "EXPIRED") {
        if (order.status === "paid") {
          return wrapper.data({
            order_id: order.id,
            status: "paid",
            message: "Already paid; ignoring expired webhook",
          });
        }
        if (terminalStatuses.has(order.status)) {
          return wrapper.data({
            order_id: order.id,
            status: order.status,
            message: "Already in terminal status",
          });
        }
        await this.command.updateOrderStatus({
          id: order.id,
          status: "expired",
          paid_at: null,
          xendit_invoice_id: xenditInvoiceId,
          expected_current_status: "pending",
        });
        return wrapper.data({ order_id: order.id, status: "expired" });
      }

      // FAILED / payment failure — mark order failed
      if (FAILED_WEBHOOK_STATUSES.has(normalizedStatus)) {
        if (order.status === "paid") {
          return wrapper.data({
            order_id: order.id,
            status: "paid",
            message: "Already paid; ignoring failed webhook",
          });
        }
        if (terminalStatuses.has(order.status)) {
          return wrapper.data({
            order_id: order.id,
            status: order.status,
            message: "Already in terminal status",
          });
        }
        await this.command.updateOrderStatus({
          id: order.id,
          status: "failed",
          paid_at: null,
          xendit_invoice_id: xenditInvoiceId,
          expected_current_status: "pending",
        });
        return wrapper.data({ order_id: order.id, status: "failed" });
      }

      // Only PAID (and SETTLED as paid confirmation) activate plans
      if (normalizedStatus !== "PAID" && normalizedStatus !== "SETTLED") {
        logger.error(ctx, "handleXenditWebhook", "Unhandled webhook status", normalizedStatus);
        return wrapper.data({
          order_id: order.id,
          status: order.status,
          message: `Unhandled status: ${normalizedStatus}`,
        });
      }

      // Tolak aktivasi jika order sudah terminal non-paid (expired/failed)
      if (order.status === "expired" || order.status === "failed") {
        return wrapper.error(
          new BadRequestError("Cannot mark paid: order already in terminal status")
        );
      }

      // Cross-check Xendit invoice id against stored order
      if (
        order.xendit_invoice_id &&
        xenditInvoiceId &&
        order.xendit_invoice_id !== xenditInvoiceId
      ) {
        return wrapper.error(
          new BadRequestError("Webhook invoice id does not match stored order")
        );
      }

      // Validate paid amount covers order amount
      if (
        paid_amount !== undefined &&
        paid_amount !== null &&
        Number(paid_amount) < Number(order.amount)
      ) {
        return wrapper.error(
          new BadRequestError("Paid amount is less than order amount")
        );
      }

      if (order.status === "paid") {
        return wrapper.data({
          order_id: order.id,
          status: "paid",
          message: "Already processed",
        });
      }

      // Atomic pending → paid transition (prevents double activation)
      const updateResult = await this.command.updateOrderStatus({
        id: order.id,
        status: "paid",
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        xendit_invoice_id: xenditInvoiceId,
        expected_current_status: "pending",
      });

      if (!updateResult?.rows?.length) {
        return wrapper.data({
          order_id: order.id,
          status: "paid",
          message: "Already processed",
        });
      }

      const activationResult = await this._activatePlan(order);
      if (activationResult.err) {
        logger.error(ctx, "handleXenditWebhook", "Plan activation failed", activationResult.err);
      }

      return wrapper.data({
        order_id: order.id,
        status: "paid",
        activated: !activationResult.err,
      });
    } catch (err) {
      logger.error(ctx, "handleXenditWebhook", "Unexpected error", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  async _activatePlan(order) {
    try {
      const { recruiter_id, order_type, plan_id, job_post_id, id: payment_order_id } = order;
      const now = new Date();

      if (order_type === "subscription") {
        const planResult = await this.query.getSubscriptionPlanById(plan_id);
        if (!planResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Subscription plan not found"));
        }
        const plan = planResult.rows[0];
        const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

        await this.command.deactivateOldSubscriptions(recruiter_id);
        await this.command.insertRecruiterSubscription({
          id: uuidv4(),
          recruiter_id,
          plan_id,
          payment_order_id,
          starts_at: now,
          expires_at: expiresAt,
        });
      } else if (order_type === "single_post") {
        const planResult = await this.query.getSinglePostPlanById(plan_id);
        if (!planResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Single post plan not found"));
        }
        const plan = planResult.rows[0];
        const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

        await this.command.insertRecruiterSinglePost({
          id: uuidv4(),
          recruiter_id,
          plan_id,
          payment_order_id,
          expires_at: expiresAt,
        });
      } else if (order_type === "boost") {
        const planResult = await this.query.getBoostPlanById(plan_id);
        if (!planResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Boost plan not found"));
        }
        const plan = planResult.rows[0];
        const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
        const boostType = plan.boost_priority === 1 ? "hot" : "top10";

        await this.command.insertJobPostBoost({
          id: uuidv4(),
          job_post_id,
          recruiter_id,
          boost_plan_id: plan_id,
          payment_order_id,
          starts_at: now,
          expires_at: expiresAt,
        });

        await this.command.updateJobPostBoostStatus({
          job_post_id,
          boost_type: boostType,
          boost_expires_at: expiresAt,
        });
      }

      return wrapper.data("Plan activated successfully");
    } catch (err) {
      logger.error(ctx, "_activatePlan", "Failed to activate plan", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  async applySinglePostToJob({ recruiter_id, single_post_slot_id, job_post_id }) {
    try {
      const query = `
        SELECT rsp.id, rsp.recruiter_id, rsp.plan_id, rsp.is_used, rsp.is_active, rsp.expires_at,
               spp.is_hot
        FROM recruiter_single_posts rsp
        JOIN single_post_plans spp ON spp.id = rsp.plan_id
        WHERE rsp.id = $1 AND rsp.recruiter_id = $2
        LIMIT 1;
      `;
      const slotResult = await this.query.db.executeQuery(query, [single_post_slot_id, recruiter_id]);

      if (!slotResult?.rows?.length) {
        return wrapper.error(new NotFoundError("Slot satuan tidak ditemukan"));
      }

      const slot = slotResult.rows[0];

      if (slot.is_used) {
        return wrapper.error(new BadRequestError("Slot ini sudah digunakan"));
      }

      if (!slot.is_active) {
        return wrapper.error(new BadRequestError("Slot tidak aktif"));
      }

      if (new Date(slot.expires_at) < new Date()) {
        return wrapper.error(new BadRequestError("Slot sudah kadaluarsa"));
      }

      // Verify job post ownership (IDOR protection)
      const jobPostResult = await this.query.getJobPostOwner(job_post_id);
      if (!jobPostResult?.rows?.length) {
        return wrapper.error(new NotFoundError("Job post not found"));
      }
      if (jobPostResult.rows[0].recruiter_id !== recruiter_id) {
        return wrapper.error(
          new ForbiddenError("Job post ini bukan milik Anda")
        );
      }

      await this.command.markSinglePostAsUsed({ id: single_post_slot_id, job_post_id });

      if (slot.is_hot) {
        await this.command.updateJobPostHotStatus({ job_post_id, is_hot: true });
      }

      return wrapper.data({ message: "Slot berhasil diterapkan pada job post", job_post_id });
    } catch (err) {
      logger.error(ctx, "applySinglePostToJob", "Failed to apply single post", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }
}

module.exports = PaymentCommandDomain;
