import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useResumoRelatorio } from "@/features/relatorios/hooks";
import { useOficinas } from "@/features/oficinas/hooks";
import { exportarRelatorioResumoPdf, type GraficoPdfCaptura } from "@/features/relatorios/pdf";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { RelatorioResumoDto } from "@/types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
}

function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hojeLocal() {
  return new Date();
}

function inicioMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function fimMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function inicioMesAnterior(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function fimMesAnterior(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 0);
}

function inicioAno(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

const CHART_COLORS = {
  primary: "#0f172a",
  blue: "#2563eb",
  green: "#16a34a",
  amber: "#d97706",
  rose: "#e11d48",
  slate: "#64748b"
};

export function RelatorioResumo() {
  const userRole = typeof window !== "undefined" ? localStorage.getItem("auth_user_role") : null;
  const isSuperadmin = userRole === "SUPERADMIN";

  const hoje = hojeLocal();
  const [dataInicio, setDataInicio] = useState(toInputDate(inicioMes(hoje)));
  const [dataFim, setDataFim] = useState(toInputDate(hoje));
  const [oficinaId, setOficinaId] = useState("");
  const oficinasQuery = useOficinas();

  const filtro = useMemo(
    () => ({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      oficinaId: isSuperadmin && oficinaId ? Number(oficinaId) : undefined
    }),
    [dataInicio, dataFim, oficinaId, isSuperadmin]
  );

  const query = useResumoRelatorio(filtro);

  const oficinaNomeExport = useMemo(() => {
    if (!oficinaId) return undefined;
    const id = Number(oficinaId);
    return oficinasQuery.data?.find((o) => o.id === id)?.nome;
  }, [oficinaId, oficinasQuery.data]);

  const relatorioGraficosRef = useRef<HTMLDivElement>(null);
  const [abaRelatorio, setAbaRelatorio] = useState<"visao" | "financeiro" | "operacional">("visao");
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const exportarPdfComGraficos = useCallback(async () => {
    const resumo = query.data;
    if (!resumo || exportandoPdf) return;
    setExportandoPdf(true);
    const abaAnterior = abaRelatorio;
    const graficos: GraficoPdfCaptura[] = [];
    try {
      const html2canvas = (await import("html2canvas")).default;
      const root = relatorioGraficosRef.current;
      const ordemAbas: ("visao" | "financeiro" | "operacional")[] = ["visao", "financeiro", "operacional"];

      for (const aba of ordemAbas) {
        setAbaRelatorio(aba);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        await new Promise((r) => setTimeout(r, 450));
        const paineis = root?.querySelectorAll<HTMLElement>("[data-rel-grafico-panel]");
        if (!paineis?.length) continue;
        for (const el of Array.from(paineis)) {
          if (el.dataset.relGraficoExcluir === "1") continue;
          const titulo = el.dataset.graficoTitulo?.trim() || "Gráfico";
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0
          });
          graficos.push({ titulo, dataUrl: canvas.toDataURL("image/png", 0.92) });
        }
      }

      await exportarRelatorioResumoPdf(resumo, {
        dataInicio: filtro.dataInicio,
        dataFim: filtro.dataFim,
        oficinaNome: oficinaNomeExport,
        graficos
      });
    } catch (err) {
      console.error(err);
      if (typeof window !== "undefined") {
        window.alert("Não foi possível gerar o PDF com os gráficos. Tente novamente.");
      }
    } finally {
      setAbaRelatorio(abaAnterior);
      setExportandoPdf(false);
    }
  }, [abaRelatorio, exportandoPdf, filtro.dataFim, filtro.dataInicio, oficinaNomeExport, query.data]);

  const aplicarPreset = (preset: "mes" | "mesAnterior" | "90d" | "ano" | "limpar") => {
    const ref = hojeLocal();
    if (preset === "limpar") {
      setDataInicio("");
      setDataFim("");
      return;
    }
    if (preset === "mes") {
      setDataInicio(toInputDate(inicioMes(ref)));
      setDataFim(toInputDate(ref));
      return;
    }
    if (preset === "mesAnterior") {
      setDataInicio(toInputDate(inicioMesAnterior(ref)));
      setDataFim(toInputDate(fimMesAnterior(ref)));
      return;
    }
    if (preset === "90d") {
      const ini = new Date(ref);
      ini.setDate(ini.getDate() - 89);
      setDataInicio(toInputDate(ini));
      setDataFim(toInputDate(ref));
      return;
    }
    if (preset === "ano") {
      setDataInicio(toInputDate(inicioAno(ref)));
      setDataFim(toInputDate(ref));
    }
  };

  if (query.isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm text-slate-600">Carregando relatório…</p>
        </div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-800 shadow-sm">
          {query.isError ? getApiErrorMessage(query.error) : "Não foi possível carregar o relatório."}
        </div>
      </section>
    );
  }

  const r = query.data;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relatórios</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Visão gerencial</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Filtre por período e oficina, explore os gráficos por aba e exporte o resumo em PDF quando precisar.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="shrink-0 border-slate-300"
          disabled={exportandoPdf}
          onClick={() => void exportarPdfComGraficos()}
        >
          {exportandoPdf ? "Gerando PDF…" : "Exportar PDF"}
        </Button>
      </header>

      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <div>
              <label className={labelClass} htmlFor="rel-ini">
                Data inicial
              </label>
              <input id="rel-ini" type="date" className={fieldClass} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="rel-fim">
                Data final
              </label>
              <input id="rel-fim" type="date" className={fieldClass} value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            {isSuperadmin ? (
              <div className="sm:col-span-2 lg:col-span-2">
                <label className={labelClass} htmlFor="rel-oficina">
                  Oficina
                </label>
                <select id="rel-oficina" className={fieldClass} value={oficinaId} onChange={(e) => setOficinaId(e.target.value)}>
                  <option value="">Todas as oficinas</option>
                  {(oficinasQuery.data ?? []).map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.nome}
                      {!o.ativo ? " (inativa)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs font-medium text-slate-500">Período rápido:</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => aplicarPreset("mes")}>
            Este mês
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => aplicarPreset("mesAnterior")}>
            Mês anterior
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => aplicarPreset("90d")}>
            Últimos 90 dias
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => aplicarPreset("ano")}>
            Ano até hoje
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => aplicarPreset("limpar")}>
            Todo o período
          </Button>
        </div>
      </div>

      <div ref={relatorioGraficosRef}>
        <RelatorioConteudo r={r} aba={abaRelatorio} onAbaChange={setAbaRelatorio} />
      </div>
    </section>
  );
}

