const { AppError } = require("../errors/app-error");

function requireApiAuth(req, res, next) {
  if (!req.sessionContext || !req.sessionContext.user || !req.sessionContext.session) {
    next(
      new AppError("Authentication is required.", {
        statusCode: 401,
        code: "UNAUTHENTICATED"
      })
    );
    return;
  }

  next();
}

function requirePageAuth(req, res, next) {
  if (!req.sessionContext || !req.sessionContext.user || !req.sessionContext.session) {
    const redirectTarget = `/login?next=${encodeURIComponent(req.originalUrl || "/")}`;
    res.redirect(302, redirectTarget);
    return;
  }

  next();
}

function redirectAuthenticatedUser(req, res, next) {
  if (req.sessionContext && req.sessionContext.user && req.sessionContext.session) {
    res.redirect(302, "/");
    return;
  }

  next();
}

module.exports = {
  redirectAuthenticatedUser,
  requireApiAuth,
  requirePageAuth
};
