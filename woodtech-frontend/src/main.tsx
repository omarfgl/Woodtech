import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppProviders } from "./app/providers";

// Point d'entree de l'application front : on monte React et on enveloppe tout avec les providers globaux.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
);
