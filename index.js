process.on("uncaughtException", (err) => {
  console.error("[CRASH] uncaughtException:", err);
  process.exit(1);
});

// Log async failures without always killing the server (BullMQ/redis blips, etc.).
process.on("unhandledRejection", (reason) => {
  console.error("[WARN] unhandledRejection:", reason);
});

process.on("exit", (code) => {
  console.error(`[EXIT] process exiting with code ${code}`);
});
process.on("SIGTERM", () => {
  console.error("[EXIT] received SIGTERM");
});
process.on("SIGINT", () => {
  console.error("[EXIT] received SIGINT");
});

// Load .env before any module reads process.env at require-time.
require("dotenv").config();

const Server = require("./src/app/server");

const server = new Server();

server.listen();
