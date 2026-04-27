import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { useOrdensServico } from "@/features/oficina/hooks";
import type { OrdemServicoResponseDto, OrdemServicoStatus } from "@/types";

const STATUS_ABERTOS: OrdemServicoStatus[] = ["ABERTA", "EM_EXECUCAO"];

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarData(dataIso: string) {
  if (!dataIso) return "—";
  try {
    return new Date(dataIso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return dataIso;
  }
}

function formatarStatus(status: OrdemServicoStatus) {
  if (status === "EM_EXECUCAO") return "EM EXECUCAO";
  return status;
}

export function HomeDashboard() {
  const ordensQuery = useOrdensServico();
  const ordens = ordensQuery.data ?? [];

  const ordensAbertas = useMemo(
    () => ordens.filter((os) => STATUS_ABERTOS.includes(os.status)),
    [ordens]
  );

  const pendentes = ordensAbertas.length;
  const total = ordens.length;
  const concluidas = Math.max(total - pendentes, 0);
  const percentualConcluido = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const percentualPendente = total > 0 ? 100 - percentualConcluido : 100;

  const colunasAbertas = useMemo<ColumnDef<OrdemServicoResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "OS", cell: ({ getValue }) => `#${getValue()}` },
      { accessorKey: "placaMoto", header: "Placa" },
      {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ getValue }) => (String(getValue() || "").trim() ? String(getValue()) : "—")
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => formatarStatus(getValue() as OrdemServicoStatus)
      },
      {
        accessorKey: "dataAbertura",
        header: "Abertura",
        cell: ({ getValue }) => formatarData(String(getValue() ?? ""))
      },
      {
        accessorKey: "valorTotal",
        header: "Valor",
        cell: ({ getValue }) => moeda(Number(getValue() ?? 0))
      }
    ],
    []
  );

  if (ordensQuery.isLoading) {
    return (
      <p className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-900/5">
        Carregando painel da oficina…
      </p>
    );
  }

  if (ordensQuery.isError) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50/90 p-6 text-sm text-red-800 shadow-sm ring-1 ring-red-900/5">
        Nao foi possivel carregar os dados da Home.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Home</h1>
          <p className="text-sm text-slate-600">
            Acompanhe o progresso das ordens de servico e veja quantas ainda faltam para atingir 100% de conclusao.
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 shadow-sm ring-1 ring-slate-900/5">
              <p className="text-xs uppercase text-slate-500">Total de OS</p>
              <p className="text-lg font-semibold text-slate-900">{total}</p>
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-3 shadow-sm ring-1 ring-amber-900/5">
              <p className="text-xs uppercase text-amber-700">Pendentes</p>
              <p className="text-lg font-semibold text-amber-800">{pendentes}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-3 shadow-sm ring-1 ring-emerald-900/5">
              <p className="text-xs uppercase text-emerald-700">Concluidas</p>
              <p className="text-lg font-semibold text-emerald-800">{concluidas}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-900/5">
          <div
            className="relative h-44 w-44 rounded-full"
            style={{
              background: `conic-gradient(#f59e0b 0% ${percentualPendente}%, #10b981 ${percentualPendente}% 100%)`
            }}
            aria-label={`Grafico de pizza: ${pendentes} pendentes de ${total} OS`}
          >
            <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-white">
              <div className="text-center">
                <p className="text-xs uppercase text-slate-500">Conclusao</p>
                <p className="text-2xl font-bold text-slate-900">{percentualConcluido}%</p>
              </div>
            </div>
          </div>
          <div className="w-full space-y-1 text-xs text-slate-700">
            <p className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              Pendentes: {pendentes}
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Concluidas: {concluidas}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">OS abertas</h2>
        <DataTable
          columns={colunasAbertas}
          data={ordensAbertas}
          pageSize={10}
          searchPlaceholder="Buscar OS aberta por numero, cliente, placa ou status…"
        />
      </section>
    </div>
  );
}
