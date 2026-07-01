const { createSuccessResponse } = require("../http/response");

function sendDownload(res, file) {
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.setHeader("Content-Length", String(file.body.length));
  res.send(file.body);
}

function createReportController({ reportService }) {
  return {
    exportCsv(req, res, next) {
      try {
        sendDownload(res, reportService.exportCsv(req.sessionContext.user.id, req.query || {}));
      } catch (error) {
        next(error);
      }
    },

    exportPdf(req, res, next) {
      try {
        sendDownload(res, reportService.exportPdf(req.sessionContext.user, req.query || {}));
      } catch (error) {
        next(error);
      }
    },

    getActivities(req, res, next) {
      try {
        const data = reportService.listActivities(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    },

    getRoutines(req, res, next) {
      try {
        const data = reportService.listRoutines(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    },

    getSummary(req, res, next) {
      try {
        const data = reportService.getSummary(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    },

    getTasks(req, res, next) {
      try {
        const data = reportService.listTasks(req.sessionContext.user.id, req.query || {});
        res.json(createSuccessResponse({ requestId: req.requestId, data }));
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createReportController
};
