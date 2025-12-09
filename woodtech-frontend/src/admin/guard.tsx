import { Navigate, Outlet, useLocation } from "react-router-dom";

export const ADMIN_TOKEN_KEY = "woodtech-admin-token";

// Petit utilitaire pour stocker/retirer le token admin de demonstration.
export const adminTokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};

export function isAuthenticated() {
  return Boolean(adminTokenStorage.get());
}

// Route guard simple qui redirige vers /connexion si aucun token admin n'est trouve.
export function RequireAuth() {
  const location = useLocation();
  const token = adminTokenStorage.get();

  if (!token) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
