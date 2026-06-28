const path = require("node:path");
const express = require("express");
const { requestContextMiddleware } = require("./middleware/request-context");
const { requestLoggerMiddleware } = require("./middleware/request-logger");
const { errorHandlerMiddleware } = require("./middleware/error-handler");
const { notFoundMiddleware } = require("./middleware/not-found");
const { createApiRouter } = require("./routes/api");
const { createSessionContextMiddleware } = require("./middleware/session-context");
const {
  redirectAuthenticatedUser,
  requirePageAuth
} = require("./middleware/authentication");
const { createUserRepository } = require("./repositories/user-repository");
const { createSessionRepository } = require("./repositories/session-repository");
const { createLoginRateLimitRepository } = require("./repositories/login-rate-limit-repository");
const { createAuthService } = require("./services/auth-service");

function createApp({ env, db, logger }) {
  const app = express();
  const frontendRoot = path.resolve(__dirname, "..", "..", "frontend");
  const userRepository = createUserRepository(db);
  const sessionRepository = createSessionRepository(db);
  const authService = createAuthService({
    env,
    db,
    logger,
    userRepository,
    sessionRepository,
    loginRateLimitRepository: createLoginRateLimitRepository(db)
  });

  app.disable("x-powered-by");
  app.use(requestContextMiddleware);
  app.use(requestLoggerMiddleware({ logger }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(createSessionContextMiddleware({ env, sessionRepository, userRepository }));

  app.use("/assets", express.static(path.join(frontendRoot, "assets")));
  app.use("/styles", express.static(path.join(frontendRoot, "styles")));
  app.use("/scripts", express.static(path.join(frontendRoot, "scripts")));
  app.use("/api", createApiRouter({ env, db, authService }));

  app.get("/login", redirectAuthenticatedUser, (req, res) => {
    res.sendFile(path.join(frontendRoot, "pages", "login.html"));
  });

  app.get("/", requirePageAuth, (req, res) => {
    res.sendFile(path.join(frontendRoot, "pages", "index.html"));
  });

  app.get("/security", requirePageAuth, (req, res) => {
    res.sendFile(path.join(frontendRoot, "pages", "index.html"));
  });

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware({ logger }));

  return app;
}

module.exports = {
  createApp
};
