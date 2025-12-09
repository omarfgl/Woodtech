import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import config from "./config/env.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import { HttpError } from "./utils/httpError.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(config.isProduction ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/assistant", assistantRoutes);

// 404 handler
app.use((_req, res, _next) => {
  res.status(404).json({
    success: false,
    error: { message: "Not found" }
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  const status = err instanceof HttpError && err.status ? err.status : 500;
  const message = err instanceof Error && err.message ? err.message : "Erreur serveur";
  if (!config.isProduction) {
    console.error(err);
  }
  res.status(status).json({
    success: false,
    error: { message }
  });
});

app.listen(config.port, () => {
  console.log(`AI assistant service listening on port ${config.port}`);
});
