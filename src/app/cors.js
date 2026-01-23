const cors = require("cors");
const config = require("../config/global_config");

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = String(config.get("/cors/origins")).split(",");

    // DEV MODE → allow all
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // Server-to-server / Postman
    if (!origin) {
      return callback(null, true);
    }

    // Browser origin check
    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};

module.exports = cors(corsOptions);
