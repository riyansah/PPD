const express = require("express");
const { requireApiAuth } = require("../middleware/authentication");
const { createTaskController } = require("../controllers/task-controller");

function createTaskRouter(dependencies) {
  const router = express.Router();
  const controller = createTaskController(dependencies);

  router.use(requireApiAuth);
  router.get("/", controller.listTasks);
  router.post("/", controller.createTask);
  router.get("/:id", controller.getTask);
  router.put("/:id", controller.updateTask);
  router.delete("/:id", controller.deleteTask);
  router.patch("/:id/status", controller.updateTaskStatus);

  return router;
}

module.exports = {
  createTaskRouter
};
