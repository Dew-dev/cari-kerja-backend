/**
 * Hybrid OCR unit tests — digital → tesseract → vision.
 */
process.env.CV_OCR_ENABLED = "true";
process.env.CV_OCR_MIN_CHARS = "80";
delete process.env.CV_OCR_VISION_URL;
delete process.env.CV_OCR_VISION_KEY;

const mockRecognize = jest.fn();
const mockTerminate = jest.fn().mockResolvedValue(undefined);
const mockCreateWorker = jest.fn();

jest.mock("tesseract.js", () => ({
  createWorker: (...args) => mockCreateWorker(...args),
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

describe("cv OCR hybrid", () => {
  let ocr;
  let axios;

  const richText =
    "Budi Santoso\nbudi.santoso@email.com\n081234567890\nJakarta Selatan\n" +
    "Pengalaman Kerja\nStaff Administrasi di PT Maju Jaya sejak Januari 2020";

  beforeEach(() => {
    jest.resetModules();
    process.env.CV_OCR_ENABLED = "true";
    process.env.CV_OCR_MIN_CHARS = "80";
    delete process.env.CV_OCR_VISION_URL;
    delete process.env.CV_OCR_VISION_KEY;
    delete process.env.CV_OCR_VISION_MODEL;

    mockRecognize.mockReset();
    mockTerminate.mockClear();
    mockCreateWorker.mockReset();
    mockCreateWorker.mockResolvedValue({
      recognize: mockRecognize,
      terminate: mockTerminate,
    });

    axios = require("axios");
    axios.post.mockReset();

    ocr = require("../../../src/modules/cv-parsing/services/cv_ocr");
    jest.spyOn(ocr, "renderPdfPagesToPng").mockResolvedValue([Buffer.from("fake-png")]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("isThinExtractedText detects empty and short garbage", () => {
    expect(ocr.isThinExtractedText("")).toBe(true);
    expect(ocr.isThinExtractedText("   ")).toBe(true);
    expect(ocr.isThinExtractedText(".... ....")).toBe(true);
    expect(ocr.isThinExtractedText(richText)).toBe(false);
  });

  it("extractPdfTextHybrid returns digital when text is rich enough", async () => {
    const result = await ocr.extractPdfTextHybrid("/tmp/cv.pdf", richText);
    expect(result.method).toBe("digital");
    expect(result.text).toContain("Budi Santoso");
    expect(mockCreateWorker).not.toHaveBeenCalled();
  });

  it("extractPdfTextHybrid falls back to tesseract when digital is thin", async () => {
    mockRecognize.mockResolvedValue({ data: { text: richText } });

    const result = await ocr.extractPdfTextHybrid("/tmp/scan.pdf", "");
    expect(result.method).toBe("tesseract");
    expect(result.text).toContain("Budi Santoso");
    expect(mockCreateWorker).toHaveBeenCalled();
    expect(mockTerminate).toHaveBeenCalled();
  });

  it("extractPdfTextHybrid uses vision when tesseract stays thin and keys exist", async () => {
    process.env.CV_OCR_VISION_URL = "https://api.openai.com/v1/chat/completions";
    process.env.CV_OCR_VISION_KEY = "test-key";
    process.env.CV_OCR_VISION_MODEL = "gpt-4o-mini";

    jest.resetModules();
    mockCreateWorker.mockResolvedValue({
      recognize: jest.fn().mockResolvedValue({ data: { text: "abc" } }),
      terminate: jest.fn().mockResolvedValue(undefined),
    });
    axios = require("axios");
    axios.post.mockResolvedValue({
      data: {
        choices: [{ message: { content: richText } }],
      },
    });

    ocr = require("../../../src/modules/cv-parsing/services/cv_ocr");
    jest.spyOn(ocr, "renderPdfPagesToPng").mockResolvedValue([Buffer.from("fake-png")]);

    expect(ocr.isVisionOcrEnabled()).toBe(true);

    const result = await ocr.extractPdfTextHybrid("/tmp/scan.pdf", "");
    expect(result.method).toBe("vision");
    expect(result.text).toContain("Budi Santoso");
    expect(axios.post).toHaveBeenCalled();
  });

  it("isVisionOcrEnabled is false when URL/KEY empty", () => {
    expect(ocr.isVisionOcrEnabled()).toBe(false);
  });
});