function RelatorioConteudo({
  r,
  aba,
  onAbaChange
}: {
  r: RelatorioResumoDto;
  aba: "visao" | "financeiro" | "operacional";
  onAbaChange: (v: "visao" | "financeiro" | "operacional") => void;
}) {
  const pieReceita = [
    { nome: "Vendas", valor: r.receitaVendas, fill: CHART_COLORS.blue },
    { nome: "OS", valor: r.receitaOrdensServico, fill: CHART_COLORS.green }
  ];
  const pieDespesa = [
    { nome: "Custo vendas", valor: r.custoVendas, fill: CHART_COLORS.amber },
    { nome: "Custo OS", valor: r.custoOrdensServico, fill: CHART_COLORS.rose }
  ];
  const fluxoBarras = [
    { nome: "Receita", valor: r.receitaTotal, fill: CHART_COLORS.blue },
    { nome: "Despesa", valor: r.despesaTotal, fill: CHART_COLORS.slate },
    { nome: "Resultado", valor: r.resultadoLucroPrejuizo, fill: CHART_COLORS.primary }
  ];
  const margens = [
    { nome: "Vendas", margem: r.receitaVendas > 0 ? (r.lucroVendas / r.receitaVendas) * 100 : 0 },
    { nome: "OS", margem: r.receitaOrdensServico > 0 ? ((r.receitaOrdensServico - r.custoOrdensServico) / r.receitaOrdensServico) * 100 : 0 }
  ];
  const operacional = [
    { nome: "Vendas", qtd: r.quantidadeVendas },
    { nome: "OS", qtd: r.quantidadeConsertosMoto },
    { nome: "Peças vendidas", qtd: r.quantidadePecasVendidas }
  ];
  const radarData = [
    {
      metrica: "Fin.",
      vendas: Math.min(100, r.receitaVendas > 0 ? (r.receitaVendas / (r.receitaTotal || 1)) * 100 : 0),
      os: Math.min(100, r.receitaOrdensServico > 0 ? (r.receitaOrdensServico / (r.receitaTotal || 1)) * 100 : 0),
      resultado: Math.min(100, Math.max(0, 50 + (r.resultadoLucroPrejuizo / (r.receitaTotal || 1)) * 25))
    }
  ];
  const radialPendencias = [
    {
      nome: "pendentes",
      valor: Math.min(100, r.quantidadeVendas + r.quantidadeConsertosMoto > 0
        ? ((r.quantidadeVendasPendentes + r.quantidadeOsAbertas) /
            (r.quantidadeVendas + r.quantidadeConsertosMoto + r.quantidadeVendasPendentes + r.quantidadeOsAbertas)) *
          100
        : 0),
      fill: CHART_COLORS.amber
    }
  ];

  return (
    <Tabs value={aba} onValueChange={(v) => onAbaChange(v as "visao" | "financeiro" | "operacional")} className="space-y-6">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-slate-100/90 p-1.5">
        <TabsTrigger value="visao" className="rounded-lg data-[state=active]:shadow-md">
          Visão geral
        </TabsTrigger>
        <TabsTrigger value="financeiro" className="rounded-lg data-[state=active]:shadow-md">
          Financeiro
        </TabsTrigger>
        <TabsTrigger value="operacional" className="rounded-lg data-[state=active]:shadow-md">
          Operacional
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visao" className="mt-0 space-y-6 outline-none">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard titulo="Receita total" valor={moeda(r.receitaTotal)} destaque="positivo" />
          <KpiCard titulo="Despesa total" valor={moeda(r.despesaTotal)} />
          <KpiCard
            titulo="Resultado"
            valor={moeda(r.resultadoLucroPrejuizo)}
            destaque={r.resultadoLucroPrejuizo >= 0 ? "positivo" : "negativo"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartShell titulo="Receita por origem" subtitulo="Participação de vendas e OS no faturamento">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieReceita} dataKey="valor" nameKey="nome" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {pieReceita.map((entry) => (
                    <Cell key={entry.nome} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => moeda(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell titulo="Fluxo consolidado" subtitulo="Receita, despesa e resultado no período">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fluxoBarras} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nome" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 11 }} width={48} />
                <Tooltip formatter={(v: number) => moeda(v)} />
                <Bar dataKey="valor" name="Valor" radius={[8, 8, 0, 0]} barSize={48}>
                  {fluxoBarras.map((entry) => (
                    <Cell key={entry.nome} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>

        <ChartShell titulo="Panorama" subtitulo="Comparativo relativo entre frentes (referência)">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 16, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metrica" tick={{ fill: "#64748b", fontSize: 12 }} />
              <Radar name="Vendas %" dataKey="vendas" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.35} />
              <Radar name="OS %" dataKey="os" stroke={CHART_COLORS.green} fill={CHART_COLORS.green} fillOpacity={0.25} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartShell>
      </TabsContent>

      <TabsContent value="financeiro" className="mt-0 space-y-6 outline-none">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard titulo="Lucro em vendas" valor={moeda(r.lucroVendas)} destaque="positivo" />
          <KpiCard titulo="Custo de OS" valor={moeda(r.custoOrdensServico)} />
          <KpiCard titulo="Ticket médio vendas" valor={moeda(r.ticketMedioVendas)} />
          <KpiCard titulo="Ticket médio OS" valor={moeda(r.ticketMedioOs)} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartShell titulo="Despesas por tipo" subtitulo="Custo de mercadoria vs custos de OS">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieDespesa} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={92} labelLine={false} label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}>
                  {pieDespesa.map((entry) => (
                    <Cell key={entry.nome} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => moeda(v)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell titulo="Margem aproximada (%)" subtitulo="Lucro ou (receita − custo) sobre a receita, por frente">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={margens} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" width={72} tick={{ fill: "#334155", fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="margem" name="Margem %" radius={[0, 6, 6, 0]} fill={CHART_COLORS.green} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>

        <ChartShell titulo="Tendência (área)" subtitulo="Mesmos totais do período em formato de área para leitura rápida">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={fluxoBarras} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nome" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => moeda(v)} width={72} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip formatter={(v: number) => moeda(v)} />
              <Area type="monotone" dataKey="valor" name="Valor" stroke={CHART_COLORS.blue} fillOpacity={1} fill="url(#gradRes)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>
      </TabsContent>

      <TabsContent value="operacional" className="mt-0 space-y-6 outline-none">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard titulo="Vendas no período" valor={String(r.quantidadeVendas)} />
          <KpiCard titulo="OS no período" valor={String(r.quantidadeConsertosMoto)} />
          <KpiCard titulo="Peças vendidas" valor={String(r.quantidadePecasVendidas)} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartShell titulo="Volume" subtitulo="Vendas, OS e peças">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={operacional} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nome" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} width={36} />
                <Tooltip />
                <Bar dataKey="qtd" name="Quantidade" fill={CHART_COLORS.blue} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell titulo="Pendências" subtitulo="Vendas pendentes + OS abertas vs volume">
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart
                innerRadius="68%"
                outerRadius="100%"
                data={radialPendencias}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="valor" cornerRadius={6} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-700 text-2xl font-semibold">
                  {radialPendencias[0].valor.toFixed(0)}%
                </text>
                <Legend formatter={() => "Pendências / volume"} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell titulo="Alertas operacionais" subtitulo="Acompanhe fila e pendências" excluirDoPdf>
            <ul className="space-y-3 px-1 py-2 text-sm text-slate-700">
              <li className="flex justify-between rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200/60">
                <span>Vendas pendentes</span>
                <span className="font-semibold text-amber-900">{r.quantidadeVendasPendentes}</span>
              </li>
              <li className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <span>OS abertas / em execução</span>
                <span className="font-semibold text-slate-900">{r.quantidadeOsAbertas}</span>
              </li>
            </ul>
          </ChartShell>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function KpiCard({
  titulo,
  valor,
  destaque
}: {
  titulo: string;
  valor: string;
  destaque?: "positivo" | "negativo";
}) {
  const ring =
    destaque === "positivo"
      ? "ring-emerald-500/20 bg-emerald-50/40"
      : destaque === "negativo"
        ? "ring-rose-500/20 bg-rose-50/50"
        : "ring-slate-900/5 bg-slate-50/80";
  return (
    <div className={`rounded-2xl border border-slate-200/80 p-4 shadow-sm ring-1 ${ring}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{valor}</p>
    </div>
  );
}

function ChartShell({
  titulo,
  subtitulo,
  children,
  excluirDoPdf
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  excluirDoPdf?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
      data-rel-grafico-panel
      data-grafico-titulo={titulo}
      data-rel-grafico-excluir={excluirDoPdf ? "1" : undefined}
    >
      <p className="text-sm font-semibold text-slate-900">{titulo}</p>
      {subtitulo ? <p className="mb-3 text-xs text-slate-500">{subtitulo}</p> : <div className="mb-2" />}
      {children}
    </div>
  );
}
