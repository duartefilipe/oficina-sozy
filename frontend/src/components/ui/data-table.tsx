/**
 * Tabela com pesquisa, ordenacao e paginacao, no estilo de experiencia do
 * [DataTables](https://datatables.net/) (sem dependencia jQuery; React + TanStack Table).
 */
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState
} from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const searchInputClass =
  "h-9 w-full min-w-[12rem] max-w-md rounded border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 md:w-72";

function defaultGlobalFilter<TData>(row: Row<TData>, _columnId: string, filterValue: string) {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  return Object.values(row.original as object).some((v) => String(v ?? "")
    .toLowerCase()
    .includes(q));
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  pageSize?: number;
  getRowId?: (row: TData, index: number) => string;
  className?: string;
  toolbar?: ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Procurar…",
  pageSize = 10,
  getRowId,
  className,
  toolbar
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: defaultGlobalFilter,
    initialState: { pagination: { pageSize } },
    getRowId: getRowId
      ? (row, i) => getRowId(row as TData, i)
      : (row, i) => (row as { id?: string | number })?.id != null
        ? String((row as { id: string | number }).id)
        : `row-${i}`
  });

  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: ps } = table.getState().pagination;
  const from = total === 0 ? 0 : pageIndex * ps + 1;
  const to = Math.min((pageIndex + 1) * ps, total);

  const pageInfo = useMemo(
    () => (total > 0 ? `Mostrando ${from} a ${to} de ${total} registos` : "Nenhum registo"),
    [from, to, total]
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className="sr-only" htmlFor="dt-search">
              Pesquisa na tabela
            </label>
            <input
              id="dt-search"
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className={searchInputClass}
              autoComplete="off"
            />
          </div>
          {toolbar}
        </div>
        <p className="text-sm text-slate-600" aria-live="polite">
          {pageInfo}
        </p>
      </div>

      <div className="overflow-x-auto rounded border border-slate-300 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-sm" role="grid">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-300 bg-slate-100">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-800"
                    scope="col"
                  >
                    {header.isPlaceholder ? null : (
                      <span
                        className={header.column.getCanSort() ? "inline-flex cursor-pointer select-none items-center gap-1 hover:text-slate-600" : ""}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") header.column.getToggleSortingHandler()?.(e);
                        }}
                        role={header.column.getCanSort() ? "button" : undefined}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? " \u00a0\u2191" : null}
                        {header.column.getIsSorted() === "desc" ? " \u00a0\u2193" : null}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  Nenhum resultado. Ajuste a pesquisa ou adicione registos.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-slate-200 transition-colors hover:bg-slate-100/80",
                    i % 2 === 1 && "bg-slate-50/60"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-slate-800 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && table.getPageCount() > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="md"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              Primeira
            </Button>
            <Button variant="outline" size="md" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Anterior
            </Button>
            <span className="px-2 text-sm text-slate-600">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <Button variant="outline" size="md" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Próxima
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Última
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
