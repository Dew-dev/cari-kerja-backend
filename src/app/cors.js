const cors = require("cors");
const config = require("../config/global_config");

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = String(config.get("/cors/origins")).split(",");

    console.log("Origin masuk:", origin);
    console.log("Allowed origins:", allowed);

    if (process.env.NODE_ENV === "local") {
      return callback(null, true);
    }
    // CASE 1: OPTIONS request tanpa Origin
    if (!origin) {
      console.log("Tidak ada origin, pakai origin default:", allowed[0]);
      return callback(null, allowed[0]);
    }

    // CASE 2: Origin sesuai daftar allowlist
    if (allowed.includes(origin)) {
      console.log("Origin sesuai:", origin);
      return callback(null, origin);
    }

    // CASE 3: Origin tidak diizinkan
    console.log("Origin tidak sesuai:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  // origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};

module.exports = cors(corsOptions);
