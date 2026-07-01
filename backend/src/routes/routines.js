const express = require("express");
const { requireApiAuth } = require("../middleware/authentication");
const { createRoutineController } = require("../controllers/routine-controller");

function createRoutineRouter(dependencies) {
  const router = express.Router();
  const controller = createRoutineController(dependencies);

  router.use(requireApiAuth);
  router.get("/", controller.listRoutines);
  router.post("/", controller.createRoutine);
  router.get("/:id", controller.getRoutine);
  router.put("/:id", controller.updateRoutine);
  router.delete("/:id", controller.deleteRoutine);
  router.patch("/:id/toggle", controller.toggleRoutine);
  router.post("/:id/confirm", controller.confirmRoutine);

  return router;
}

module.exports = {
  createRoutineRouter
};
