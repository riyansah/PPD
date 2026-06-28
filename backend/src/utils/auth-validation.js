const { EMAIL_REGEX, USERNAME_REGEX } = require("../constants/auth");
const { validatePasswordStrength } = require("./passwords");

function normalizeLoginIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function validateUsername(username) {
  const normalized = normalizeLoginIdentifier(username);

  if (!normalized) {
    return "Username is required.";
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return "Username must be 3-32 characters using letters, numbers, dots, underscores, or hyphens.";
  }

  return null;
}

function validateEmail(email) {
  const normalized = normalizeLoginIdentifier(email);

  if (!normalized) {
    return "Email is required.";
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return "Email must be valid.";
  }

  return null;
}

function validateDisplayName(displayName) {
  const normalized = String(displayName || "").trim();

  if (!normalized) {
    return "Display name is required.";
  }

  if (normalized.length > 80) {
    return "Display name must be at most 80 characters.";
  }

  return null;
}

function validateSetupInput({ username, email, displayName, password }) {
  return [
    ["username", validateUsername(username)],
    ["email", validateEmail(email)],
    ["display_name", validateDisplayName(displayName)],
    ["password", validatePasswordStrength(password)]
  ]
    .filter(([, message]) => message)
    .map(([field, message]) => ({
      code: "VALIDATION_ERROR",
      field,
      message
    }));
}

function validateLoginInput({ login, password }) {
  const errors = [];

  if (!normalizeLoginIdentifier(login)) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "login",
      message: "Login is required."
    });
  }

  if (typeof password !== "string" || password.length === 0) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "password",
      message: "Password is required."
    });
  }

  return errors;
}

function validatePasswordChangeInput({ currentPassword, newPassword, confirmPassword }) {
  const errors = [];

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "current_password",
      message: "Current password is required."
    });
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "new_password",
      message: strengthError
    });
  }

  if (newPassword !== confirmPassword) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "confirm_password",
      message: "Password confirmation does not match."
    });
  }

  if (
    typeof currentPassword === "string" &&
    typeof newPassword === "string" &&
    currentPassword.length > 0 &&
    currentPassword === newPassword
  ) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "new_password",
      message: "New password must be different from the current password."
    });
  }

  return errors;
}

module.exports = {
  normalizeLoginIdentifier,
  validateLoginInput,
  validatePasswordChangeInput,
  validateSetupInput
};
