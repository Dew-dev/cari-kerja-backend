process.on("uncaughtException", (err) => {
  console.error("[CRASH] uncaughtException:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[CRASH] unhandledRejection:", reason);
  process.exit(1);
});

const Server = require("./src/app/server");

const server = new Server();

server.listen();
