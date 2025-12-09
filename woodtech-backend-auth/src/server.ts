import config from "./config/env";
import logger from "./config/logger";
import app from "./app";
import { connectDb, disconnectDb } from "./db/mongoose";
import User from "./modules/user/user.model";

const ensureExistingUsersVerified = async () => {
  try {
    const result = await User.updateMany(
      { $or: [{ verifiedAt: { $exists: false } }, { verifiedAt: null }] },
      { $set: { verifiedAt: new Date() } }
    );
    if (result.modifiedCount > 0) {
      logger.info({ updated: result.modifiedCount }, "Marked existing users as verified");
    }
  } catch (error) {
    logger.warn({ err: error }, "Failed to mark existing users as verified");
  }
};

const startServer = async () => {
  try {
    await connectDb();
    await ensureExistingUsersVerified();
    const server = app.listen(config.port, () => {
      logger.info(`Auth service listening on port ${config.port}`);
    });

    const shutdown = async () => {
      logger.info("Shutting down server");
      await disconnectDb();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      process.exit(0);
    };

    const handleSignal = (signal: NodeJS.Signals) => {
      logger.info({ signal }, "Received termination signal");
      void shutdown();
    };

    process.on("SIGINT", handleSignal);
    process.on("SIGTERM", handleSignal);
    process.on("unhandledRejection", (reason) => {
      logger.error({ err: reason }, "Unhandled promise rejection");
    });
    process.on("uncaughtException", (error) => {
      logger.error({ err: error }, "Uncaught exception");
      void shutdown().catch(() => process.exit(1));
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

void startServer();
