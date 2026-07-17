const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");

const ctx = "Payments-Query-Domain";

class PaymentQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  /**
   * Ambil semua paket yang tersedia
   * Bisa difilter berdasarkan type: subscription | single_post | boost
   */
  async getAllPlans({ type } = {}) {
    try {
      const result = {
        subscription: [],
        single_post: [],
        boost: [],
      };

      if (!type || type === "subscription") {
        const sub = await this.query.getAllSubscriptionPlans();
        result.subscription = sub?.rows || [];
      }

      if (!type || type === "single_post") {
        const single = await this.query.getAllSinglePostPlans();
        result.single_post = single?.rows || [];
      }

      if (!type || type === "boost") {
        const boost = await this.query.getAllBoostPlans();
        result.boost = boost?.rows || [];
      }

      return wrapper.data(result);
    } catch (err) {
      logger.error(ctx, "getAllPlans", "Failed to get plans", err);
      return wrapper.error(err);
    }
  }

  /**
   * Ambil riwayat order dengan pagination
   */
  async getPaymentOrders({ recruiter_id, status, order_type, page, limit }) {
    try {
      const offset = (page - 1) * limit;

      const [orders, countResult] = await Promise.all([
        this.query.getPaymentOrders({ recruiter_id, status, order_type, limit, offset }),
        this.query.countPaymentOrders({ recruiter_id, status, order_type }),
      ]);

      const total = parseInt(countResult?.rows?.[0]?.count || 0, 10);
      const meta = wrapper.buildPaginationMeta(page, limit, total);

      return wrapper.paginationData(orders?.rows || [], meta);
    } catch (err) {
      logger.error(ctx, "getPaymentOrders", "Failed to get payment orders", err);
      return wrapper.error(err);
    }
  }

  /**
   * Ambil detail satu order
   */
  async getOrderDetail({ id, recruiter_id }) {
    try {
      const result = await this.query.getOrderDetail({ id, recruiter_id });
      if (!result?.rows?.length) {
        const { NotFoundError } = require("../../../../helpers/errors");
        return wrapper.error(new NotFoundError("Order not found"));
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, "getOrderDetail", "Failed to get order detail", err);
      return wrapper.error(err);
    }
  }

  /**
   * Ambil paket aktif recruiter (subscription + slot satuan tersedia)
   */
  async getActivePlan({ recruiter_id }) {
    try {
      const [subscriptionResult, singlePostResult] = await Promise.all([
        this.query.getActiveSubscription(recruiter_id),
        this.query.getAvailableSinglePosts(recruiter_id),
      ]);

      const activeSubscription = subscriptionResult?.rows?.[0] || null;
      const availableSinglePosts = singlePostResult?.rows || [];

      // Free default = 1; subscription max + each unused single-post slot
      let maxActivePosts = 1;
      if (activeSubscription) {
        maxActivePosts = Number(activeSubscription.max_active_posts) || 1;
      }
      maxActivePosts += availableSinglePosts.length;

      return wrapper.data({
        subscription: activeSubscription,
        available_single_posts: availableSinglePosts,
        max_active_posts: maxActivePosts,
        single_post_slots: availableSinglePosts.length,
      });
    } catch (err) {
      logger.error(ctx, "getActivePlan", "Failed to get active plan", err);
      return wrapper.error(err);
    }
  }
}

module.exports = PaymentQueryDomain;
