import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "@/components/animate-ui/components/buttons/button";

// Page d'erreur elegante pour remplacer l'errorElement par defaut de React Router.
export default function ErrorPage() {
  const error = useRouteError();

  const statusText =
    isRouteErrorResponse(error) && error.status
      ? `${error.status} ${error.statusText || ""}`.trim()
      : "Une erreur est survenue";

  const description =
    isRouteErrorResponse(error) && error.data && typeof error.data === "object"
      ? (error.data as { message?: string }).message ?? ""
      : error instanceof Error
        ? error.message
        : "";

  return (
    <div className="min-h-screen bg-[#0f0b08] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(192,132,90,0.08),transparent_25%),radial-gradient(circle_at_50%_70%,rgba(255,255,255,0.05),transparent_35%)]" />
        <div className="absolute inset-0 bg-[url('/img/bg-pattern.svg')] opacity-50" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <div className="max-w-2xl w-full space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.7)] backdrop-blur">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-100">
            <span className="h-2 w-2 rounded-full bg-brand-300 shadow-[0_0_0_6px_rgba(192,132,90,0.2)]" />
            WoodTech
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-brand-200/80">Oops</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">
              Quelque chose s&apos;est mal passé
            </h1>
            <p className="mt-3 text-base text-white/70">
              {statusText || "Erreur inattendue"}.
              {description ? ` ${description}` : " Nous allons régler ça rapidement."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} to="/" variant="primary" size="md">
              Retour à l&apos;accueil
            </Button>
            <Button variant="outline" size="md" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
          </div>
        </div>
        <div className="mt-8 text-xs uppercase tracking-[0.3em] text-white/40">
          Atelier WoodTech — Bois noble, design durable.
        </div>
      </div>
    </div>
  );
}
