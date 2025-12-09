import pino from "pino";
import config from "./env";

const logger = pino({
  level: config.isProduction ? "info" : "debug",
  redact: {
    paths: ["req.headers.authorization", "password", "passwordHash", "token"],
    remove: true
  }
});

export default logger;
