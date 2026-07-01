const { createSuccessResponse } = require("../http/response");

function createActivityController({ activityService }) {
  return {
    createActivity(req, res, next) {
      try {
        const result = activityService.createActivity(req.sessionContext.user.id, req.body || {});
        res.status(201).json(
          createSuccessResponse({
            requestId: req.requestId,
            data: result.activity,
            warnings: result.warnings
          })
        );
      } catch (error) {
        next(error);
      }
    },

    deleteActivity(req, res, next) {
      try {
        const result = activityService.deleteActivity(Number(req.params.id), req.sessionContext.user.id);
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

    getActivity(req, res, next) {
      try {
        const activity = activityService.getActivity(Number(req.params.id), req.sessionContext.user.id);
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: activity
          })
        );
      } catch (error) {
        next(error);
      }
    },

    listActivities(req, res, next) {
      try {
        const result = activityService.listActivities(req.sessionContext.user.id, req.query || {});
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

    updateActivity(req, res, next) {
      try {
        const result = activityService.updateActivity(Number(req.params.id), req.sessionContext.user.id, req.body || {});
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: result.activity,
            warnings: result.warnings
          })
        );
      } catch (error) {
        next(error);
      }
    },

    updateActivityStatus(req, res, next) {
      try {
        const result = activityService.updateActivityStatus(Number(req.params.id), req.sessionContext.user.id, req.body || {});
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: result.activity,
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
  createActivityController
};
