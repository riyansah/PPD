const express = require("express");
const { createSuccessResponse } = require("../http/response");
const { createAuthRouter } = require("./auth");
const { createTaskRouter } = require("./tasks");
const { createActivityRouter } = require("./activities");
const { createRoutineRouter } = require("./routines");

function createApiRouter({ env, db, authService, taskService, activityService, routineService }) {
  const router = express.Router();

  router.use("/auth", createAuthRouter({ env, authService }));
  router.use("/tasks", createTaskRouter({ taskService }));
  router.use("/activities", createActivityRouter({ activityService }));
  router.use("/routines", createRoutineRouter({ routineService }));

  router.get("/health", (req, res) => {
    const tableCount = db
      .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'")
      .get().count;

    res.json(
      createSuccessResponse({
        requestId: req.requestId,
        data: {
          status: "ok",
          app_name: env.appName,
          environment: env.nodeEnv,
          database: {
            connected: true,
            table_count: tableCount
          }
        }
      })
    );
  });

  router.get("/system/time", (req, res) => {
    res.json(
      createSuccessResponse({
        requestId: req.requestId,
        data: {
          timezone: env.timezone
        }
      })
    );
  });

  return router;
}

module.exports = {
  createApiRouter
};
