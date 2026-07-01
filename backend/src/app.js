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
const { createTaskRepository } = require("./repositories/task-repository");
const { createDashboardRepository } = require("./repositories/dashboard-repository");
const { createReportRepository } = require("./repositories/report-repository");
const { createActivityRepository } = require("./repositories/activity-repository");
const { createRoutineRepository } = require("./repositories/routine-repository");
const { createAuthService } = require("./services/auth-service");
const { createTaskService } = require("./services/task-service");
const { createDashboardService } = require("./services/dashboard-service");
const { createReportService } = require("./services/report-service");
const { createActivityService } = require("./services/activity-service");
const { createRoutineService } = require("./services/routine-service");
const { startRoutineReconciliationJob } = require("./jobs/routine-reconciliation-job");

function createApp({ env, db, logger, nowProvider, startScheduler = env.nodeEnv !== "test", schedulerIntervalMs }) {
  const app = express();
  const frontendRoot = path.resolve(__dirname, "..", "..", "frontend");
  const userRepository = createUserRepository(db);
  const sessionRepository = createSessionRepository(db);
  const loginRateLimitRepository = createLoginRateLimitRepository(db);
  const taskRepository = createTaskRepository(db);
  const dashboardRepository = createDashboardRepository(db);
  const reportRepository = createReportRepository(db);
  const activityRepository = createActivityRepository(db);
  const routineRepository = createRoutineRepository(db);
  const authService = createAuthService({
    env,
    db,
    logger,
    userRepository,
    sessionRepository,
    loginRateLimitRepository
  });
  const taskService = createTaskService({ taskRepository });
  const activityService = createActivityService({ activityRepository, nowProvider });
  const routineService = createRoutineService({ routineRepository, nowProvider });
  const dashboardService = createDashboardService({ dashboardRepository, routineService, nowProvider });
  const reportService = createReportService({ reportRepository, routineService, nowProvider });

  app.disable("x-powered-by");
  app.use(requestContextMiddleware);
  app.use(requestLoggerMiddleware({ logger }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(createSessionContextMiddleware({ env, sessionRepository, userRepository }));

  app.use("/assets", express.static(path.join(frontendRoot, "assets")));
  app.use("/styles", express.static(path.join(frontendRoot, "styles")));
  app.use("/scripts", express.static(path.join(frontendRoot, "scripts")));
  app.use("/api", createApiRouter({ env, db, authService, dashboardService, reportService, taskService, activityService, routineService }));

  app.get("/login", redirectAuthenticatedUser, (req, res) => {
    res.sendFile(path.join(frontendRoot, "pages", "login.html"));
  });

  app.get(["/", "/dashboard", "/tasks", "/activities", "/routines", "/reports", "/security"], requirePageAuth, (req, res) => {
    res.sendFile(path.join(frontendRoot, "pages", "index.html"));
  });

  app.locals.services = {
    authService,
    dashboardService,
    reportService,
    taskService,
    activityService,
    routineService
  };

  app.locals.jobs = app.locals.jobs || {};
  if (!app.locals.jobs.routineReconciliation) {
    app.locals.jobs.routineReconciliation = startRoutineReconciliationJob({
      routineService,
      logger,
      intervalMs: schedulerIntervalMs,
      autoStart: startScheduler
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware({ logger }));

  return app;
}

module.exports = {
  createApp
};
