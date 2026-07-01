const { createSuccessResponse } = require("../http/response");

function createDashboardController({ dashboardService }) {
  return {
    getCharts(req, res, next) {
      try {
        const data = dashboardService.getCharts(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    },

    getDeadlines(req, res, next) {
      try {
        const data = dashboardService.getDeadlines(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    },

    getSummary(req, res, next) {
      try {
        const data = dashboardService.getSummary(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    },

    getToday(req, res, next) {
      try {
        const data = dashboardService.getToday(req.sessionContext.user.id);
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createDashboardController
};
