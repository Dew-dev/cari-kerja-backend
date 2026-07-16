/**
 * QA Bug-Hunting Tests — cv-parsing
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
process.env.CV_USE_RESUME_PARSER = "false";
process.env.CV_USE_OPENRESUME_STYLE = "false";
delete process.env.CV_PARSER_AI_URL;
delete process.env.CV_PARSER_AI_KEY;

jest.mock("axios", () => ({
  post: jest.fn(),
}));

const mockPDFParse = jest.fn();
jest.mock("pdf-parse", () => ({
  PDFParse: mockPDFParse,
}));

jest.mock("mammoth", () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: "John Doe\nSoftware Engineer" }),
}));

jest.mock("fs", () => ({
  unlink: jest.fn((path, cb) => cb && cb()),
  readFileSync: jest.fn(() => Buffer.from("%PDF-1.4 fake content")),
  existsSync: jest.fn(() => true),
}));

const { parseCV } = require("../../../src/modules/cv-parsing/services/cv_parser");
const { parseCVHandler } = require("../../../src/modules/cv-parsing/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");

describe("[QA] cv-parsing module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CV_PARSER_AI_URL;
    delete process.env.CV_PARSER_AI_KEY;

    mockPDFParse.mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: "John Doe\nSoftware Engineer\nSkills: JavaScript" }),
    }));
  });

  describe("PDF extraction — file path vs buffer", () => {
    it("[BUG-CV-001] PDF extraction should read file buffer not local path as url", async () => {
      const filePath = "C:\\uploads\\cv-temp\\resume.pdf";

      await parseCV(filePath, "application/pdf");

      expect(mockPDFParse).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Buffer) })
      );
      expect(mockPDFParse).not.toHaveBeenCalledWith(
        expect.objectContaining({ url: filePath })
      );
    });
  });

  describe("Security — worker-only endpoint", () => {
    it("[BUG-CV-002] parseCVHandler should reject non-worker roles", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { id: "recruiter-1", role_id: 2 },
        file: {
          path: "/tmp/cv.pdf",
          mimetype: "application/pdf",
          filename: "cv.pdf",
        },
      });

      await parseCVHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("Security — error message leakage", () => {
    it("[BUG-CV-003] parseCVHandler should not expose internal error details to client", async () => {
      const workerId = "550e8400-e29b-41d4-a716-446655440000";
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { id: workerId, role_id: 1 },
        file: {
          path: "/tmp/cv.pdf",
          mimetype: "application/pdf",
          filename: "cv.pdf",
        },
      });

      mockPDFParse.mockImplementation(() => ({
        getText: jest.fn().mockRejectedValue(new Error("ECONNREFUSED 127.0.0.1:9999")),
      }));

      await parseCVHandler(req, res);

      const statusCode = res.status.mock.calls[0][0];
      const body = res.send.mock.calls[0][0];
      expect(statusCode).toBe(500);
      expect(body.message).not.toMatch(/ECONNREFUSED/);
      expect(body.message).not.toMatch(/127\.0\.0\.1/);
    });
  });

  describe("Input validation — empty extracted text", () => {
    it("[BUG-CV-004] parseCV should reject empty extracted text", async () => {
      mockPDFParse.mockImplementation(() => ({
        getText: jest.fn().mockResolvedValue({ text: "   " }),
      }));

      await expect(parseCV("/tmp/blank.pdf", "application/pdf")).rejects.toThrow(
        /empty|no content/i
      );
    });
  });

  describe("AI parsing — malformed JSON response", () => {
    it("[BUG-CV-005] parseWithAI should handle invalid JSON without uncaught exception", async () => {
      const axios = require("axios");
      let isolatedParseWithAI;

      jest.isolateModules(() => {
        process.env.CV_PARSER_AI_URL = "https://api.openai.com/v1/chat/completions";
        process.env.CV_PARSER_AI_KEY = "test-key";
        isolatedParseWithAI = require("../../../src/modules/cv-parsing/services/cv_parser").parseWithAI;
      });

      axios.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: "{ invalid json" } }],
        },
      });

      await expect(isolatedParseWithAI("Some CV text")).resolves.toEqual(
        expect.objectContaining({
          personal_info: expect.any(Object),
        })
      );
    });
  });

  describe("Routing — role enforcement at route level", () => {
    it("[BUG-CV-006] cv parse route should require worker role middleware", () => {
      let middlewares = [];

      const mockServer = {
        post: jest.fn((path, ...handlers) => {
          if (path.includes("/cv/parse")) {
            middlewares = handlers.slice(0, -1);
          }
        }),
      };

      jest.isolateModules(() => {
        jest.doMock("../../../src/middlewares/verifyToken", () => jest.fn());
        jest.doMock("../../../src/middlewares/uploader", () => ({
          uploadCV: { single: () => jest.fn() },
        }));
        require("../../../src/routes/cv_parsing")(mockServer);
      });

      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /worker|role/i.test(name))).toBe(true);
    });
  });
});
