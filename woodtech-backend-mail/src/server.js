import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import config from "./config/env.js";
import mailRoutes from "./routes/mailRoutes.js";

// Application Express dediee a la gestion des emails envoyes depuis le front.
const app = express();

// Securisation minimale (CORS, Helmet) et logs HTTP pour diagnostiquer les appels.
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(config.isProduction ? "combined" : "dev"));

// Endpoint de sante pour les sondes de monitoring.
app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

// Toutes les routes de contact passent par /mail.
app.use("/mail", mailRoutes);

// Gestionnaire d'erreurs generique renvoyant un JSON homogene.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || "Erreur serveur",
    },
  });
});

app.listen(config.port, () => {
  console.log(`Mail service listening on port ${config.port}`);
});
