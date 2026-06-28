const readline = require("node:readline/promises");
const { stdin, stdout, stderr } = require("node:process");
const { loadEnvFile, createEnv } = require("../config/env");
const { createLogger } = require("../utils/logger");
const { createDatabaseConnection } = require("../db/client");
const { runMigrations } = require("../db/migrate");
const { createUserRepository } = require("../repositories/user-repository");
const { createSessionRepository } = require("../repositories/session-repository");
const { createLoginRateLimitRepository } = require("../repositories/login-rate-limit-repository");
const { createAuthService } = require("../services/auth-service");

async function readInput(env) {
  if (env.setupUsername && env.setupEmail && env.setupDisplayName && env.setupPassword) {
    return {
      username: env.setupUsername,
      email: env.setupEmail,
      displayName: env.setupDisplayName,
      password: env.setupPassword
    };
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const username = await rl.question("Username: ");
    const email = await rl.question("Email: ");
    const displayName = await rl.question("Display name: ");
    const password = await rl.question("Password: ");

    return {
      username,
      email,
      displayName,
      password
    };
  } finally {
    rl.close();
  }
}

async function main() {
  loadEnvFile();
  const env = createEnv();
  const logger = createLogger({ level: env.logLevel });

  runMigrations({ databasePath: env.databasePath, logger });
  const db = createDatabaseConnection(env.databasePath);

  try {
    const authService = createAuthService({
      env,
      db,
      logger,
      userRepository: createUserRepository(db),
      sessionRepository: createSessionRepository(db),
      loginRateLimitRepository: createLoginRateLimitRepository(db)
    });

    const input = await readInput(env);
    const user = await authService.setupInitialAccount(input);
    stdout.write(`Initial account created for ${user.username}.\n`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  main,
  readInput
};
