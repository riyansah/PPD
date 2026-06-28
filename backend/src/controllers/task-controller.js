const { createSuccessResponse } = require("../http/response");

function createTaskController({ taskService }) {
  return {
    createTask(req, res, next) {
      try {
        const task = taskService.createTask(req.sessionContext.user.id, req.body || {});
        res.status(201).json(
          createSuccessResponse({
            requestId: req.requestId,
            data: task
          })
        );
      } catch (error) {
        next(error);
      }
    },

    deleteTask(req, res, next) {
      try {
        const result = taskService.deleteTask(Number(req.params.id), req.sessionContext.user.id);
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: result
          })
        );
      } catch (error) {
        next(error);
      }
    },

    getTask(req, res, next) {
      try {
        const task = taskService.getTask(Number(req.params.id), req.sessionContext.user.id);
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: task
          })
        );
      } catch (error) {
        next(error);
      }
    },

    listTasks(req, res, next) {
      try {
        const result = taskService.listTasks(req.sessionContext.user.id, req.query || {});
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: {
              items: result.items
            },
            meta: {
              pagination: result.pagination
            }
          })
        );
      } catch (error) {
        next(error);
      }
    },

    updateTask(req, res, next) {
      try {
        const task = taskService.updateTask(Number(req.params.id), req.sessionContext.user.id, req.body || {});
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: task
          })
        );
      } catch (error) {
        next(error);
      }
    },

    updateTaskStatus(req, res, next) {
      try {
        const task = taskService.updateTaskStatus(Number(req.params.id), req.sessionContext.user.id, req.body || {});
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: task
          })
        );
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createTaskController
};
