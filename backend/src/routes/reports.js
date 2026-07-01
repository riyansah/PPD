const express = require("express");
const { requireApiAuth } = require("../middleware/authentication");
const { createReportController } = require("../controllers/report-controller");

function createReportRouter(dependencies) {
  const router = express.Router();
  const controller = createReportController(dependencies);

  router.use(requireApiAuth);
  router.get("/summary", controller.getSummary);
  router.get("/tasks", controller.getTasks);
  router.get("/activities", controller.getActivities);
  router.get("/routines", controller.getRoutines);
  router.get("/export/pdf", controller.exportPdf);
  router.get("/export/csv", controller.exportCsv);

  return router;
}

module.exports = {
  createReportRouter
};
