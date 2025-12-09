import { useMemo } from "react";
import { useTranslate } from "@/lib/i18n";

// Pied de page partage affichant les infos de contact et d'ouverture.
export default function Footer() {
  const translate = useTranslate();
  // On memorise l'annee courante pour eviter de recalculer a chaque rendu.
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);

  return (
    <footer className="border-t border-white/10 bg-brand-900/80">
      <div className="container grid gap-8 py-10 text-sm text-white/70 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {translate("footer.brand")}
          </h3>
          <p className="mt-3 leading-relaxed">
            {translate("footer.about")}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white">
            {translate("footer.contactTitle")}
          </h4>
          <ul className="mt-3 space-y-1">
            <li>{translate("footer.address")}</li>
            <li>{translate("footer.email")}</li>
            <li>{translate("footer.phone")}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white">
            {translate("footer.hoursTitle")}
          </h4>
          <p className="mt-3 leading-relaxed">
            {translate("footer.hoursWeek")}
            <br />
            {translate("footer.hoursWeekend")}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        {translate("footer.copy", { values: { year: currentYear } })}
      </div>
    </footer>
  );
}
