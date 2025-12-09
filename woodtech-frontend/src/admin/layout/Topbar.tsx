type TopbarProps = {
  onToggleSidebar: () => void;
  onLogout: () => void;
};

// Bandeau superieur : bouton burger (mobile) et action deconnexion.
export default function Topbar({ onToggleSidebar, onLogout }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-brand-900/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/80 transition-colors hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Ouvrir la navigation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-brand-200">
            WoodTech
          </p>
          <h1 className="text-lg font-semibold text-white">Espace administrateur</h1>
        </div>
      </div>
      <button
        type="button"
        className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        onClick={onLogout}
      >
        Déconnexion
      </button>
    </header>
  );
}
