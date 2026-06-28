const crypto = require("node:crypto");

function requestContextMiddleware(req, res, next) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

module.exports = {
  requestContextMiddleware
};
