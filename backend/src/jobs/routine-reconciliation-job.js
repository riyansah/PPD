function startRoutineReconciliationJob({
  routineService,
  logger,
  intervalMs = 60 * 1000,
  autoStart = true
}) {
  let intervalId = null;

  function run() {
    try {
      return routineService.reconcileRoutineHistories();
    } catch (error) {
      if (logger && typeof logger.error === "function") {
        logger.error("routine_reconciliation_failed", {
          message: error.message
        });
      }
      throw error;
    }
  }

  function start() {
    if (intervalId) {
      return intervalId;
    }

    intervalId = setInterval(() => {
      try {
        run();
      } catch (error) {
        // Logged in run().
      }
    }, intervalMs);

    if (typeof intervalId.unref === "function") {
      intervalId.unref();
    }

    return intervalId;
  }

  function stop() {
    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
    intervalId = null;
  }

  if (autoStart) {
    start();
  }

  return {
    run,
    start,
    stop
  };
}

module.exports = {
  startRoutineReconciliationJob
};
