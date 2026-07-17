const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const genderHandler = require("../modules/genders/handlers/api_handler");

// Genders are lookup data — GET stays public.
// Mutations require admin (4) or super_admin (3).
const adminRoles = [3, 4];

module.exports = (server) => {
  server.get("/api/v1/genders", genderHandler.getAllGenders);
  server.get("/api/v1/genders/:id", genderHandler.getGender);
  server.put(
    "/api/v1/genders/:id",
    verifyToken,
    verifyRole(adminRoles),
    genderHandler.updateGender
  );
  server.post(
    "/api/v1/genders",
    verifyToken,
    verifyRole(adminRoles),
    genderHandler.addGender
  );
  server.delete(
    "/api/v1/genders/:id",
    verifyToken,
    verifyRole(adminRoles),
    genderHandler.deleteGender
  );
};
