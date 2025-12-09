import { useEffect, useMemo, useState, useCallback } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { CheckCircle, MinusIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Catalogue, Orders } from "../lib/api";
import { loadLocalProducts } from "../lib/catalogueLocal";
import { useCart } from "../store/cart";
import type { Product } from "../types";
import { useTranslate } from "@/lib/i18n";
import { Button } from "@/components/animate-ui/components/buttons/button";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Page panier : enrichit les IDs avec les fiches produits et simule une creation de commande.
export default function CartPage() {
  const { items, removeItem, clear, setQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "stripe">("card");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [stripeCardComplete, setStripeCardComplete] = useState(false);
  const [createStripePaymentMethod, setCreateStripePaymentMethod] =
    useState<(() => Promise<string | null>) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const translate = useTranslate();

  // On recupere les descriptions completes des produits presents dans le panier.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await Catalogue.list();
        if (active) setProducts(data);
      } catch {
        const fallback = await loadLocalProducts();
        if (active) setProducts(fallback);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Jointure locale entre articles du panier et produits complets.
  const enriched = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product
          ? { ...product, qty: item.qty, lineTotal: item.qty * product.price }
          : null;
      })
      .filter(Boolean) as Array<Product & { qty: number; lineTotal: number }>;
  }, [items, products]);

  const total = enriched.reduce((sum, item) => sum + item.lineTotal, 0);

  const validatePayment = () => {
    if (paymentMethod === "card") {
      const { cardName, cardNumber, cardExpiry, cardCvc } = paymentDetails;
      if (!cardName || !cardNumber || !cardExpiry || !cardCvc) return false;
    }
    if (paymentMethod === "stripe") {
      if (!stripeCardComplete) return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    if (!validatePayment()) {
      setError(translate("cart.payment.error"));
      return;
    }
    setError(null);
    setStatus("submitting");
    let succeeded = false;
    try {
      let extraDetails: Record<string, unknown> | undefined = paymentDetails;

      if (paymentMethod === "stripe") {
        if (!createStripePaymentMethod) {
          throw new Error("Stripe n'est pas initialisé. Vérifiez la clé publique.");
        }
        const paymentMethodId = await createStripePaymentMethod();
        if (!paymentMethodId) {
          throw new Error("Impossible de créer le moyen de paiement Stripe.");
        }
        extraDetails = {
          stripePaymentMethodId: paymentMethodId
        };
      }

      await Orders.create("guest", items, paymentMethod, extraDetails);
      succeeded = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : translate("cart.payment.error");
      setError(message);
    } finally {
      if (succeeded) {
        clear();
        setStatus("done");
      } else {
        setStatus("idle");
      }
    }
  };

  const showSuccess = status === "done";

  if (items.length === 0) {
    return (
      <section className="container py-16 text-center">
        {showSuccess && (
          <div className="mx-auto mb-10 max-w-2xl rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-900/60 via-emerald-800/40 to-brand-900/70 p-6 shadow-2xl shadow-emerald-900/40">
            <div className="flex flex-col items-center gap-3 text-left sm:flex-row">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                <CheckCircle className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-emerald-100">
                  {translate("cart.checkout.successTitle")}
                </h2>
                <p className="text-sm text-emerald-50/80">
                  {translate("cart.checkout.successBody")}
                </p>
              </div>
            </div>
          </div>
        )}
        <h2 className="text-3xl font-semibold">{translate("cart.empty.title")}</h2>
        <p className="mt-3 text-white/60">{translate("cart.empty.description")}</p>
        <Button as="a" href="/catalogue" variant="primary" size="md" className="mt-6">
          {translate("cart.empty.cta")}
        </Button>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-semibold">{translate("cart.title")}</h1>
      <p className="text-sm text-white/60">{translate("cart.subtitle")}</p>
      <div className="mt-8 grid gap-6">
        {enriched.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-brand-800/60 p-4 sm:flex-row sm:items-center"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-white/60">{item.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-white/50">
                  {translate("cart.quantity", { values: { qty: String(item.qty) } })}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Decrease quantity"
                    disabled={item.qty <= 1}
                    onClick={() => setQuantity(item.id, Math.max(1, item.qty - 1))}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[2.5rem] rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-semibold text-brand-50 shadow-inner shadow-black/20">
                    {item.qty}
                  </span>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(item.id, Math.max(1, item.qty + 1))}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-lg font-semibold text-brand-100">
                ${item.lineTotal.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs uppercase tracking-[0.2em] text-white/70"
                onClick={() => removeItem(item.id)}
              >
                <TrashIcon className="h-4 w-4" />
                {translate("cart.remove")}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-white/40">
              {translate("cart.payment.title")}
            </div>
            <p className="mt-1 text-sm text-white/60">{translate("cart.payment.note")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {([
              { key: "card" as const, label: translate("cart.payment.card") },
              { key: "stripe" as const, label: translate("cart.payment.stripe") }
            ] as const).map((option) => {
              const active = paymentMethod === option.key;
              return (
                <Button
                  key={option.key}
                  onClick={() => {
                    setPaymentMethod(option.key);
                    setError(null);
                    setStripeCardComplete(false);
                  }}
                  variant={active ? "primary" : "secondary"}
                  size="sm"
                  aria-pressed={active}
                  className="rounded-lg px-4 text-sm font-medium"
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {paymentMethod === "card" && (
              <>
                <label className="flex flex-col gap-1 text-sm text-white/70">
                  <span>{translate("cart.payment.card.name")}</span>
                  <input
                    type="text"
                    className="rounded-lg border border-white/15 bg-brand-900/60 px-3 py-2 text-white outline-none transition focus:border-brand-400"
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({ ...prev, cardName: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-white/70 md:col-span-2">
                  <span>{translate("cart.payment.card.number")}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="rounded-lg border border-white/15 bg-brand-900/60 px-3 py-2 text-white outline-none transition focus:border-brand-400"
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({ ...prev, cardNumber: e.target.value }))
                    }
                    placeholder="4242 4242 4242 4242"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-white/70">
                  <span>{translate("cart.payment.card.expiry")}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="rounded-lg border border-white/15 bg-brand-900/60 px-3 py-2 text-white outline-none transition focus:border-brand-400"
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({ ...prev, cardExpiry: e.target.value }))
                    }
                    placeholder="04/28"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-white/70">
                  <span>{translate("cart.payment.card.cvc")}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="rounded-lg border border-white/15 bg-brand-900/60 px-3 py-2 text-white outline-none transition focus:border-brand-400"
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({ ...prev, cardCvc: e.target.value }))
                    }
                    placeholder="123"
                  />
                </label>
              </>
            )}
            {paymentMethod === "stripe" && (
              <div className="flex flex-col gap-3 md:col-span-2">
                {!stripePromise && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    Ajoutez VITE_STRIPE_PUBLIC_KEY au fichier .env pour activer Stripe.
                  </div>
                )}
                {stripePromise && (
                  <Elements
                    stripe={stripePromise}
                    options={stripeElementsOptions}
                  >
                    <StripeFields
                      onRegisterSubmit={(fn) =>
                        setCreateStripePaymentMethod(fn ? () => fn : null)
                      }
                      onCardStatusChange={setStripeCardComplete}
                    />
                  </Elements>
                )}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-brand-200">{error}</p>}
          {status === "done" && (
            <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-50">
              {translate("cart.checkout.successMessage")}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-2xl font-semibold text-brand-100">
            {translate("cart.total", {
              values: { total: `$${total.toFixed(2)}` }
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="md" className="rounded-lg" onClick={clear}>
              {translate("cart.clear")}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="rounded-lg"
              disabled={status === "submitting" || status === "done"}
              onClick={handleCheckout}
            >
              {status === "done"
                ? translate("cart.checkout.done")
                : status === "submitting"
                ? translate("cart.checkout.submitting")
                : translate("cart.checkout.submit")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

type StripeFieldsProps = {
  onRegisterSubmit: (fn: (() => Promise<string | null>) | null) => void;
  onCardStatusChange: (complete: boolean) => void;
};

const stripeElementsOptions: StripeElementsOptions = {
  locale: "fr",
  appearance: {
    theme: "night",
    variables: {
      colorPrimary: "#c08457",
      colorText: "#f8f4f1",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "10px"
    }
  }
};

function StripeFields({ onRegisterSubmit, onCardStatusChange }: StripeFieldsProps) {
  const stripe = useStripe();
  const elements = useElements();

  const registerSubmitHandler = useCallback(() => {
    return async () => {
      if (!stripe || !elements) {
        throw new Error("Stripe n'est pas prêt. Réessayez dans un instant.");
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Le champ de carte Stripe est indisponible.");
      }
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {}
      });
      if (error) {
        throw new Error(error.message || "Erreur lors de la création du moyen de paiement Stripe.");
      }
      return paymentMethod?.id ?? null;
    };
  }, [stripe, elements]);

  useEffect(() => {
    if (stripe && elements) {
      onRegisterSubmit(registerSubmitHandler());
    } else {
      onRegisterSubmit(null);
    }
    return () => onRegisterSubmit(null);
  }, [stripe, elements, registerSubmitHandler, onRegisterSubmit]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-white/70">Carte</span>
      <div className="rounded-lg border border-white/15 bg-brand-900/60 px-3 py-3">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#f8f4f1",
                fontSize: "16px",
                "::placeholder": {
                  color: "#9ca3af"
                }
              },
              invalid: {
                color: "#fca5a5"
              }
            }
          }}
          onChange={(event) => {
            onCardStatusChange(Boolean(event.complete));
          }}
        />
      </div>
    </div>
  );
}
