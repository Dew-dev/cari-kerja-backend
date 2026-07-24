const { parseCV } = require("../services/cv_parser");
const { sendResponse } = require("../../../helpers/utils/response");
const wrapper = require("../../../helpers/utils/wrapper");
const { BadRequestError, InternalServerError } = require("../../../helpers/errors");
const fs = require("fs");

/**
 * POST /api/v1/workers/cv/parse
 * Upload a PDF or DOCX CV and receive structured parsed data.
 * The returned data can be used to pre-fill worker profile forms
 * (work_experiences, educations, personal_info, skills).
 */
const parseCVHandler = async (req, res) => {
  if (!req.file) {
    return sendResponse(wrapper.error(new BadRequestError("CV file is required (pdf or docx)")), res);
  }

  const { path: filePath, mimetype } = req.file;

  try {
    const parsed = await parseCV(filePath, mimetype);
    return sendResponse(wrapper.data(parsed), res);
  } catch (err) {
    if (err.message && err.message.includes("Unsupported")) {
      return sendResponse(wrapper.error(new BadRequestError(err.message)), res);
    }
    if (err.message && /empty|no content/i.test(err.message)) {
      return sendResponse(wrapper.error(new BadRequestError("CV has no extractable content")), res);
    }
    // Surface Python/venv/dependency failures so VPS setup issues are visible.
    if (
      err.code === "PYTHON_CV_PARSER" ||
      err.error_type === "ModuleNotFoundError" ||
      err.error_type === "ImportError" ||
      err.error_type === "SpawnError" ||
      err.error_type === "ServiceUnavailable" ||
      err.error_type === "ServiceError" ||
      /Failed to start Python|Missing Python|pdfplumber|docx2txt|CV_PYTHON_BIN|CV_PARSER_SERVICE_URL|CV parser service/i.test(
        err.message || ""
      )
    ) {
      const detail = [err.message, err.hint].filter(Boolean).join(" | ");
      console.error("CV Python parser failed:", detail);
      return sendResponse(wrapper.error(new BadRequestError(detail)), res);
    }
    console.error("CV parse failed:", err.message);
    return sendResponse(wrapper.error(new InternalServerError("Failed to parse CV")), res);
  } finally {
    // clean up uploaded file after parsing
    fs.unlink(filePath, () => {});
  }
};

module.exports = { parseCVHandler };
