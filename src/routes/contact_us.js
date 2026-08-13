const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const contactUsHandler = require("../modules/contact_us/handlers/api_handlers");
const contactUsLimiter = require("../middlewares/rateLimitContactUs");

// Public create — no auth.
// Admin read/delete — super_admin (3) or admin (4).
const adminRoles = [3, 4];

function verifyAdminRole(req, res, next) {
  return verifyRole(adminRoles)(req, res, next);
}

module.exports = (server) => {
  server.post(
    "/api/v1/contact-us",
    contactUsLimiter,
    contactUsHandler.createContactMessage
  );

  server.get(
    "/api/v1/contact-us",
    verifyToken,
    verifyAdminRole,
    contactUsHandler.getContactMessages
  );

  server.get(
    "/api/v1/contact-us/:id",
    verifyToken,
    verifyAdminRole,
    contactUsHandler.getContactMessageById
  );

  server.delete(
    "/api/v1/contact-us/:id",
    verifyToken,
    verifyAdminRole,
    contactUsHandler.deleteContactMessage
  );
};
