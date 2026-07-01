const express = require("express");
const { requireApiAuth } = require("../middleware/authentication");
const { createActivityController } = require("../controllers/activity-controller");

function createActivityRouter(dependencies) {
  const router = express.Router();
  const controller = createActivityController(dependencies);

  router.use(requireApiAuth);
  router.get("/", controller.listActivities);
  router.post("/", controller.createActivity);
  router.get("/:id", controller.getActivity);
  router.put("/:id", controller.updateActivity);
  router.delete("/:id", controller.deleteActivity);
  router.patch("/:id/status", controller.updateActivityStatus);

  return router;
}

module.exports = {
  createActivityRouter
};
