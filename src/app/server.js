const cors = require("./cors");
const path = require("path");
const http = require("http");
const express = require("express");
const routes = require("../routes");
const config = require("../config/global_config");
const cookieParser = require("cookie-parser");
const pgConfig = config.get("/postgresqlUrl");
const pgConnectionPool = require("../helpers/databases/postgresql/connection");
const redisConnection = require("../helpers/databases/redis/connection");
const emailWorker = require("../helpers/queues/email.worker");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const { initSocket } = require("../helpers/socket");

class AppServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.app.use(cors);
    this.port = config.get("/port");

    this._middlewares();
    this._routes();
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      "/uploads",
      express.static(path.join(__dirname, "../uploads"))
    );

    pgConnectionPool.init(pgConfig);
    redisConnection.init();
    emailWorker.start();
    initSocket(this.server);
  }


  _middlewares() {
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  _routes() {
    this.app.get("/", (req, res) => {
      res.status(200).send({
        success: true,
        data: "",
        message: "Success",
        code: 200,
      });
    });

    // Swagger UI
    try {
      const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, "../../swagger_output.json"), 'utf8'));
      // Force "Try it out" to always call the server that is actually running
      // this process, regardless of which env/host is serving the docs page.
      // Without this, the docs default to whichever "servers" entry comes
      // first (e.g. staging), so requests from a local dev server silently
      // hit the wrong host/port and "Try it out" appears broken.
      swaggerFile.servers = [
        { url: "/", description: "Current server (auto-detected)" },
        ...(swaggerFile.servers || []),
      ];
      this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile, {
        explorer: true,
        swaggerOptions: { tryItOutEnabled: true },
      }));
    } catch (err) {
      console.warn("Swagger file not found. Run 'npm run swagger' to generate it.");
    }

    routes(this.app);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("\n", __dirname);
      console.log(`🚀 Server running at http://localhost:${this.port}\n\n`);
    });
  }
}

module.exports = AppServer;
