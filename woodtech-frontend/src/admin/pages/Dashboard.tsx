import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/types";
import { Orders, Products } from "../api/adminApi";

const ORDER_PAGE_SIZE = 100;

const formatCurrency = (value: number, maximumFractionDigits = 2) =>
  value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

const statusLabel: Record<Order["status"], string> = {
  pending: "Confirmées",
  in_progress: "En cours",
  completed: "Terminées"
};

const statusStyle: Record<Order["status"], string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  in_progress: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
};

type MonthlyStat = {
  key: string;
  label: string;
  orders: number;
  revenue: number;
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildMonthlyStats = (orders: Order[]): MonthlyStat[] => {
  const validDates = orders
    .map((order) => new Date(order.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (validDates.length === 0) return [];

  const latestDate = new Date(Math.max(...validDates.map((date) => date.getTime())));
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(latestDate.getFullYear(), latestDate.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      orders: 0,
      revenue: 0
    };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const month = monthMap.get(monthKey(date));
    if (month) {
      month.orders += 1;
      month.revenue += order.total;
    }
  });

  return months;
};

const fetchAllOrders = async (): Promise<Order[]> => {
  const firstPage = await Orders.list({ page: 1, limit: ORDER_PAGE_SIZE });
  const pageCount = Math.ceil(firstPage.total / ORDER_PAGE_SIZE);

  if (pageCount <= 1) return firstPage.data;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      Orders.list({ page: index + 2, limit: ORDER_PAGE_SIZE })
    )
  );

  return [firstPage, ...remainingPages].flatMap((result) => result.data);
};

