import { useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { adminTokenStorage } from "../guard";
import { useAuth } from "../../store/auth";

// Layout de base pour toutes les pages admin (sidebar + topbar + zone de contenu).
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Nettoyage des sessions admin + utilisateur puis redirection vers la page de connexion.
  const handleLogout = useCallback(() => {
    adminTokenStorage.clear();
    // Déconnexion côté front public (tokens + session API).
    logout().finally(() => {
      navigate("/connexion", { replace: true });
    });
  }, [logout, navigate]);

  return (
    <div className="flex min-h-screen bg-brand-900 text-white">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
