import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Orders } from "../api/adminApi";
import type { Order } from "@/types";

const PAGE_SIZE = 10;

// Liste paginée des commandes avec filtre texte/statut.
export default function OrdersListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Order["status"] | "">("");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasNext = page * PAGE_SIZE < total;
  const hasPrev = page > 1;

  // Synchro des filtres avec l'API (ou les mocks) en fonction de la page et des critères.
  const fetchOrders = useCallback(
    async (params: { q?: string; page?: number; status?: Order["status"] | "" }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await Orders.list({
          q: params.q ?? query,
          page: params.page ?? page,
          limit: PAGE_SIZE,
          status: params.status ? params.status : undefined
        });
        setOrders(response.data);
        setTotal(response.total);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les commandes.");
      } finally {
        setLoading(false);
      }
    },
    [page, query]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(searchInput);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchOrders({ q: query, page, status });
  }, [fetchOrders, query, page, status]);

  // Petites pastilles de couleur selon le statut de commande.
  const statusBadgeClass = (orderStatus: Order["status"]) => {
    switch (orderStatus) {
      case "pending":
        return "border-amber-400/40 bg-amber-400/10 text-amber-100";
      case "in_progress":
        return "border-sky-400/40 bg-sky-400/10 text-sky-100";
      case "completed":
        return "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
      default:
        return "border-white/30 bg-white/10 text-white/80";
    }
  };

  const statusLabel = (orderStatus: Order["status"]) => {
    switch (orderStatus) {
      case "pending":
        return "Confirmée";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Complétée";
      default:
        return orderStatus;
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Commande",
        render: (order: Order) => (
          <div>
            <p className="font-semibold text-white">{order.id}</p>
            <p className="text-xs text-white/50">
              {new Date(order.createdAt).toLocaleString("fr-FR")}
            </p>
          </div>
        )
      },
      {
        header: "Total",
        render: (order: Order) => (
          <span className="font-semibold text-brand-100">
            {order.total.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR"
            })}
          </span>
        ),
        className: "w-32"
      },
      {
        header: "Statut",
        render: (order: Order) => (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs uppercase tracking-wide ${statusBadgeClass(
              order.status
            )}`}
          >
            {statusLabel(order.status)}
          </span>
        ),
        className: "w-32"
      },
      {
        header: "Articles",
        render: (order: Order) => (
          <span className="text-sm text-white/70">{order.items.length}</span>
        ),
        className: "w-20 text-center"
      },
      {
        header: "Actions",
        render: (order: Order) => (
          <button
            type="button"
            onClick={() => navigate(`/admin/commandes/${order.id}`)}
            className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Voir
          </button>
        ),
        className: "w-24 text-right"
      }
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Commandes</h2>
          <p className="text-sm text-white/60">
            Consultez les commandes clients, filtrez par statut et accédez au détail des pièces commandées.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-brand-900/70 p-4 shadow-lg shadow-black/30 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <label htmlFor="search" className="text-xs font-medium uppercase tracking-wider text-white/60">
            Rechercher
          </label>
          <input
            id="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ID commande, produit..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-brand-400 focus:outline-none md:w-72"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-xs font-medium uppercase tracking-wider text-white/60">
            Statut
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as Order["status"] | "");
              setPage(1);
            }}
            className="w-full rounded-lg border border-white/10 bg-white px-4 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none md:w-48"
          >
            <option value="">Tous</option>
            <option value="pending">Confirmée</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Complétée</option>
          </select>
        </div>
        <div className="text-xs text-white/50">
          {orders.length} commande{orders.length > 1 ? "s" : ""} affichée{orders.length > 1 ? "s" : ""} / {total}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="Aucune commande trouvée."
        keyExtractor={(order) => order.id}
      />

      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        <div>
          Page {page} / {total} commande{total > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-white/20 px-3 py-1 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            Page précédente
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border border-white/20 px-3 py-1 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            Page suivante
          </button>
        </div>
      </div>
    </div>
  );
}
