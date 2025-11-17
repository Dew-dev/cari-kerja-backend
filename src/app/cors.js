const cors = require("cors");
const config = require("../config/global_config");

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = String(config.get("/cors/origins")).split(",");
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};

module.exports = cors(corsOptions);
