const cors = require("cors");
const config = require("../config/global_config");

const corsOptions = {
  origin: String(config.get("/cors/origins")).split(","),
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

module.exports = cors(corsOptions);
