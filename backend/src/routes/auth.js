const express = require("express");
const { createAuthController } = require("../controllers/auth-controller");
const { requireApiAuth } = require("../middleware/authentication");

function createAuthRouter(dependencies) {
  const router = express.Router();
  const controller = createAuthController(dependencies);

  router.post("/login", controller.login);
  router.post("/logout", requireApiAuth, controller.logout);
  router.get("/session", requireApiAuth, controller.getSession);
  router.put("/password", requireApiAuth, controller.updatePassword);

  return router;
}

module.exports = {
  createAuthRouter
};
