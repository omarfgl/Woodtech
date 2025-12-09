import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { Catalogue } from "../lib/api";
import { loadLocalProducts } from "../lib/catalogueLocal";
import type { Product } from "../types";
import { useTranslate } from "@/lib/i18n";
import { Button } from "@/components/animate-ui/components/buttons/button";

const ITEMS_PER_PAGE = 6;

// Page listant les realisations avec recherche plein texte et pagination locale.
export default function CataloguePage() {
  const [items, setItems] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "error">("loading");
  const translate = useTranslate();

  // Chargement du catalogue distant avec repli local en cas d'erreur.
  useEffect(() => {
    let active = true;
    (async () => {
      setState("loading");
      try {
        const { data } = await Catalogue.list();
        if (active) {
          setItems(Array.isArray(data) ? data : []);
          setState("idle");
        }
      } catch {
        try {
          const local = await loadLocalProducts();
          if (active) {
            setItems(local);
            setState("idle");
          }
        } catch {
          if (active) {
            setState("error");
          }
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Filtrage client simple sur titre, description et categorie.
  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return items.filter((product) =>
      [product.title, product.description, product.category]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [items, query]);

  const pageCount = useMemo(() => {
    const calculated = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    return Math.max(1, calculated || 0);
  }, [filtered.length]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    if (page >= pageCount) {
      setPage(pageCount - 1);
    }
  }, [page, pageCount]);

  const visible = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const goToPage = (target: number) => {
    if (target < 0 || target >= pageCount) return;
    setPage(target);
  };

  return (
    <section className="container py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">
            {translate("catalogue.title")}
          </h2>
          <p className="text-sm text-white/60">
            {translate("catalogue.subtitle")}
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={translate("catalogue.searchPlaceholder")}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none sm:w-64"
        />
      </div>
      {state === "error" && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {translate("catalogue.error")}
        </div>
      )}
      {state === "loading" && (
        <div className="py-10 text-center text-sm text-white/60">
          {translate("catalogue.loading")}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <ProductCard key={product.id} p={product} />
        ))}
      </div>
      {state === "idle" && filtered.length === 0 && (
        <p className="mt-6 text-sm text-white/60">
          {translate("catalogue.empty", { values: { query } })}
        </p>
      )}
      {state === "idle" && filtered.length > 0 && (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              variant="outline"
              size="sm"
              className="text-white/80"
            >
              {translate("pagination.previous")}
            </Button>
            <Button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount - 1}
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
                className={`h-3 rounded-full transition-all ${
                  index === page
                    ? "bg-brand-300 w-6"
                    : "w-3 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={translate("pagination.goToPage", {
                  values: { page: String(index + 1) }
                })}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

