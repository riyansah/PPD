const { createErrorResponse } = require("../http/response");

function notFoundMiddleware(req, res) {
  res.status(404).json(
    createErrorResponse({
      requestId: req.requestId,
      errors: [
        {
          code: "NOT_FOUND",
          message: "Resource not found."
        }
      ]
    })
  );
}

module.exports = {
  notFoundMiddleware
};
