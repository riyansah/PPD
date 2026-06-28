const { createErrorResponse } = require("../http/response");

function errorHandlerMiddleware({ logger }) {
  return function errorHandler(error, req, res, next) {
    if (res.headersSent) {
      next(error);
      return;
    }

    const statusCode = error.statusCode || 500;
    const code = error.code || "INTERNAL_ERROR";
    const message = statusCode >= 500 ? "An unexpected error occurred." : error.message;

    logger.error("request_failed", {
      request_id: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status_code: statusCode,
      error_code: code,
      error_message: error.message,
      stack: error.stack
    });

    res.status(statusCode).json(
      createErrorResponse({
        requestId: req.requestId,
        errors: [
          {
            code,
            message,
            ...(error.field ? { field: error.field } : {})
          }
        ]
      })
    );
  };
}

module.exports = {
  errorHandlerMiddleware
};
