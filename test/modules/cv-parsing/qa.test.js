/**
 * QA Bug-Hunting Tests — cv-parsing
 * Tests assert CORRECT expected behavior.
 */
process.env.CV_USE_RESUME_PARSER = "false";
process.env.CV_USE_OPENRESUME_STYLE = "false";
process.env.CV_OCR_ENABLED = "false";
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
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

const {
  parseCV,
  parseWithNlpFallback,
  isThinParsedResult,
  scoreParsedResult,
  normalizeParsedResult,
} = require("../../../src/modules/cv-parsing/services/cv_parser");
const { parseCVHandler } = require("../../../src/modules/cv-parsing/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");

const INDONESIAN_CV = [
  "Budi Santoso",
  "budi.santoso@email.com",
  "081234567890",
  "Jakarta",
  "",
  "Pengalaman Kerja",
  "Staff Administrasi",
  "PT Maju Jaya",
  "Januari 2020 - Sekarang",
  "- Mengelola dokumen kantor",
  "- Melayani pelanggan",
  "",
  "Pendidikan",
  "S1 Teknik Informatika",
  "Universitas Indonesia",
  "2015 - 2019",
  "",
  "Keahlian",
  "Microsoft Office, Komunikasi, Excel, Leadership",
].join("\n");

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

  describe("Indonesian CV NLP fallback", () => {
    it("should extract personal info, experience, education, and skills", () => {
      const parsed = parseWithNlpFallback(INDONESIAN_CV);

      expect(parsed.personal_info.full_name).toMatch(/Budi/i);
      expect(parsed.personal_info.email).toBe("budi.santoso@email.com");
      expect(parsed.personal_info.phone).toMatch(/081234567890/);
      expect(parsed.personal_info.location).toMatch(/Jakarta/i);

      expect(parsed.work_experiences.length).toBeGreaterThanOrEqual(1);
      expect(parsed.work_experiences[0].job_title).toMatch(/Staff/i);
      expect(parsed.work_experiences[0].company_name).toMatch(/Maju Jaya/i);
      expect(parsed.work_experiences[0].is_current).toBe(true);
      expect(parsed.work_experiences[0].start_date).toBe("2020-01");

      expect(parsed.educations.length).toBeGreaterThanOrEqual(1);
      expect(parsed.educations[0].institution_name).toMatch(/Universitas Indonesia/i);
      expect(parsed.educations[0].degree).toMatch(/S1/i);
      expect(parsed.educations[0].start_date).toBe("2015-01");
      expect(parsed.educations[0].end_date).toBe("2019-01");

      expect(parsed.skills).toEqual(
        expect.arrayContaining(["Microsoft Office", "Excel", "Leadership"])
      );
      expect(parsed._meta.parser).toBe("nlp_fallback");
    });
  });

  describe("Quality gate helpers", () => {
    it("should mark nearly empty parse results as thin", () => {
      const thin = normalizeParsedResult({
        personal_info: { full_name: null, email: null, phone: null, location: null },
        work_experiences: [],
        educations: [],
        skills: [],
      });
      expect(isThinParsedResult(thin)).toBe(true);
      expect(scoreParsedResult(thin)).toBeLessThan(3);
    });

    it("should not mark a filled Indonesian parse as thin", () => {
      const parsed = parseWithNlpFallback(INDONESIAN_CV);
      expect(isThinParsedResult(parsed)).toBe(false);
      expect(scoreParsedResult(parsed)).toBeGreaterThanOrEqual(3);
    });

    it("should prefer richer result when comparing scores", () => {
      const rich = parseWithNlpFallback(INDONESIAN_CV);
      const thin = normalizeParsedResult({
        personal_info: { full_name: "X", email: null, phone: null, location: null },
        work_experiences: [],
        educations: [],
        skills: [],
      });
      expect(scoreParsedResult(rich)).toBeGreaterThan(scoreParsedResult(thin));
    });
  });

  describe("Output normalization", () => {
    it("should trim empty strings to null and dedupe skills case-insensitively", () => {
      const normalized = normalizeParsedResult({
        personal_info: {
          full_name: "  Ada Nama  ",
          email: " ",
          phone: "0812 3456 7890",
          location: "",
        },
        work_experiences: [
          {
            company_name: " PT X ",
            job_title: "",
            start_date: "2020-01",
            end_date: "sekarang",
            is_current: false,
            description: "  ",
          },
        ],
        educations: [],
        skills: ["Excel", "excel", "Excel,", "Word"],
      });

      expect(normalized.personal_info.full_name).toBe("Ada Nama");
      expect(normalized.personal_info.email).toBeNull();
      expect(normalized.personal_info.phone).toBe("081234567890");
      expect(normalized.personal_info.location).toBeNull();
      expect(normalized.work_experiences[0].job_title).toBeNull();
      expect(normalized.work_experiences[0].is_current).toBe(true);
      expect(normalized.work_experiences[0].end_date).toBeNull();
      expect(normalized.skills).toEqual(["Excel", "Word"]);
    });
  });
});
