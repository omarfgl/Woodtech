import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslate } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { Catalogue } from "../lib/api";
import type { Product } from "../types";
import { Button } from "@/components/animate-ui/components/buttons/button";

type WoodType = {
  nameKey: TranslationKey;
  image: string;
  traitKeys: TranslationKey[];
  noteKey: TranslationKey;
};

type Advantage = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
};

// Projects are fetched from the backend; see Product type

// Section descriptive des essences de bois mises a l'honneur.
const woodTypes: WoodType[] = [
  {
    nameKey: "home.materials.oak.name",
    image: "/img/chene-bois.avif",
    traitKeys: [
      "home.materials.oak.trait.durability",
      "home.materials.oak.trait.texture",
      "home.materials.oak.trait.resistance"
    ],
    noteKey: "home.materials.oak.note"
  },
  {
    nameKey: "home.materials.walnut.name",
    image: "/img/noyer-bois.avif",
    traitKeys: [
      "home.materials.walnut.trait.grain",
      "home.materials.walnut.trait.touch",
      "home.materials.walnut.trait.stability"
    ],
    noteKey: "home.materials.walnut.note"
  },
  {
    nameKey: "home.materials.ash.name",
    image: "/img/frene-bois.avif",
    traitKeys: [
      "home.materials.ash.trait.flexibility",
      "home.materials.ash.trait.lightness",
      "home.materials.ash.trait.finish"
    ],
    noteKey: "home.materials.ash.note"
  }
];

// Liste des arguments commerciaux repetes plus bas dans la page.
const advantages: Advantage[] = [
  {
    titleKey: "home.advantages.inHouse.title",
    descriptionKey: "home.advantages.inHouse.description"
  },
  {
    titleKey: "home.advantages.sustainable.title",
    descriptionKey: "home.advantages.sustainable.description"
  },
  {
    titleKey: "home.advantages.fairPricing.title",
    descriptionKey: "home.advantages.fairPricing.description"
  }
];

// Jeux de cartes de secours lorsque l'API catalogue ne repond pas.
const fallbackProjects: Product[] = [
  {
    id: "demo-table",
    title: "Table signature en chene",
    description: "Plateau massif 40 mm, pieds trapeze acier patine.",
    price: 3200,
    imageUrl: "/img/table-chene.jpg",
    category: "tables"
  },
  {
    id: "demo-porte",
    title: "Porte interieure en noyer",
    description: "Assemblage traditionnel, charnieres invisibles et teinte chaude.",
    price: 1800,
    imageUrl: "/img/porte-noyer.jpg",
    category: "portes"
  },
  {
    id: "demo-armoire",
    title: "Armoire rustique sur mesure",
    description: "Deux portes, rangement modulable et finition huile naturelle.",
    price: 2700,
    imageUrl: "/img/armoire-rustique.webp",
    category: "armoires"
  },
  {
    id: "demo-escalier",
    title: "Escalier signature WoodTech",
    description: "Marches suspendues, garde-corps verre et structure cachee.",
    price: 9800,
    imageUrl: "/img/hero.webp",
    category: "autres"
  }
];

const FEATURED_COUNT = 4;
const PROJECTS_PER_PAGE = 3;
// featuredProjects computed from DB results inside component

