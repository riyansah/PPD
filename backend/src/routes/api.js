const express = require("express");
const { createSuccessResponse } = require("../http/response");

function createApiRouter({ env, db }) {
  const router = express.Router();

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
