import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useLang } from "@/store/lang";
import { useTranslate, type TranslationKey } from "@/lib/i18n";
import { useTheme } from "@/store/theme";
import { Button } from "@/components/animate-ui/components/buttons/button";

// Utilitaire pour appliquer un style actif/inactif sur les liens du menu.
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "transition-colors",
    isActive ? "text-brand-200" : "hover:text-brand-200 text-white/80"
  ].join(" ");

// Barre de navigation principale : liens, langue, theme et session utilisateur.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();
  const translate = useTranslate();
  const { theme, toggleTheme } = useTheme();

  const currentThemeKey: TranslationKey =
    theme === "noyer" ? "navbar.theme.noyer" : "navbar.theme.frene";
  const nextThemeKey: TranslationKey =
    theme === "noyer" ? "navbar.theme.frene" : "navbar.theme.noyer";
  const themeChipColor = theme === "noyer" ? "#4a2a17" : "#f3d9b1";

  // On nettoie la session puis on revient a la page d'accueil.
  const handleLogout = () => {
    void logout().finally(() => {
      navigate("/");
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-900/80 backdrop-blur border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/img/logo.png" alt="WoodTech" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <NavLink to="/catalogue" className={navLinkClass}>
              {translate("navbar.realisations")}
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              {translate("navbar.contact")}
            </NavLink>
            <NavLink to="/assistant" className={navLinkClass}>
              {translate("navbar.assistant")}
            </NavLink>
            {user ? (
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/70">
                <span className="hidden sm:inline tracking-normal capitalize text-white/70">
                  {translate("navbar.greeting")}{" "}
                  <span className="font-semibold text-white">{user.name}</span>
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/25 bg-white/5 text-xs font-medium uppercase tracking-[0.25em]"
                >
                  {translate("navbar.logout")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em]">
                <NavLink to="/connexion" className={navLinkClass}>
                  {translate("navbar.login")}
                </NavLink>
                <NavLink
                  to="/inscription"
                  className={({ isActive }) =>
                    [
                      "rounded-lg border px-3 py-1 transition-colors",
                      isActive
                        ? "border-brand-300 text-brand-200"
                        : "border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                    ].join(" ")
                  }
                >
                  {translate("navbar.signup")}
                </NavLink>
              </div>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === "frene"}
              aria-label={translate("navbar.switchTheme", {
                values: { theme: translate(nextThemeKey) }
              })}
              variant="secondary"
              size="sm"
              className="rounded-lg border-white/25 text-xs font-medium uppercase tracking-[0.25em]"
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full border border-white/30 shadow-inner shadow-black/20"
                style={{ background: themeChipColor }}
              />
              {translate(currentThemeKey)}
            </Button>
            <Button
              type="button"
              onClick={toggleLang}
              variant="secondary"
              size="sm"
              className="rounded-lg border-white/25 text-xs font-semibold uppercase tracking-[0.25em]"
              aria-label={
                lang === "fr"
                  ? translate("navbar.switchToEn")
                  : translate("navbar.switchToFr")
              }
            >
              {lang.toUpperCase()}
            </Button>
            <Button
              as={Link}
              to="/panier"
              variant="primary"
              size="md"
              className="rounded-full border-brand-400/70 bg-brand-500/20 px-4 text-xs font-semibold uppercase tracking-[0.22em]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 text-brand-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="18.5" r="1.2" />
                <circle cx="17" cy="18.5" r="1.2" />
                <path d="M6 6 4.3 3.5H2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{translate("navbar.cart")}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}


