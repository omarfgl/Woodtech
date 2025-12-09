import { useRoutes } from "react-router-dom";
import { adminRoutes } from "./routes";

// Equivalent d'App.tsx mais dedie a l'espace administrateur.
export default function AppAdmin() {
  const element = useRoutes(adminRoutes);
  return element;
}
