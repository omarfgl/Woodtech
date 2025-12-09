import mongoose from "mongoose";
import config from "../config/env";
import logger from "../config/logger";

mongoose.set("strictQuery", true);

export const connectDb = async () => {
  try {
    await mongoose.connect(config.db.uri);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to MongoDB");
    throw error;
  }
};

export const disconnectDb = async () => {
  await mongoose.disconnect();
};

export default mongoose;
