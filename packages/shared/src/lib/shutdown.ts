import type { ServerType } from "@hono/node-server";
import { SHUTDOWN_TIMEOUT } from "../constants";
import { logger } from "./logger";

let isShuttingDown = false;

export const shutdown = (server: ServerType, callback?: Function) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info("Shutting down server...");

  server.close(() => {
    logger.info("Server closed for new connections");
    try {
      if (callback) callback();
      process.exit(0);
    } catch (error) {
      logger.error(`Shutdown failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.info("Force exiting process");
    process.exit(0);
  }, SHUTDOWN_TIMEOUT);
};
