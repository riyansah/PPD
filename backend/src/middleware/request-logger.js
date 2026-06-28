function requestLoggerMiddleware({ logger }) {
  return function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      logger.info("request_completed", {
        request_id: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status_code: res.statusCode,
        duration_ms: Number(durationMs.toFixed(2))
      });
    });

    next();
  };
}

module.exports = {
  requestLoggerMiddleware
};
