// Used to send response to client on api handler
const wrapper = require("./wrapper");

const sendResponse = async (result, res, code = 200) => {
  const statusCode = result.code ?? code;
  const message = result.message || "Your Request Has Been Processed";
  return result.err
    ? wrapper.response(res, "fail", result)
    : wrapper.response(res, "success", result, message, statusCode);
};

const paginationResponse = async (result, res) => {
  return result.err ? wrapper.response(res, "fail", result) : wrapper.paginationResponse(res, "success", result, "Your Request Has Been Processed");
};

const exportFileResponse = async (result, res) => {
  return result.err ? wrapper.response(res, "fail", result) : wrapper.exportFileResponse(res, "success", result, "Your Request Has Been Processed");
};

module.exports = {
  sendResponse,
  paginationResponse,
  exportFileResponse,
};
