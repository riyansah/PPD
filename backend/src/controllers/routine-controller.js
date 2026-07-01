const { createSuccessResponse } = require("../http/response");

function createRoutineController({ routineService }) {
  return {
    confirmRoutine(req, res, next) {
      try {
        const routineHistory = routineService.confirmRoutine(
          Number(req.params.id),
          req.sessionContext.user.id,
          req.body || {}
        );
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: routineHistory
          })
        );
      } catch (error) {
        next(error);
      }
    },

    createRoutine(req, res, next) {
      try {
        const result = routineService.createRoutine(req.sessionContext.user.id, req.body || {});
        res.status(201).json(
          createSuccessResponse({
            requestId: req.requestId,
            data: result.routine,
            warnings: result.warnings
          })
        );
      } catch (error) {
        next(error);
      }
    },

    deleteRoutine(req, res, next) {
      try {
        const result = routineService.deleteRoutine(Number(req.params.id), req.sessionContext.user.id);
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

    getRoutine(req, res, next) {
      try {
        const routine = routineService.getRoutine(Number(req.params.id), req.sessionContext.user.id);
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: routine
          })
        );
      } catch (error) {
        next(error);
      }
    },

    listRoutines(req, res, next) {
      try {
        const result = routineService.listRoutines(req.sessionContext.user.id, req.query || {});
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

    toggleRoutine(req, res, next) {
      try {
        const routine = routineService.toggleRoutine(
          Number(req.params.id),
          req.sessionContext.user.id,
          req.body || {}
        );
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: routine
          })
        );
      } catch (error) {
        next(error);
      }
    },

    updateRoutine(req, res, next) {
      try {
        const result = routineService.updateRoutine(
          Number(req.params.id),
          req.sessionContext.user.id,
          req.body || {}
        );
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: result.routine,
            warnings: result.warnings
          })
        );
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createRoutineController
};
