import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T, index: number) => string;
};

// Tableau generique (colonnes declaratives) reutilise par les ecrans admin.
export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "Aucune donnée à afficher.",
  keyExtractor
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-900/80">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={`px-4 py-3 ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white/80">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-white/60">
                  Chargement des données...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-white/60">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = keyExtractor ? keyExtractor(row, index) : String(index);
                return (
                  <tr
                    key={key}
                    className="transition-colors hover:bg-white/5"
                  >
                    {columns.map((column) => (
                      <td key={column.header} className={`px-4 py-3 align-middle ${column.className ?? ""}`}>
                        {column.render
                          ? column.render(row)
                          : column.accessor
                          ? String(row[column.accessor])
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
