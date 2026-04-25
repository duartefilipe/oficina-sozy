import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useProdutos } from "@/features/estoque/hooks";
import { useCriarVendaRapida, useVendas, useAtualizarStatusVenda } from "@/features/vendas/hooks";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import type { VendaResponseDto } from "@/types";

interface VendaFormValues {
  cliente: string;
  status: "PENDENTE" | "PAGA";
  itens: Array<{
    produtoId: number;
    quantidade: number;
    valorUnitario: number;
  }>;
}

const defaultValues: VendaFormValues = {
  cliente: "",
  status: "PENDENTE",
  itens: [{ produtoId: 0, quantidade: 1, valorUnitario: 0 }]
};

function VendaAcoesCell({ row }: { row: VendaResponseDto }) {
  const atualizarStatus = useAtualizarStatusVenda(row.id);
  if (row.status === "PAGA" || row.status === "CANCELADA") {
    return <span className="text-slate-500">—</span>;
  }
  return (
    <Button
      type="button"
      variant="success"
      size="md"
      onClick={() => atualizarStatus.mutate({ status: "PAGA" })}
      disabled={atualizarStatus.isPending}
    >
      Marcar como paga
    </Button>
  );
}

export function VendaRapidaForm() {
  const criarVenda = useCriarVendaRapida();
  const vendasQuery = useVendas();
  const produtosQuery = useProdutos();
  const produtos = produtosQuery.data ?? [];
  const form = useForm<VendaFormValues>({ defaultValues });
  const itensArray = useFieldArray({ control: form.control, name: "itens" });

  const onSubmit = (values: VendaFormValues) => {
    criarVenda.mutate(values);
  };

  const colunasVendas = useMemo<ColumnDef<VendaResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "Venda", cell: ({ getValue }) => `#${getValue()}` },
      {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ getValue }) => (String(getValue() || "").trim() ? String(getValue()) : "—")
      },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "valorTotal",
        header: "Total",
        cell: ({ getValue }) =>
          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(getValue() ?? 0))
      },
      {
        accessorKey: "dataVenda",
        header: "Data",
        cell: ({ getValue }) => {
          const s = String(getValue() ?? "");
          if (!s) return "—";
          try {
            return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
          } catch {
            return s;
          }
        }
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => <VendaAcoesCell row={row.original} />
      }
    ],
    []
  );

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">PDV - Venda direta</h2>
      <p className="mb-4 text-sm text-slate-600">Estoque só baixa quando a venda estiver com status PAGA.</p>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="v-cliente">
              Cliente
            </label>
            <input id="v-cliente" className={fieldClass} placeholder="Cliente" {...form.register("cliente")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="v-status">
              Status da venda
            </label>
            <select id="v-status" className={fieldClass} {...form.register("status")}>
              <option value="PENDENTE">PENDENTE</option>
              <option value="PAGA">PAGA</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="dark"
            size="md"
            onClick={() => itensArray.append({ produtoId: 0, quantidade: 1, valorUnitario: 0 })}
          >
            Adicionar item
          </Button>
        </div>

        <div className="space-y-2">
          {itensArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-end">
              <div>
                <label className={labelClass}>Produto</label>
                <select
                  className={fieldClass}
                  {...form.register(`itens.${index}.produtoId`, { valueAsNumber: true })}
                  onChange={(event) => {
                    const produtoId = Number(event.target.value);
                    form.setValue(`itens.${index}.produtoId`, produtoId);
                    const produto = produtos.find((p) => p.id === produtoId);
                    if (produto) {
                      form.setValue(`itens.${index}.valorUnitario`, produto.precoVenda);
                    }
                  }}
                >
                  <option value={0}>Selecione o produto</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.tipo}) - estoque {p.qtdEstoque}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Quantidade</label>
                <input
                  type="number"
                  className={fieldClass}
                  placeholder="Quantidade"
                  {...form.register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className={labelClass}>Valor unitário</label>
                <input
                  type="number"
                  step="0.01"
                  className={fieldClass}
                  placeholder="Valor"
                  {...form.register(`itens.${index}.valorUnitario`, { valueAsNumber: true })}
                />
              </div>
              <div className="flex">
                <Button type="button" variant="danger" size="md" onClick={() => itensArray.remove(index)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="md" disabled={criarVenda.isPending}>
            {criarVenda.isPending ? "Salvando…" : "Registrar venda"}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Vendas registradas</h3>
        <DataTable
          columns={colunasVendas}
          data={vendasQuery.data ?? []}
          searchPlaceholder="Buscar por ID, cliente, status…"
          pageSize={10}
        />
      </div>
    </section>
  );
}
