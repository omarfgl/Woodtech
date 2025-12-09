import cors, { CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import pinoHttp from "pino-http";
import config from "./config/env";
import logger from "./config/logger";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import openapiDocument from "./docs/openapi.json";
import { ForbiddenError } from "./utils/errors";

const app = express();

app.set("trust proxy", 1);

const corsOrigins = config.cors.origins;
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ForbiddenError("Not allowed by CORS"), false);
  },
  credentials: true
};
app.use(cors(corsOptions));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  pinoHttp({
    logger
  })
);

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/auth", authRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use(errorHandler);

export default app;
