import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Orders, Products } from "../api/adminApi";
import type { Order, Product } from "@/types";

type OrderItemView = {
  item: Order["items"][number];
  product: Product | null;
};

const statusOptions: { value: Order["status"]; label: string }[] = [
  { value: "pending", label: "Confirmée" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Complétée" }
];

// Vue détaillée d'une commande avec rappel des fiches produits.
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [itemsView, setItemsView] = useState<OrderItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [status, setStatus] = useState<Order["status"]>(statusOptions[0].value);

  // Charge la commande cible puis toutes les fiches produits nécessaires.
  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const orderResponse = await Orders.one(id);
        if (cancelled) return;
        setOrder(orderResponse);

        const rawStatus = orderResponse.status as string;
        const normalizedStatus = statusOptions.some((option) => option.value === rawStatus)
          ? (rawStatus as Order["status"])
          : statusOptions[0].value;
        setStatus(normalizedStatus);

        const productIds = Array.from(
          new Set(orderResponse.items.map((item) => item.productId))
        );

        const products = await Promise.all(
          productIds.map(async (productId) => {
            try {
              return await Products.one(productId);
            } catch (err) {
              console.warn(`Produit ${productId} introuvable`, err);
              return null;
            }
          })
        );

        const productMap = productIds.reduce<Record<string, Product | null>>((acc, productId, index) => {
          acc[productId] = products[index];
          return acc;
        }, {});

        const mappedItems = orderResponse.items.map((item) => ({
          item,
          product: productMap[item.productId] ?? null
        }));

        if (!cancelled) {
          setItemsView(mappedItems);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Impossible de charger la commande demandée.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Somme des lignes affichées (utile pour comparer avec le total en base).
  const subtotal = useMemo(() => {
    return itemsView.reduce((sum, view) => {
      const price = view.product?.price ?? 0;
      return sum + price * view.item.qty;
    }, 0);
  }, [itemsView]);

  // Permet de modifier le statut puis de rafraîchir l'affichage.
  const handleStatusChange = async () => {
    if (!order) return;
    setStatusUpdating(true);
    try {
      const updated = await Orders.updateStatus(order.id, status);
      setOrder(updated);

      const rawStatus = updated.status as string;
      const normalizedStatus = statusOptions.some((option) => option.value === rawStatus)
        ? (rawStatus as Order["status"])
        : statusOptions[0].value;
      setStatus(normalizedStatus);
    } catch (err) {
      console.error(err);
      setError("La mise à jour du statut a échoué. Merci de réessayer.");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-center text-white/60">
        Chargement de la commande...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-center text-white/60">
          {error ?? "Commande introuvable."}
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/commandes")}
          className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          Retour aux commandes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Commande {order.id}</h2>
          <p className="text-sm text-white/60">
            Enregistrée le {new Date(order.createdAt).toLocaleString("fr-FR")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/commandes")}
          className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          Retour
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <h3 className="text-lg font-semibold text-white">Articles commandés</h3>
          <div className="mt-4 space-y-4">
            {itemsView.map(({ item, product }) => (
              <div
                key={`${order.id}-${item.productId}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {product?.title ?? `Produit ${item.productId}`}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Quantité : <span className="font-medium text-white/80">{item.qty}</span>
                  </p>
                  {product && (
                    <p className="mt-1 text-xs text-white/50 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-brand-100">
                  {((product?.price ?? 0) * item.qty).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR"
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Statut</h3>
            <p className="mt-2 text-sm text-white/70">
              Suivez l&apos;avancement de la commande et notifiez le client de sa progression.
            </p>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider text-white/60">
                Statut de la commande
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Order["status"])}
                className="w-full rounded-lg border border-white/10 bg-white px-4 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusChange}
                disabled={statusUpdating}
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400 disabled:opacity-60"
              >
                {statusUpdating ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Récapitulatif</h3>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Sous-total estimé</span>
                <span className="text-white">
                  {subtotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-brand-100">
                <span>Total commande</span>
                <span>
                  {order.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
