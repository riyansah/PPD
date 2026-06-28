const crypto = require("node:crypto");
const { promisify } = require("node:util");
const {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SCRYPT_PARAMS
} = require("../constants/auth");

const scryptAsync = promisify(crypto.scrypt);

function validatePasswordStrength(password) {
  if (typeof password !== "string") {
    return "Password is required.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }

  if (!/[a-z]/iu.test(password) || !/[0-9]/u.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  return null;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, PASSWORD_SCRYPT_PARAMS.keyLength, {
    N: PASSWORD_SCRYPT_PARAMS.cost,
    r: PASSWORD_SCRYPT_PARAMS.blockSize,
    p: PASSWORD_SCRYPT_PARAMS.parallelization
  });

  return [
    "scrypt",
    PASSWORD_SCRYPT_PARAMS.cost,
    PASSWORD_SCRYPT_PARAMS.blockSize,
    PASSWORD_SCRYPT_PARAMS.parallelization,
    salt,
    Buffer.from(derivedKey).toString("hex")
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHash] =
    String(storedHash).split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, expectedHash.length / 2, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization)
  });

  const expectedBuffer = Buffer.from(expectedHash, "hex");
  return crypto.timingSafeEqual(Buffer.from(derivedKey), expectedBuffer);
}

module.exports = {
  hashPassword,
  validatePasswordStrength,
  verifyPassword
};
