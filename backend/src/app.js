const path = require("node:path");
const express = require("express");
const { requestContextMiddleware } = require("./middleware/request-context");
const { requestLoggerMiddleware } = require("./middleware/request-logger");
const { errorHandlerMiddleware } = require("./middleware/error-handler");
const { notFoundMiddleware } = require("./middleware/not-found");
const { createApiRouter } = require("./routes/api");

function createApp({ env, db, logger }) {
  const app = express();
  const frontendRoot = path.resolve(__dirname, "..", "..", "frontend");

  app.disable("x-powered-by");
  app.use(requestContextMiddleware);
  app.use(requestLoggerMiddleware({ logger }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/assets", express.static(path.join(frontendRoot, "assets")));
  app.use("/styles", express.static(path.join(frontendRoot, "styles")));
  app.use("/scripts", express.static(path.join(frontendRoot, "scripts")));
  app.use("/api", createApiRouter({ env, db }));
  app.use(express.static(path.join(frontendRoot, "pages")));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(path.join(frontendRoot, "pages", "index.html"));
  });

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware({ logger }));

  return app;
}

module.exports = {
  createApp
};
