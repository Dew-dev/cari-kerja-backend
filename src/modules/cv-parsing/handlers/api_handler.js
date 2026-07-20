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
    console.error("CV parse failed:", err.message);
    return sendResponse(wrapper.error(new InternalServerError("Failed to parse CV")), res);
  } finally {
    // clean up uploaded file after parsing
    fs.unlink(filePath, () => {});
  }
};

module.exports = { parseCVHandler };
