const contactUsHandler = require("../modules/contact_us/handlers/api_handlers");

module.exports = (server) => {
  // Create contact message (public, no auth required)
  server.post("/api/v1/contact-us", contactUsHandler.createContactMessage);

  // Get all contact messages (admin only - add verification if needed)
  server.get("/api/v1/contact-us", contactUsHandler.getContactMessages);

  // Get contact message by ID (admin only - add verification if needed)
  server.get("/api/v1/contact-us/:id", contactUsHandler.getContactMessageById);

  // Delete contact message (admin only - add verification if needed)
  server.delete("/api/v1/contact-us/:id", contactUsHandler.deleteContactMessage);
};
