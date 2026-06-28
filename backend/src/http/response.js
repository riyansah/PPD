const { getServerTimeMeta } = require("../utils/time");

function createSuccessResponse({ data = null, warnings = [], meta = {}, requestId }) {
  return {
    data,
    meta: {
      request_id: requestId,
      ...getServerTimeMeta(),
      ...meta
    },
    errors: [],
    warnings
  };
}

function createErrorResponse({ errors, meta = {}, requestId }) {
  return {
    data: null,
    meta: {
      request_id: requestId,
      ...getServerTimeMeta(),
      ...meta
    },
    errors,
    warnings: []
  };
}

module.exports = {
  createErrorResponse,
  createSuccessResponse
};
