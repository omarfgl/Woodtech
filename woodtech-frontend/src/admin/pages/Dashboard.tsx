import { useEffect, useState } from "react";
import { Orders, Products } from "../api/adminApi";

type Metrics = {
  products: number;
  orders: number;
  revenue: number;
  inProgress: number;
};

// Tableau de bord tres simple affichant quelques indicateurs globaux.
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    products: 0,
    orders: 0,
    revenue: 0,
    inProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recuperation des chiffres d'ensemble (une seule fois au montage).
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, ordersRes] = await Promise.all([
          Products.list({ page: 1, limit: 1 }),
          Orders.list({ page: 1, limit: 1000 })
        ]);

        if (cancelled) return;

        const revenue = ordersRes.data.reduce((sum, order) => sum + order.total, 0);
        const inProgress = ordersRes.data.filter((order) => order.status === "in_progress").length;

        setMetrics({
          products: productsRes.total,
          orders: ordersRes.total,
          revenue,
          inProgress
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Impossible de charger les indicateurs du tableau de bord.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">Tableau de bord</h2>
        <p className="text-sm text-white/60">
          Suivi rapide des indicateurs clés : catalogue, commandes, activité commerciale.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Produits actifs"
          value={metrics.products.toString()}
          loading={loading}
          helper="Total du catalogue"
        />
        <MetricCard
          title="Commandes"
          value={metrics.orders.toString()}
          loading={loading}
          helper="Toutes périodes"
        />
        <MetricCard
          title="Commandes en cours"
          value={metrics.inProgress.toString()}
          loading={loading}
          helper="À traiter"
        />
        <MetricCard
          title="Chiffre estimé"
          value={`${metrics.revenue.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR"
          })}`}
          loading={loading}
          helper="Somme des commandes enregistrées"
        />
      </div>

      <section className="rounded-3xl border border-white/10 bg-brand-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <h3 className="text-lg font-semibold text-white">À venir</h3>
        <p className="mt-2 text-sm text-white/70">
          Ajoutez des statistiques détaillées (panorama hebdomadaire, suivi des stocks, délais de production)
          dès que les microservices correspondants seront disponibles.
        </p>
      </section>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  helper?: string;
  loading?: boolean;
};

// Composant presentant un indicateur unique (chiffre + petite description).
function MetricCard({ title, value, helper, loading }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.4em] text-brand-200">{title}</p>
      <div className="mt-3 text-3xl font-semibold text-white">
        {loading ? <span className="text-white/40">···</span> : value}
      </div>
      {helper && <p className="mt-2 text-xs text-white/60">{helper}</p>}
    </div>
  );
}