// Page d'accueil : hero, slider de realisations, matieres, formulaire express, etc.
export default function Home() {
  const translate = useTranslate();
  // Hooks d'etat utilises pour le carrousel, la pagination et les formulaires.
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [projects, setProjects] = useState<Product[]>([]);
  // Chargement initial des projets via API puis fallback local.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await Catalogue.list();
        if (!active) return;
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        /* Best-effort fetch; fallbackProjects keep the UI populated */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // On bascule automatiquement sur les donnees statiques si l'API n'a rien renvoye.
  const catalogueProjects = projects.length ? projects : fallbackProjects;

  // Selection des projets "mis en avant" pour le hero.
  const featuredProjects = useMemo(
    () => catalogueProjects.slice(0, FEATURED_COUNT),
    [catalogueProjects]
  );

  // Projet actuellement affiche dans le carrousel.
  const activeFeatured = useMemo(() => {
    if (!featuredProjects.length) return null;
    const safeIndex =
      (featuredIndex % featuredProjects.length + featuredProjects.length) %
      featuredProjects.length;
    return featuredProjects[safeIndex];
  }, [featuredIndex, featuredProjects]);

  const pageCount = Math.max(1, Math.ceil(catalogueProjects.length / PROJECTS_PER_PAGE));
  // Pagination de la section portfolio.
  const visibleProjects = useMemo(() => {
    const start = page * PROJECTS_PER_PAGE;
    return catalogueProjects.slice(start, start + PROJECTS_PER_PAGE);
  }, [page, catalogueProjects]);

  const nextFeatured = () => {
    if (!featuredProjects.length) return;
    setFeaturedIndex((index) => (index + 1) % featuredProjects.length);
  };
  const previousFeatured = () => {
    if (!featuredProjects.length) return;
    setFeaturedIndex((index) =>
      index === 0 ? featuredProjects.length - 1 : index - 1
    );
  };

  const goToPage = (target: number) => {
    if (target < 0 || target >= pageCount) return;
    setPage(target);
  };

  const nextPage = () => goToPage(page + 1);
  const previousPage = () => goToPage(page - 1);

  return (
    <div className="space-y-24 pb-24">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/img/bg-logs.jpg')] bg-cover bg-center opacity-40" />
          <div className="absolute inset-0 bg-[url('/img/bg-pattern.svg')] opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-brand-900/70 to-brand-900" />
        </div>
        <div className="relative container py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-brand-900/80 p-10 shadow-2xl shadow-black/40 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.5em] text-brand-200">
                {translate("home.hero.tagline")}
              </p>
              <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
                {translate("home.hero.title")}
              </h1>
              <p className="mt-6 text-lg text-white/80">
                {translate("home.hero.description.prefix")}{" "}
                <span className="text-brand-200 font-semibold">
                  {translate("home.hero.description.price")}
                </span>{" "}
                {translate("home.hero.description.unit")}
                <sup>3</sup>.{" "}
                {translate("home.hero.description.details")}
              </p>
              <div className="mt-10 flex gap-4">
                <Button
                  as={Link}
                  to="/catalogue"
                  variant="primary"
                  size="lg"
                >
                  {translate("home.hero.cta")}
                </Button>
                <Button
                  as={Link}
                  to="/contact"
                  variant="outline"
                  size="lg"
                  className="text-white/80"
                >
                  {translate("home.hero.secondaryCta")}
                </Button>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-[3rem] bg-brand-800/40 blur-3xl" />
              <div className="relative grid gap-6 sm:grid-cols-2">
                {featuredProjects.map((project, index) => (
                  <button
                    key={project.id || `${project.title}-${index}`}
                    type="button"
                    onClick={() => setFeaturedIndex(index)}
                    className={`rounded-3xl border border-white/10 bg-black/30 p-4 text-left shadow-xl backdrop-blur transition-transform ${
                      featuredIndex === index
                        ? "translate-y-0 ring-1 ring-brand-300"
                        : "translate-y-4 opacity-80 hover:-translate-y-1"
                    }`}
                  >
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="h-32 w-full rounded-2xl object-cover"
                    />
                    <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs text-white/60 line-clamp-2">
                      {project.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-12">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-200">
            {translate("home.materials.sectionTag")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {translate("home.materials.sectionTitle")}
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {woodTypes.map((wood) => (
            <article
              key={wood.nameKey}
              className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur"
            >
              <img
                src={wood.image}
                alt={translate(wood.nameKey)}
                className="h-32 w-full rounded-2xl object-cover"
              />
              <h3 className="mt-4 text-xl font-semibold text-white">
                {translate(wood.nameKey)}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {wood.traitKeys.map((traitKey) => (
                  <li key={traitKey} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                    {translate(traitKey)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-brand-200">
                {translate(wood.noteKey)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {activeFeatured && (
        <section className="container grid gap-10 lg:grid-cols-[1fr,1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-10 shadow-xl shadow-black/30 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-200">
              {translate("home.featured.sectionTag")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              {translate("home.featured.sectionTitle")}
            </h2>
            <p className="mt-4 text-sm text-white/70">
              {translate("home.featured.description")}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button
                onClick={previousFeatured}
                aria-label={translate("home.featured.previous")}
                type="button"
                variant="outline"
                size="icon"
                className="text-white/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm uppercase tracking-[0.3em] text-white/60">
                {String((featuredIndex % featuredProjects.length) + 1).padStart(
                  2,
                  "0"
                )}
                /{String(featuredProjects.length).padStart(2, "0")}
              </span>
              <Button
                onClick={nextFeatured}
                aria-label={translate("home.featured.next")}
                type="button"
                variant="outline"
                size="icon"
                className="text-white/80"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
            <img
              src={activeFeatured.imageUrl}
              alt={activeFeatured.title}
              className="h-[420px] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h3 className="text-xl font-semibold text-white">
                {activeFeatured.title}
              </h3>
              <p className="mt-2 text-sm text-white/70">
                {activeFeatured.description}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="container space-y-10">
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-200">
              {translate("home.portfolio.sectionTag")}
            </p>
            <h2 className="text-3xl font-semibold text-white">
              {translate("home.portfolio.sectionTitle")}
            </h2>
          </div>
          <p className="text-sm text-white/60 sm:max-w-lg">
            {translate("home.portfolio.description")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <article
              key={project.id || `${project.title}-${index}`}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-brand-900/70 shadow-xl shadow-black/30 backdrop-blur transition-transform hover:-translate-y-1"
            >
              <img
                src={project.imageUrl}
                alt={project.title}
                className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {project.description}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={previousPage}
              disabled={page === 0}
              variant="outline"
              size="sm"
              className="text-white/80"
            >
              {translate("pagination.previous")}
            </Button>
            <Button
              type="button"
              onClick={nextPage}
              disabled={page === pageCount - 1}
              variant="outline"
              size="sm"
              className="text-white/80"
            >
              {translate("pagination.next")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToPage(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === page
                    ? "bg-brand-300 w-6"
                    : "bg-white/30 hover:bg-white/60"
                }`}
                aria-label={translate("pagination.goToPage", {
                  values: { page: String(index + 1) }
                })}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-10 shadow-xl shadow-black/30 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-200">
            {translate("home.advantages.sectionTag")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {translate("home.advantages.sectionTitle")}
          </h2>
          <div className="mt-6 space-y-6">
            {advantages.map((item) => (
              <div key={item.titleKey}>
                <h3 className="text-lg font-semibold text-white">
                  {translate(item.titleKey)}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {translate(item.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
          <Button
            as={Link}
            to="/contact"
            variant="primary"
            size="md"
            className="mt-10"
          >
            {translate("home.advantages.consultationCta")}
          </Button>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
          <img
            src="/img/hero.webp"
            alt="Escalier WoodTech"
            className="h-full max-h-[460px] w-full object-cover"
          />
        </div>
      </section>

      <section className="container grid items-stretch gap-10 lg:grid-cols-[1fr,1fr]">
        <div className="flex h-full min-h-[420px] flex-col rounded-3xl border border-white/10 bg-brand-900/70 p-8 md:p-10 shadow-xl shadow-black/30 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-200">
            {translate("home.about.sectionTag")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {translate("home.about.sectionTitle")}
          </h2>
          <p className="mt-4 text-sm text-white/70">
            {translate("home.about.description")}
          </p>
          <div className="mt-6 grid gap-4 text-sm text-white/70 md:grid-cols-2">
            <p>{translate("home.about.point.design")}</p>
            <p>{translate("home.about.point.installation")}</p>
            <p>{translate("home.about.point.finish")}</p>
            <p>{translate("home.about.point.delivery")}</p>
          </div>
        </div>
        <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-brand-900/70 p-0 shadow-xl shadow-black/30 backdrop-blur">
          <iframe
            title="WoodTech location"
            src="https://www.google.com/maps?q=15+rue+des+Metiers+14000+Caen&output=embed"
            className="h-full w-full flex-1 border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}










