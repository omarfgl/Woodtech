import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Catalogue } from "../lib/api";
import { loadLocalProducts } from "../lib/catalogueLocal";
import { useCart } from "../store/cart";
import type { Product } from "../types";
import { useTranslate } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { useAuth } from "../store/auth";
import { Button } from "@/components/animate-ui/components/buttons/button";

type Status = "loading" | "idle" | "error";

const benefitKeys: TranslationKey[] = [
  "productDetail.benefit.warranty",
  "productDetail.benefit.sourcing",
  "productDetail.benefit.delivery"
];

// Page de detail d'une realisation avec appel API + fallback local.
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = `${location.pathname}${location.search}`;
  const translate = useTranslate();
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<Status>("loading");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const showAddedFeedback = () => {
    setAdded(true);
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => setAdded(false), 1800);
  };

  const handleAdd = () => {
    if (!product) return;
    if (!user) {
      navigate(`/inscription?reason=auth&redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    const clampedQty = Math.max(1, qty);
    setQty(clampedQty);
    addItem(product.id, clampedQty);
    showAddedFeedback();
  };

  const incrementQty = () => setQty((prev) => Math.min(prev + 1, 99));
  const decrementQty = () => setQty((prev) => Math.max(1, prev - 1));

  // Recherche du produit (d'abord via l'API, sinon dans le JSON local).
  useEffect(() => {
    if (!id) return;

    let active = true;

    (async () => {
      setState("loading");
      try {
        const { data } = await Catalogue.one(id);
        if (active) {
          setProduct(data && (data as any).id ? (data as Product) : null);
          setState("idle");
          return;
        }
      } catch {
        try {
          const local = await loadLocalProducts();
          const fallback = local.find((item) => item.id === id) ?? null;
          if (active && fallback) {
            setProduct(fallback);
            setState("idle");
            return;
          }
        } catch {
          // ignore
        }
        if (active) {
          setState("error");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Fil d'Ariane simplifie pour rappeler l'emplacement dans le catalogue.
  const breadcrumb = useMemo(() => {
    const catalogueLabel = translate("catalogue.title");
    if (!product) return catalogueLabel;
    return `${catalogueLabel} / ${product.title}`;
  }, [product, translate]);

  if (state === "loading") {
    return (
      <section className="container py-16 text-center text-white/70">
        {translate("productDetail.loading")}
      </section>
    );
  }

  if (state === "error" || !product) {
    return (
      <section className="container py-16 text-center">
        <h2 className="text-2xl font-semibold">
          {translate("productDetail.errorTitle")}
        </h2>
        <p className="mt-2 text-white/60">
          {translate("productDetail.errorMessage")}
        </p>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        {breadcrumb}
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full rounded-3xl border border-white/10 object-cover shadow-2xl shadow-black/30"
        />
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-sm uppercase tracking-[0.25em] text-brand-200">
              {product.category}
            </span>
            <h1 className="mt-3 text-3xl font-semibold">{product.title}</h1>
          </div>
          <p className="leading-relaxed text-white/70">{product.description}</p>
          <div className="text-3xl font-semibold text-brand-100">
            ${product.price.toFixed(2)}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm uppercase tracking-[0.2em] text-white/50">
                {translate("productDetail.quantityLabel")}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={decrementQty}
                  aria-label="Decrease quantity"
                  size="icon"
                  variant="secondary"
                  disabled={qty <= 1}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-base font-semibold text-brand-50 shadow-inner shadow-black/20">
                  {qty}
                </span>
                <Button
                  onClick={incrementQty}
                  aria-label="Increase quantity"
                  size="icon"
                  variant="secondary"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="rounded-lg"
                variant="primary"
                size="md"
                onClick={handleAdd}
              >
                {translate("productDetail.addToCart")}
              </Button>
              <Button
                as={Link}
                to="/contact"
                className="rounded-lg"
                variant="outline"
                size="md"
              >
                {translate("productDetail.contact")}
              </Button>
              {added && (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">
                  {translate("productDetail.added")}
                </span>
              )}
            </div>
          </div>
          <ul className="space-y-2 text-sm text-white/60">
            {benefitKeys.map((key) => (
              <li key={key}>{translate(key)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

