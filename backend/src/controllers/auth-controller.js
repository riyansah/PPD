const { createSuccessResponse } = require("../http/response");
const { serializeCookie } = require("../utils/cookies");

function getCookieOptions(env) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: env.isProduction
  };
}

function createAuthController({ env, authService }) {
  function setSessionCookie(res, sessionId, maxAgeSeconds) {
    res.setHeader(
      "Set-Cookie",
      serializeCookie(env.sessionCookieName, sessionId, {
        ...getCookieOptions(env),
        maxAge: maxAgeSeconds
      })
    );
  }

  function clearSessionCookie(res) {
    res.setHeader(
      "Set-Cookie",
      serializeCookie(env.sessionCookieName, "", {
        ...getCookieOptions(env),
        expires: new Date(0),
        maxAge: 0
      })
    );
  }

  return {
    async login(req, res, next) {
      try {
        const result = await authService.login({
          login: req.body.login,
          password: req.body.password,
          request: req,
          currentSessionId: req.sessionContext ? req.sessionContext.sessionId : null
        });

        setSessionCookie(res, result.session.id, env.sessionAbsoluteTtlSeconds);
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: {
              user: result.user,
              session: {
                expires_at: result.session.expires_at,
                idle_expires_at: result.session.idle_expires_at
              }
            }
          })
        );
      } catch (error) {
        next(error);
      }
    },

    logout(req, res, next) {
      try {
        authService.logout(req.sessionContext ? req.sessionContext.sessionId : null);
        clearSessionCookie(res);
        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: {
              logged_out: true
            }
          })
        );
      } catch (error) {
        next(error);
      }
    },

    getSession(req, res) {
      res.json(
        createSuccessResponse({
          requestId: req.requestId,
          data: {
            authenticated: true,
            user: authService.toSafeUser(req.sessionContext.user),
            session: {
              expires_at: req.sessionContext.session.expires_at,
              idle_expires_at: req.sessionContext.session.idle_expires_at
            }
          }
        })
      );
    },

    async updatePassword(req, res, next) {
      try {
        await authService.changePassword({
          userId: req.sessionContext.user.id,
          currentSessionId: req.sessionContext.session.id,
          currentPassword: req.body.current_password,
          newPassword: req.body.new_password,
          confirmPassword: req.body.confirm_password,
          request: req
        });

        res.json(
          createSuccessResponse({
            requestId: req.requestId,
            data: {
              updated: true
            }
          })
        );
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createAuthController
};
