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

const ctx = "Payments-Command-Domain";

class PaymentCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  /**
   * Buat invoice pembayaran dan simpan order
   * Mendukung 3 tipe order: subscription, single_post, boost
   */
  async createInvoice({ recruiter_id, user_email, order_type, plan_id, job_post_id }) {
    try {
      // 1. Validasi plan berdasarkan tipe order
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

        // Validasi job post milik recruiter
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

      // 2. Buat payment order dengan status pending
      const orderId = uuidv4();
      const externalId = `CK-${order_type.toUpperCase()}-${orderId}`;

      // 3. Buat Xendit invoice
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

      // 4. Simpan order ke database
      const invoiceExpiresAt = xenditInvoice.expiry_date
        ? new Date(xenditInvoice.expiry_date)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 jam fallback

      await this.command.insertPaymentOrder({
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
        metadata: {
          plan_name: plan.name,
          plan_display_name: plan.display_name,
          xendit_invoice_url: xenditInvoice.invoice_url,
        },
      });

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
   * Handle webhook Xendit — aktivasi paket setelah pembayaran berhasil
   */
  async handleXenditWebhook(webhookPayload) {
    try {
      const { id: xenditInvoiceId, external_id, status, paid_at } = webhookPayload;

      // 1. Log webhook masuk
      const logId = uuidv4();

      // 2. Cari order berdasarkan external_id
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

      // 3. Jika status bukan PAID, update saja status dan return
      if (status !== "PAID") {
        const newStatus = status === "EXPIRED" ? "expired" : "failed";
        await this.command.updateOrderStatus({
          id: order.id,
          status: newStatus,
          paid_at: null,
          xendit_invoice_id: xenditInvoiceId,
        });
        return wrapper.data({ order_id: order.id, status: newStatus });
      }

      // 4. Jika sudah PAID sebelumnya, skip (idempotent)
      if (order.status === "paid") {
        return wrapper.data({ order_id: order.id, status: "paid", message: "Already processed" });
      }

      // 5. Update order status jadi paid
      await this.command.updateOrderStatus({
        id: order.id,
        status: "paid",
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        xendit_invoice_id: xenditInvoiceId,
      });

      // 6. Aktivasi paket berdasarkan order_type
      const activationResult = await this._activatePlan(order);
      if (activationResult.err) {
        logger.error(ctx, "handleXenditWebhook", "Plan activation failed", activationResult.err);
        // Tetap return success karena pembayaran sudah tercatat — aktivasi bisa di-retry
      }

      return wrapper.data({ order_id: order.id, status: "paid", activated: !activationResult.err });
    } catch (err) {
      logger.error(ctx, "handleXenditWebhook", "Unexpected error", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  /**
   * Aktivasi paket setelah pembayaran berhasil (internal)
   */
  async _activatePlan(order) {
    try {
      const { recruiter_id, order_type, plan_id, job_post_id, id: payment_order_id } = order;
      const now = new Date();

      if (order_type === "subscription") {
        // Ambil detail plan
        const planResult = await this.query.getSubscriptionPlanById(plan_id);
        if (!planResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Subscription plan not found"));
        }
        const plan = planResult.rows[0];
        const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

        // Nonaktifkan subscription lama
        await this.command.deactivateOldSubscriptions(recruiter_id);

        // Aktifkan subscription baru
        await this.command.insertRecruiterSubscription({
          id: uuidv4(),
          recruiter_id,
          plan_id,
          payment_order_id,
          starts_at: now,
          expires_at: expiresAt,
        });

      } else if (order_type === "single_post") {
        // Ambil detail plan
        const planResult = await this.query.getSinglePostPlanById(plan_id);
        if (!planResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Single post plan not found"));
        }
        const plan = planResult.rows[0];
        const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

        // Buat slot satuan
        await this.command.insertRecruiterSinglePost({
          id: uuidv4(),
          recruiter_id,
          plan_id,
          payment_order_id,
          expires_at: expiresAt,
        });

      } else if (order_type === "boost") {
        // Ambil detail plan
        const planResult = await this.query.getBoostPlanById(plan_id);
        if (!planResult?.rows?.length) {
          return wrapper.error(new NotFoundError("Boost plan not found"));
        }
        const plan = planResult.rows[0];
        const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

        // Tentukan boost_type berdasarkan priority
        const boostType = plan.boost_priority === 1 ? "hot" : "top10";

        // Aktifkan boost
        await this.command.insertJobPostBoost({
          id: uuidv4(),
          job_post_id,
          recruiter_id,
          boost_plan_id: plan_id,
          payment_order_id,
          starts_at: now,
          expires_at: expiresAt,
        });

        // Update job_posts tabel
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

  /**
   * Apply slot satuan ke job post tertentu (setelah recruiter memposting)
   */
  async applySinglePostToJob({ recruiter_id, single_post_slot_id, job_post_id }) {
    try {
      // Ambil slot
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

      // Tandai slot sebagai digunakan
      await this.command.markSinglePostAsUsed({ id: single_post_slot_id, job_post_id });

      // Jika plan hot, update is_hot di job_posts
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
