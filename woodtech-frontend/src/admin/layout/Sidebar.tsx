import { NavLink } from "react-router-dom";
import { useMemo } from "react";

type SidebarProps = {
  open: boolean;
  onNavigate?: () => void;
};

type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/admin" },
  { label: "Produits", to: "/admin/produits" },
  { label: "Commandes", to: "/admin/commandes" }
];

const baseLinkClasses =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

// Navigation laterale du back office (fermeture auto sur mobile).
export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const navLinks = useMemo(
    () =>
      navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              baseLinkClasses,
              isActive
                ? "bg-brand-500/20 text-brand-200 border border-brand-500/30"
                : "text-white/70 hover:text-white hover:bg-white/10"
            ].join(" ")
          }
        >
          <span>{item.label}</span>
        </NavLink>
      )),
    [onNavigate]
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onNavigate}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-brand-900/95 p-5 backdrop-blur transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-8">
          <div className="text-lg font-semibold text-white">WoodTech Admin</div>
          <p className="text-xs text-white/50">Gestion atelier & commandes</p>
        </div>
        <nav className="space-y-2">{navLinks}</nav>
      </aside>
    </>
  );
}
