const { createErrorResponse } = require("../http/response");

function errorHandlerMiddleware({ logger }) {
  return function errorHandler(error, req, res, next) {
    if (res.headersSent) {
      next(error);
      return;
    }

    const statusCode = error.statusCode || 500;
    const code = error.code || "INTERNAL_ERROR";
    const isServerError = statusCode >= 500;
    const errors = Array.isArray(error.details) && error.details.length > 0
      ? error.details
      : [
          {
            code,
            message: isServerError ? "An unexpected error occurred." : error.message,
            ...(error.field ? { field: error.field } : {})
          }
        ];

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
        meta: error.meta || {},
        errors: isServerError
          ? [
              {
                code,
                message: "An unexpected error occurred."
              }
            ]
          : errors
      })
    );
  };
}

module.exports = {
  errorHandlerMiddleware
};
