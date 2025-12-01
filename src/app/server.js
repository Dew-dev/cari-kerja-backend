const cors = require("./cors");
const path = require("path");
const express = require("express");
const routes = require("../routes");
const config = require("../config/global_config");
const cookieParser = require("cookie-parser");
const pgConfig = config.get("/postgresqlUrl");
const pgConnectionPool = require("../helpers/databases/postgresql/connection");

class AppServer {
  constructor() {
    this.server = express();
    this.port = config.get("/port");
    this._middlewares();
    this._routes();
    this.server.use(express.urlencoded({ extended: true }));
    // this.server.use("/uploads", express.static("uploads"));
    this.server.use(
      "/uploads",
      express.static(path.join(__dirname, "../uploads"))
    );
    pgConnectionPool.init(pgConfig);
  }

  _middlewares() {
    this.server.use(cors);
    //console.log("CORS middleware applied", cors);
    // this.server.options("*", cors);
    this.server.use(express.json());
    this.server.use(cookieParser());
  }

  _routes() {
    this.server.get("/", (req, res) => {
      res.status(200).send({
        success: true,
        data: "",
        message: "Success",
        code: 200,
      });
    });

    routes(this.server);
  }

  listen() {
    this.server.listen(this.port, () => {
      //console.log("\n", __dirname);
      //console.log(`🚀 Server running at http://localhost:${this.port}\n\n`);
    });
  }
}

module.exports = AppServer;
