const cors = require("cors");
const config = require("../config/global_config");

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Origin masuk:", origin); // <-- CEK INI
    const allowed = String(config.get("/cors/origins")).split(",");
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  // origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};

module.exports = cors(corsOptions);
