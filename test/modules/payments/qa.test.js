/**
 * QA Bug-Hunting Tests — payments
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/payments/repositories/commands/command_handler", () => ({
  createInvoice: jest.fn(),
  handleXenditWebhook: jest.fn(),
  applySinglePostToJob: jest.fn(),
}));

jest.mock("../../../src/modules/payments/repositories/queries/query_handler", () => ({
  getAllPlans: jest.fn(),
  getPaymentOrders: jest.fn(),
  getOrderDetail: jest.fn(),
  getActivePlan: jest.fn(),
}));

jest.mock("../../../src/helpers/xendit/xendit_helper", () => ({
  createInvoice: jest.fn(),
  verifyWebhookToken: jest.fn(),
}));

const PaymentCommandDomain = require("../../../src/modules/payments/repositories/commands/domain");
const PaymentQueryDomain = require("../../../src/modules/payments/repositories/queries/domain");
const paymentsHandler = require("../../../src/modules/payments/handlers/api_handler");
const xenditHelper = require("../../../src/helpers/xendit/xendit_helper");
const wrapper = require("../../../src/helpers/utils/wrapper");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const {
  BadRequestError,
  ForbiddenError,
} = require("../../../src/helpers/errors");

describe("[QA] payments module", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const otherRecruiterId = "550e8400-e29b-41d4-a716-446655440099";
  const slotId = "550e8400-e29b-41d4-a716-446655440010";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440020";
  const orderId = "550e8400-e29b-41d4-a716-446655440030";

  describe("Security — IDOR on apply single post slot", () => {
    it("[BUG-PY-001] applySinglePostToJob should verify job_post belongs to recruiter", async () => {
      const domain = new PaymentCommandDomain({});
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      domain.query = {
        db: {
          executeQuery: jest.fn().mockResolvedValue({
            rows: [{
              id: slotId,
              recruiter_id: recruiterId,
              plan_id: 1,
              is_used: false,
              is_active: true,
              expires_at: futureDate,
              is_hot: true,
            }],
          }),
        },
        getJobPostOwner: jest.fn().mockResolvedValue({
          rows: [{ recruiter_id: otherRecruiterId }],
        }),
      };
      domain.command = {
        markSinglePostAsUsed: jest.fn().mockResolvedValue({ rows: [{ id: slotId }] }),
        updateJobPostHotStatus: jest.fn().mockResolvedValue({ rows: [{ id: jobPostId }] }),
      };

      const result = await domain.applySinglePostToJob({
        recruiter_id: recruiterId,
        single_post_slot_id: slotId,
        job_post_id: jobPostId,
      });

      expect(domain.query.getJobPostOwner).toHaveBeenCalledWith(jobPostId);
      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.markSinglePostAsUsed).not.toHaveBeenCalled();
    });
  });

  describe("Webhook — amount validation", () => {
    it("[BUG-PY-002] handleXenditWebhook should reject PAID when paid_amount is less than order amount", async () => {
      const domain = new PaymentCommandDomain({});
      domain.query = {
        getOrderByExternalId: jest.fn().mockResolvedValue({
          rows: [{
            id: orderId,
            recruiter_id: recruiterId,
            status: "pending",
            amount: 100000,
            order_type: "subscription",
            plan_id: 1,
            xendit_invoice_id: "xinv-stored",
          }],
        }),
        getSubscriptionPlanById: jest.fn(),
      };
      domain.command = {
        insertPaymentLog: jest.fn().mockResolvedValue({ rows: [{ id: "log-1" }] }),
        updateOrderStatus: jest.fn(),
        deactivateOldSubscriptions: jest.fn(),
        insertRecruiterSubscription: jest.fn(),
      };

      const result = await domain.handleXenditWebhook({
        id: "xinv-stored",
        external_id: "CK-SUBSCRIPTION-abc",
        status: "PAID",
        paid_amount: 50000,
        paid_at: new Date().toISOString(),
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(domain.command.insertRecruiterSubscription).not.toHaveBeenCalled();
    });
  });

  describe("Webhook — invoice id cross-check", () => {
    it("[BUG-PY-003] handleXenditWebhook should reject when webhook invoice id mismatches stored order", async () => {
      const domain = new PaymentCommandDomain({});
      domain.query = {
        getOrderByExternalId: jest.fn().mockResolvedValue({
          rows: [{
            id: orderId,
            recruiter_id: recruiterId,
            status: "pending",
            amount: 100000,
            order_type: "single_post",
            plan_id: 1,
            xendit_invoice_id: "xinv-original",
          }],
        }),
      };
      domain.command = {
        insertPaymentLog: jest.fn().mockResolvedValue({ rows: [{ id: "log-1" }] }),
        updateOrderStatus: jest.fn(),
        insertRecruiterSinglePost: jest.fn(),
      };

      const result = await domain.handleXenditWebhook({
        id: "xinv-forged",
        external_id: "CK-SINGLE_POST-abc",
        status: "PAID",
        paid_amount: 100000,
        paid_at: new Date().toISOString(),
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(domain.command.updateOrderStatus).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: "paid" })
      );
    });
  });

  describe("Create invoice — orphan Xendit invoice on DB failure", () => {
    it("[BUG-PY-004] createInvoice should fail when payment order insert returns no rows", async () => {
      const domain = new PaymentCommandDomain({});
      domain.query = {
        getSubscriptionPlanById: jest.fn().mockResolvedValue({
          rows: [{
            id: 1,
            name: "pro",
            display_name: "Pro Plan",
            price_idr: 50000,
            duration_days: 30,
          }],
        }),
      };
      domain.command = {
        insertPaymentOrder: jest.fn().mockResolvedValue({ rows: [] }),
      };

      xenditHelper.createInvoice.mockResolvedValue({
        err: null,
        data: {
          id: "xinv-new",
          invoice_url: "https://checkout.xendit.co/web/abc",
          expiry_date: new Date(Date.now() + 86400000).toISOString(),
        },
      });

      const result = await domain.createInvoice({
        recruiter_id: recruiterId,
        user_email: "recruiter@test.com",
        order_type: "subscription",
        plan_id: 1,
      });

      expect(result.err).toBeTruthy();
      expect(result.data).toBeNull();
    });
  });

  describe("Webhook — non-terminal status mapping", () => {
    it("[BUG-PY-005] PENDING webhook status should not mark order as failed", async () => {
      const domain = new PaymentCommandDomain({});
      domain.query = {
        getOrderByExternalId: jest.fn().mockResolvedValue({
          rows: [{
            id: orderId,
            status: "pending",
            amount: 100000,
          }],
        }),
      };
      domain.command = {
        insertPaymentLog: jest.fn().mockResolvedValue({ rows: [{ id: "log-1" }] }),
        updateOrderStatus: jest.fn().mockResolvedValue({ rows: [{ id: orderId, status: "pending" }] }),
      };

      const result = await domain.handleXenditWebhook({
        id: "xinv-1",
        external_id: "CK-SUBSCRIPTION-abc",
        status: "PENDING",
      });

      expect(domain.command.updateOrderStatus).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed" })
      );
      expect(result.data?.status).not.toBe("failed");
    });
  });

  describe("Pagination — meta field naming", () => {
    it("[BUG-PY-006] getPaymentOrders meta should use total_pages not totalPages", async () => {
      const domain = new PaymentQueryDomain({});
      domain.query = {
        getPaymentOrders: jest.fn().mockResolvedValue({ rows: [{ id: orderId }] }),
        countPaymentOrders: jest.fn().mockResolvedValue({ rows: [{ count: "25" }] }),
      };

      const result = await domain.getPaymentOrders({
        recruiter_id: recruiterId,
        page: 1,
        limit: 10,
      });

      expect(result.meta).toHaveProperty("total_pages");
      expect(result.meta).not.toHaveProperty("totalPages");
    });
  });

  describe("Business logic — active plan post limits", () => {
    it("[BUG-PY-007] getActivePlan max_active_posts should include available single post slots", async () => {
      const domain = new PaymentQueryDomain({});
      domain.query = {
        getActiveSubscription: jest.fn().mockResolvedValue({
          rows: [{ max_active_posts: 1, plan_name: "free" }],
        }),
        getAvailableSinglePosts: jest.fn().mockResolvedValue({
          rows: [{ id: "slot-1" }, { id: "slot-2" }],
        }),
      };

      const result = await domain.getActivePlan({ recruiter_id: recruiterId });

      expect(result.data.max_active_posts).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Security — worker cannot create invoice", () => {
    it("[BUG-PY-008] createInvoice handler should reject worker role with 403", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          role_id: 1,
          email: "worker@test.com",
        },
        body: {
          order_type: "subscription",
          plan_id: 1,
        },
      });

      await paymentsHandler.createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("Routing — recruiter role enforcement", () => {
    it("[BUG-PY-009] create-invoice route should require recruiter role middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/payments/create-invoice") {
            middlewares = handlers.slice(0, -1);
          }
        }),
      };

      jest.isolateModules(() => {
        jest.doMock("../../../src/middlewares/verifyToken", () => jest.fn());
        require("../../../src/routes/payments")(mockServer);
      });

      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /recruiter|role/i.test(name))).toBe(true);
    });
  });

  describe("Concurrency — webhook idempotency", () => {
    it("[BUG-PY-010] handleXenditWebhook should use atomic status transition for PAID", async () => {
      const domain = new PaymentCommandDomain({});
      domain.query = {
        getOrderByExternalId: jest.fn().mockResolvedValue({
          rows: [{
            id: orderId,
            recruiter_id: recruiterId,
            status: "pending",
            amount: 100000,
            order_type: "subscription",
            plan_id: 1,
            xendit_invoice_id: "xinv-1",
          }],
        }),
        getSubscriptionPlanById: jest.fn().mockResolvedValue({
          rows: [{ duration_days: 30 }],
        }),
      };
      domain.command = {
        insertPaymentLog: jest.fn().mockResolvedValue({ rows: [{ id: "log-1" }] }),
        updateOrderStatus: jest.fn().mockResolvedValue({
          rows: [{ id: orderId, status: "paid" }],
        }),
        deactivateOldSubscriptions: jest.fn().mockResolvedValue({ rows: [] }),
        insertRecruiterSubscription: jest.fn().mockResolvedValue({ rows: [{ id: "sub-1" }] }),
      };

      await domain.handleXenditWebhook({
        id: "xinv-1",
        external_id: "CK-SUBSCRIPTION-abc",
        status: "PAID",
        paid_amount: 100000,
        paid_at: new Date().toISOString(),
      });

      expect(domain.command.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          id: orderId,
          status: "paid",
          expected_current_status: "pending",
        })
      );
    });
  });
});
