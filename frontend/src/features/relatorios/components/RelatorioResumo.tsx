import { useState, type ReactNode } from "react";
import { useResumoRelatorio } from "@/features/relatorios/hooks";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/lib/form-styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);
}

export function RelatorioResumo() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const query = useResumoRelatorio({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined
  });

  if (query.isLoading) {
    return (
      <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
        <p>Carregando relatorio...</p>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-red-600">Nao foi possivel carregar o relatorio.</p>
      </section>
    );
  }

  const r = query.data;
  const pieData = [
    { nome: "Receita vendas", valor: r.receitaVendas },
    { nome: "Receita OS", valor: r.receitaOrdensServico },
    { nome: "Despesa total", valor: r.despesaTotal }
  ];
  const barData = [
    { nome: "Receita", valor: r.receitaTotal },
    { nome: "Despesa", valor: r.despesaTotal },
    { nome: "Resultado", valor: r.resultadoLucroPrejuizo }
  ];
  const lineData = [
    { nome: "Vendas", valor: r.quantidadeVendas },
    { nome: "OS", valor: r.quantidadeConsertosMoto },
    { nome: "Pendentes", valor: r.quantidadeVendasPendentes + r.quantidadeOsAbertas }
  ];
  const COLORS = ["#2563eb", "#16a34a", "#f97316"];

  return (
    <section className="mx-auto mt-6 max-w-6xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Relatorio Gerencial</h2>
      <p className="mb-4 text-sm text-slate-600">Visao de despesas, lucro/prejuizo e produtividade.</p>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:items-end">
        <div>
          <label className={labelClass} htmlFor="rel-ini">
            Data inicial
          </label>
          <input
            id="rel-ini"
            type="date"
            className={fieldClass}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="rel-fim">
            Data final
          </label>
          <input
            id="rel-fim"
            type="date"
            className={fieldClass}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Button
            type="button"
            variant="dark"
            size="md"
            onClick={() => {
              setDataInicio("");
              setDataFim("");
            }}
          >
            Limpar filtro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card titulo="Receita total" valor={moeda(r.receitaTotal)} />
        <Card titulo="Despesa total" valor={moeda(r.despesaTotal)} />
        <Card titulo="Resultado (lucro/prejuizo)" valor={moeda(r.resultadoLucroPrejuizo)} />
        <Card titulo="Receita de vendas" valor={moeda(r.receitaVendas)} />
        <Card titulo="Custo de vendas" valor={moeda(r.custoVendas)} />
        <Card titulo="Lucro de vendas" valor={moeda(r.lucroVendas)} />
        <Card titulo="Receita de OS" valor={moeda(r.receitaOrdensServico)} />
        <Card titulo="Custo de OS" valor={moeda(r.custoOrdensServico)} />
        <Card titulo="Pecas vendidas" valor={String(r.quantidadePecasVendidas)} />
        <Card titulo="Quantidade de vendas" valor={String(r.quantidadeVendas)} />
        <Card titulo="Consertos de moto (OS)" valor={String(r.quantidadeConsertosMoto)} />
        <Card titulo="Vendas pendentes" valor={String(r.quantidadeVendasPendentes)} />
        <Card titulo="OS abertas" valor={String(r.quantidadeOsAbertas)} />
        <Card titulo="Ticket medio de vendas" valor={moeda(r.ticketMedioVendas)} />
        <Card titulo="Ticket medio de OS" valor={moeda(r.ticketMedioOs)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Composicao financeira">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={95} label>
                {pieData.map((entry, index) => (
                  <Cell key={entry.nome} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => moeda(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Receita x despesa x resultado">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => moeda(value)} />
              <Bar dataKey="valor" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard titulo="Volume operacional (vendas e OS)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  );
}

function ChartCard({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">{titulo}</p>
      {children}
    </div>
  );
}
