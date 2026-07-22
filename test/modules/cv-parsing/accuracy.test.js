/**
 * CV parser accuracy tests — local heuristic path (no AI).
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

const mockConvertToHtml = jest.fn();
const mockExtractRawText = jest.fn().mockResolvedValue({ value: "John Doe\nSoftware Engineer" });
jest.mock("mammoth", () => ({
  convertToHtml: (...args) => mockConvertToHtml(...args),
  extractRawText: (...args) => mockExtractRawText(...args),
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
  parseWithDocxStyle,
  isThinParsedResult,
  scoreParsedResult,
  normalizeParsedResult,
  htmlToStructuredLines,
  isDocxMimetype,
} = require("../../../src/modules/cv-parsing/services/cv_parser");
const { parseCVHandler } = require("../../../src/modules/cv-parsing/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

const ENGLISH_CV = [
  "Jane Smith",
  "jane.smith@email.com",
  "+1 (415) 555-0199",
  "San Francisco, CA",
  "",
  "Professional Experience",
  "Software Engineer",
  "Acme Corp Inc.",
  "January 2021 - Present",
  "- Built REST APIs with Node.js",
  "- Improved CI pipelines",
  "",
  "Education",
  "Bachelor of Science in Computer Science",
  "Stanford University",
  "2016 - 2020",
  "",
  "Technical Skills",
  "JavaScript, TypeScript, PostgreSQL, Docker",
].join("\n");

const INDONESIAN_CV_HTML = [
  "<p><strong>Budi Santoso</strong></p>",
  "<p>budi.santoso@email.com</p>",
  "<p>081234567890</p>",
  "<p>Jakarta</p>",
  "<h2>Pengalaman Kerja</h2>",
  "<p><strong>Staff Administrasi</strong></p>",
  "<p>PT Maju Jaya</p>",
  "<p>Januari 2020 - Sekarang</p>",
  "<ul><li>Mengelola dokumen kantor</li><li>Melayani pelanggan</li></ul>",
  "<h2>Pendidikan</h2>",
  "<p>S1 Teknik Informatika</p>",
  "<p>Universitas Indonesia</p>",
  "<p>2015 - 2019</p>",
  "<h2>Keahlian</h2>",
  "<p>Microsoft Office, Komunikasi, Excel, Leadership</p>",
].join("");

describe("cv-parsing accuracy (local)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CV_PARSER_AI_URL;
    delete process.env.CV_PARSER_AI_KEY;

    mockPDFParse.mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: "John Doe\nSoftware Engineer\nSkills: JavaScript" }),
    }));

    mockConvertToHtml.mockResolvedValue({ value: INDONESIAN_CV_HTML });
    mockExtractRawText.mockResolvedValue({ value: INDONESIAN_CV });
  });

  it("PDF extraction should read file buffer not path as url", async () => {
    const filePath = "C:\\uploads\\cv-temp\\resume.pdf";

    await parseCV(filePath, "application/pdf");

    expect(mockPDFParse).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Buffer) })
    );
    expect(mockPDFParse).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: filePath })
    );
  });

  it("parseCV should reject empty extracted text", async () => {
    mockPDFParse.mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: "   " }),
    }));

    await expect(parseCV("/tmp/blank.pdf", "application/pdf")).rejects.toThrow(
      /empty|no content/i
    );
  });

  it("parseCVHandler should not expose internal error details", async () => {
    const res = createMockResponse();
    const req = createMockRequest({
      userMeta: { id: "550e8400-e29b-41d4-a716-446655440000", role_id: 1 },
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

  it("should extract Indonesian CV fields via NLP fallback", () => {
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

  it("should extract English CV fields via NLP fallback", () => {
    const parsed = parseWithNlpFallback(ENGLISH_CV);

    expect(parsed.personal_info.full_name).toMatch(/Jane/i);
    expect(parsed.personal_info.email).toBe("jane.smith@email.com");
    expect(parsed.personal_info.phone).toMatch(/415/);
    expect(parsed.personal_info.location).toMatch(/San Francisco/i);

    expect(parsed.work_experiences.length).toBeGreaterThanOrEqual(1);
    expect(parsed.work_experiences[0].job_title).toMatch(/Software Engineer/i);
    expect(parsed.work_experiences[0].company_name).toMatch(/Acme/i);
    expect(parsed.work_experiences[0].is_current).toBe(true);
    expect(parsed.work_experiences[0].start_date).toBe("2021-01");

    expect(parsed.educations.length).toBeGreaterThanOrEqual(1);
    expect(parsed.educations[0].institution_name).toMatch(/Stanford/i);
    expect(parsed.educations[0].degree).toMatch(/Bachelor|Computer Science/i);

    expect(parsed.skills).toEqual(
      expect.arrayContaining(["JavaScript", "TypeScript", "PostgreSQL", "Docker"])
    );
    expect(isThinParsedResult(parsed)).toBe(false);
    expect(parsed._meta.parser).toBe("nlp_fallback");
  });

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

  it("should normalize empty strings, phones, current roles, and dedupe skills", () => {
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

  describe("DOCX support", () => {
    it("should recognize docx and msword mimetypes", () => {
      expect(isDocxMimetype(DOCX_MIME)).toBe(true);
      expect(isDocxMimetype("application/msword")).toBe(true);
      expect(isDocxMimetype("application/pdf")).toBe(false);
    });

    it("should convert DOCX HTML into structured lines with bold headings", () => {
      const lines = htmlToStructuredLines(INDONESIAN_CV_HTML);
      expect(lines[0].text).toMatch(/Budi/i);
      expect(lines[0].isBold).toBe(true);
      expect(lines.find((l) => l.text.includes("0812"))?.isBold).toBe(false);
      expect(lines.some((l) => /Pengalaman Kerja/i.test(l.text))).toBe(true);
    });

    it("parseWithDocxStyle should extract Indonesian CV fields from HTML", async () => {
      const parsed = normalizeParsedResult(await parseWithDocxStyle("/tmp/cv.docx"));

      expect(mockConvertToHtml).toHaveBeenCalledWith({ path: "/tmp/cv.docx" });
      expect(parsed.personal_info.full_name).toMatch(/Budi/i);
      expect(parsed.personal_info.email).toBe("budi.santoso@email.com");
      expect(parsed.personal_info.phone).toMatch(/081234567890/);
      expect(parsed.work_experiences[0].job_title).toMatch(/Staff/i);
      expect(parsed.work_experiences[0].company_name).toMatch(/Maju Jaya/i);
      expect(parsed.work_experiences[0].is_current).toBe(true);
      expect(parsed.work_experiences[0].start_date).toBe("2020-01");
      expect(parsed.educations[0].institution_name).toMatch(/Universitas Indonesia/i);
      expect(parsed.skills).toEqual(
        expect.arrayContaining(["Microsoft Office", "Excel", "Leadership"])
      );
      expect(parsed._meta.parser).toBe("docx_style");
    });

    it("parseCV should parse DOCX via structured path when enabled", async () => {
      jest.resetModules();
      process.env.CV_USE_RESUME_PARSER = "false";
      process.env.CV_USE_OPENRESUME_STYLE = "true";
      delete process.env.CV_PARSER_AI_URL;
      delete process.env.CV_PARSER_AI_KEY;

      jest.doMock("mammoth", () => ({
        convertToHtml: jest.fn().mockResolvedValue({ value: INDONESIAN_CV_HTML }),
        extractRawText: jest.fn().mockResolvedValue({ value: INDONESIAN_CV }),
      }));
      jest.doMock("pdf-parse", () => ({ PDFParse: mockPDFParse }));
      jest.doMock("axios", () => ({ post: jest.fn() }));
      jest.doMock("fs", () => ({
        unlink: jest.fn((path, cb) => cb && cb()),
        readFileSync: jest.fn(() => Buffer.from("%PDF-1.4 fake content")),
        existsSync: jest.fn(() => true),
        mkdirSync: jest.fn(),
        rmSync: jest.fn(),
      }));

      const { parseCV: parseCVIsolated } = require("../../../src/modules/cv-parsing/services/cv_parser");
      const parsed = await parseCVIsolated("/tmp/cv.docx", DOCX_MIME);

      expect(parsed.personal_info.email).toBe("budi.santoso@email.com");
      expect(parsed.work_experiences.length).toBeGreaterThanOrEqual(1);
      expect(["docx_style", "nlp_fallback"]).toContain(parsed._meta.parser);
    });

    it("parseCV should reject empty DOCX content", async () => {
      mockConvertToHtml.mockResolvedValue({ value: "   " });
      mockExtractRawText.mockResolvedValue({ value: "   " });

      await expect(parseCV("/tmp/blank.docx", DOCX_MIME)).rejects.toThrow(/empty|no content/i);
    });
  });
});