export default function DashboardPage() {
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [productsResult, allOrders] = await Promise.all([
          Products.list({ page: 1, limit: 1 }),
          fetchAllOrders()
        ]);

        if (!cancelled) {
          setProductCount(productsResult.total);
          setOrders(allOrders);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Impossible de charger les indicateurs du tableau de bord.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const statistics = useMemo(() => {
    const statusCounts: Record<Order["status"], number> = {
      pending: 0,
      in_progress: 0,
      completed: 0
    };
    let revenue = 0;
    let itemCount = 0;
    let largestOrder = 0;

    orders.forEach((order) => {
      statusCounts[order.status] += 1;
      revenue += order.total;
      itemCount += order.items.reduce((sum, item) => sum + item.qty, 0);
      largestOrder = Math.max(largestOrder, order.total);
    });

    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      statusCounts,
      revenue,
      itemCount,
      largestOrder,
      averageOrder: orders.length > 0 ? revenue / orders.length : 0,
      completionRate: orders.length > 0 ? (statusCounts.completed / orders.length) * 100 : 0,
      monthly: buildMonthlyStats(orders),
      recentOrders: sortedOrders.slice(0, 5),
      latestOrderDate: sortedOrders[0]?.createdAt
    };
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">Tableau de bord</h2>
        <p className="text-sm text-white/60">
          Suivi rapide des indicateurs clés : catalogue, commandes et activité commerciale.
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
          value={productCount.toString()}
          loading={loading}
          helper="Total du catalogue"
        />
        <MetricCard
          title="Commandes"
          value={orders.length.toString()}
          loading={loading}
          helper="Toutes périodes"
        />
        <MetricCard
          title="Commandes en cours"
          value={statistics.statusCounts.in_progress.toString()}
          loading={loading}
          helper="À traiter"
        />
        <MetricCard
          title="Chiffre estimé"
          value={formatCurrency(statistics.revenue)}
          loading={loading}
          helper="Somme des commandes enregistrées"
        />
      </div>

      <section className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold text-white">Statistiques commerciales</h3>
          <p className="mt-1 text-sm text-white/50">
            Analyse calculée à partir de toutes les commandes enregistrées.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Panier moyen"
            value={formatCurrency(statistics.averageOrder)}
            helper="Valeur moyenne par commande"
            loading={loading}
          />
          <SummaryCard
            label="Articles commandés"
            value={statistics.itemCount.toLocaleString("fr-FR")}
            helper="Quantité totale vendue"
            loading={loading}
          />
          <SummaryCard
            label="Taux de complétion"
            value={`${statistics.completionRate.toLocaleString("fr-FR", {
              maximumFractionDigits: 1
            })} %`}
            helper="Commandes terminées"
            loading={loading}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <MonthlyActivity
            data={statistics.monthly}
            latestOrderDate={statistics.latestOrderDate}
            loading={loading}
          />
          <StatusDistribution
            counts={statistics.statusCounts}
            total={orders.length}
            loading={loading}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <RecentOrders orders={statistics.recentOrders} loading={loading} />
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Repères</p>
            <h4 className="mt-2 text-lg font-semibold text-white">Performance globale</h4>

            <div className="mt-6 space-y-5">
              <InsightRow
                label="Plus grande commande"
                value={formatCurrency(statistics.largestOrder)}
              />
              <InsightRow
                label="Commandes à confirmer"
                value={statistics.statusCounts.pending.toLocaleString("fr-FR")}
              />
              <InsightRow
                label="Commandes terminées"
                value={statistics.statusCounts.completed.toLocaleString("fr-FR")}
              />
            </div>

            <Link
              to="/admin/commandes"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-brand-400/40 bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-100 transition hover:border-brand-300/70 hover:bg-brand-500/20"
            >
              Consulter toutes les commandes
            </Link>
          </div>
        </div>
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

function MetricCard({ title, value, helper, loading }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.4em] text-brand-200">{title}</p>
      <div className="mt-3 text-3xl font-semibold text-white">
        {loading ? <span className="text-white/40">...</span> : value}
      </div>
      {helper && <p className="mt-2 text-xs text-white/60">{helper}</p>}
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  helper: string;
  loading: boolean;
};

function SummaryCard({ label, value, helper, loading }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-brand-900/70 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{loading ? "..." : value}</p>
      <p className="mt-1 text-xs text-white/40">{helper}</p>
    </div>
  );
}

type MonthlyActivityProps = {
  data: MonthlyStat[];
  latestOrderDate?: string;
  loading: boolean;
};

function MonthlyActivity({ data, latestOrderDate, loading }: MonthlyActivityProps) {
  const maxRevenue = Math.max(...data.map((month) => month.revenue), 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-lg shadow-black/20 xl:col-span-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Évolution</p>
          <h4 className="mt-2 text-lg font-semibold text-white">Chiffre d'affaires mensuel</h4>
        </div>
        {latestOrderDate && (
          <p className="text-xs text-white/40">Jusqu'à {formatDate(latestOrderDate)}</p>
        )}
      </div>

      <div className="mt-7 flex h-56 items-end gap-3 border-b border-white/10 px-2 sm:gap-5">
        {loading ? (
          <div className="m-auto text-sm text-white/40">Chargement...</div>
        ) : data.length === 0 ? (
          <div className="m-auto text-sm text-white/40">Aucune activité disponible.</div>
        ) : (
          data.map((month) => {
            const height = month.revenue > 0 ? Math.max(10, (month.revenue / maxRevenue) * 100) : 2;
            return (
              <div key={month.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="mb-2 text-center">
                  <p className="truncate text-xs font-medium text-white/80">
                    {formatCurrency(month.revenue, 0)}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {month.orders} cmd.
                  </p>
                </div>
                <div className="flex h-36 items-end justify-center">
                  <div
                    className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-300 transition-[height] duration-500"
                    style={{ height: `${height}%` }}
                    title={`${month.orders} commande(s), ${formatCurrency(month.revenue)}`}
                  />
                </div>
                <p className="mt-3 text-center text-xs capitalize text-white/50">{month.label}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

type StatusDistributionProps = {
  counts: Record<Order["status"], number>;
  total: number;
  loading: boolean;
};

function StatusDistribution({ counts, total, loading }: StatusDistributionProps) {
  const statuses: Array<{
    status: Order["status"];
    barClass: string;
    dotClass: string;
  }> = [
    { status: "pending", barClass: "bg-amber-400", dotClass: "bg-amber-400" },
    { status: "in_progress", barClass: "bg-sky-400", dotClass: "bg-sky-400" },
    { status: "completed", barClass: "bg-emerald-400", dotClass: "bg-emerald-400" }
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-lg shadow-black/20">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Répartition</p>
      <h4 className="mt-2 text-lg font-semibold text-white">État des commandes</h4>

      <div className="mt-8 space-y-6">
        {statuses.map(({ status, barClass, dotClass }) => {
          const percentage = total > 0 ? (counts[status] / total) * 100 : 0;
          return (
            <div key={status}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/70">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                  {statusLabel[status]}
                </span>
                <span className="font-semibold text-white">
                  {loading ? "..." : counts[status]}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${barClass}`}
                  style={{ width: loading ? "0%" : `${percentage}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-white/40">
                {loading ? "..." : `${percentage.toFixed(0)} %`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type RecentOrdersProps = {
  orders: Order[];
  loading: boolean;
};

function RecentOrders({ orders, loading }: RecentOrdersProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-lg shadow-black/20 xl:col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Activité récente</p>
          <h4 className="mt-2 text-lg font-semibold text-white">Dernières commandes</h4>
        </div>
        <Link to="/admin/commandes" className="text-xs text-brand-200 hover:text-white">
          Voir tout
        </Link>
      </div>

      <div className="mt-5 divide-y divide-white/10">
        {loading ? (
          <p className="py-8 text-center text-sm text-white/40">Chargement...</p>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">Aucune commande disponible.</p>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              to={`/admin/commandes/${order.id}`}
              className="grid gap-2 py-3.5 transition hover:bg-white/[0.03] sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 sm:px-2"
            >
              <div>
                <p className="font-medium text-white">#{order.id.slice(-8).toUpperCase()}</p>
                <p className="mt-0.5 text-xs text-white/40">{formatDate(order.createdAt)}</p>
              </div>
              <span
                className={`w-fit rounded-full border px-2.5 py-1 text-xs ${statusStyle[order.status]}`}
              >
                {statusLabel[order.status]}
              </span>
              <p className="font-semibold text-brand-100">{formatCurrency(order.total)}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <span className="text-sm text-white/55">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
