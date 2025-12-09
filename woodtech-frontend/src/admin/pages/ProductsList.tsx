import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import { Products } from "../api/adminApi";
import type { Product } from "@/types";

const PAGE_SIZE = 8;

// Gestion du catalogue dans l'espace admin (filtre et suppression).
export default function ProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const hasNext = page * PAGE_SIZE < total;
  const hasPrev = page > 1;

  const fetchProducts = useCallback(
    async (params: { q?: string; page?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await Products.list({
          q: params.q ?? query,
          page: params.page ?? page,
          limit: PAGE_SIZE
        });
        setProducts(response.data);
        setTotal(response.total);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les produits.");
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
    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  useEffect(() => {
    fetchProducts({ q: query, page });
  }, [fetchProducts, query, page]);

  // Suppression apres confirmation via la modale.
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await Products.remove(productToDelete.id);
      setProductToDelete(null);
      fetchProducts({ page: 1 });
    } catch (err) {
      console.error(err);
      setError("Suppression impossible. Réessayez plus tard.");
    }
  };

  // Configuration des colonnes (image, titre, categorie, prix, actions).
  const columns = useMemo(
    () => [
      {
        header: "Image",
        render: (product: Product) => (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-12 w-16 rounded-lg object-cover"
          />
        )
      },
      {
        header: "Titre",
        render: (product: Product) => (
          <div>
            <p className="font-medium text-white">{product.title}</p>
            <p className="text-xs text-white/50 line-clamp-1">{product.description}</p>
          </div>
        )
      },
      {
        header: "Catégorie",
        render: (product: Product) => (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs uppercase tracking-wide text-white/70">
            {product.category}
          </span>
        ),
        className: "w-32"
      },
      {
        header: "Prix",
        render: (product: Product) => (
          <span className="font-semibold text-brand-100">
            {product.price.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR"
            })}
          </span>
        ),
        className: "w-32"
      },
      {
        header: "Actions",
        render: (product: Product) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/admin/produits/${product.id}`)}
              className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Éditer
            </button>
            <button
              type="button"
              onClick={() => setProductToDelete(product)}
              className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-200 transition-colors hover:border-red-400 hover:text-red-100"
            >
              Supprimer
            </button>
          </div>
        ),
        className: "w-40 text-right"
      }
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Produits</h2>
          <p className="text-sm text-white/60">
            Gérez le catalogue WoodTech : créations à mettre en avant, mises à jour tarifaires, suppression.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/produits/nouveau")}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
        >
          <span className="text-lg leading-none">＋</span>
          Nouveau produit
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-4 shadow-lg shadow-black/40 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-brand-400 focus:outline-none sm:w-72"
          />
          <div className="text-xs text-white/50">
            Résultats : {products.length} / {total}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="Aucun produit trouvé pour cette recherche."
        keyExtractor={(product) => product.id}
      />

      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        <div>
          Page {page} — {total} produit{total > 1 ? "s" : ""}
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

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Supprimer le produit ?"
        message={
          productToDelete
            ? `Confirmez-vous la suppression de "${productToDelete.title}" ? Cette action est irréversible.`
            : ""
        }
        onCancel={() => setProductToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
