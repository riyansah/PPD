const express = require("express");
const { requireApiAuth } = require("../middleware/authentication");
const { createDashboardController } = require("../controllers/dashboard-controller");

function createDashboardRouter(dependencies) {
  const router = express.Router();
  const controller = createDashboardController(dependencies);

  router.use(requireApiAuth);
  router.get("/summary", controller.getSummary);
  router.get("/today", controller.getToday);
  router.get("/deadlines", controller.getDeadlines);
  router.get("/charts", controller.getCharts);

  return router;
}

module.exports = {
  createDashboardRouter
};
