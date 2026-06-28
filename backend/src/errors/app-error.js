class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_ERROR", field } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}

module.exports = {
  AppError
};
