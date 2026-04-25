import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { useAtualizarProduto, useCriarProduto, useProdutos, useRemoverProduto } from "@/features/estoque/hooks";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import type { ProdutoDto, ProdutoTipo } from "@/types";

interface ProdutoForm {
  sku: string;
  nome: string;
  tipo: ProdutoTipo;
  precoCusto: number;
  precoVenda: number;
  qtdEstoque: number;
}

const defaultValues: ProdutoForm = {
  sku: "",
  nome: "",
  tipo: "PECA",
  precoCusto: 0,
  precoVenda: 0,
  qtdEstoque: 0
};

function moeda(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function ProdutoManagement() {
  const produtos = useProdutos();
  const criar = useCriarProduto();
  const atualizar = useAtualizarProduto();
  const remover = useRemoverProduto();
  const form = useForm<ProdutoForm>({ defaultValues });
  const [produtoEditandoId, setProdutoEditandoId] = useState<number | null>(null);

  const onSubmit = (values: ProdutoForm) => {
    if (produtoEditandoId !== null) {
      atualizar.mutate(
        { produtoId: produtoEditandoId, payload: values },
        {
          onSuccess: () => {
            setProdutoEditandoId(null);
            form.reset(defaultValues);
          }
        }
      );
      return;
    }
    criar.mutate(values, { onSuccess: () => form.reset(defaultValues) });
  };

  const columns = useMemo<ColumnDef<ProdutoDto>[]>(
    () => [
      { accessorKey: "id", header: "ID", size: 60 },
      { accessorKey: "nome", header: "Nome" },
      { accessorKey: "tipo", header: "Tipo" },
      { accessorKey: "sku", header: "SKU", cell: ({ getValue }) => (getValue() as string) || "—" },
      {
        accessorKey: "precoCusto",
        header: "Custo",
        cell: ({ getValue }) => moeda(Number(getValue()))
      },
      {
        accessorKey: "precoVenda",
        header: "Venda",
        cell: ({ getValue }) => moeda(Number(getValue()))
      },
      { accessorKey: "qtdEstoque", header: "Estoque" },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="warning"
              size="md"
              onClick={() => {
                const p = row.original;
                setProdutoEditandoId(p.id);
                form.reset({
                  sku: p.sku ?? "",
                  nome: p.nome,
                  tipo: p.tipo,
                  precoCusto: p.precoCusto,
                  precoVenda: p.precoVenda,
                  qtdEstoque: p.qtdEstoque
                });
              }}
            >
              Editar
            </Button>
            <Button type="button" variant="danger" size="md" onClick={() => remover.mutate(row.original.id)}>
              Remover
            </Button>
          </div>
        )
      }
    ],
    [remover]
  );

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Estoque - Cadastro de Produtos</h2>
      <p className="mb-4 text-sm text-slate-600">Cadastre peças e motos para usar em OS e PDV.</p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className={labelClass} htmlFor="p-sku">
              SKU
            </label>
            <input id="p-sku" className={fieldClass} placeholder="SKU" {...form.register("sku")} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="p-nome">
              Nome do produto
            </label>
            <input id="p-nome" className={fieldClass} placeholder="Nome" {...form.register("nome")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="p-tipo">
              Tipo
            </label>
            <select id="p-tipo" className={fieldClass} {...form.register("tipo")}>
              <option value="PECA">PECA</option>
              <option value="MOTO">MOTO</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="p-custo">
              Preço de custo
            </label>
            <input
              id="p-custo"
              type="number"
              step="0.01"
              className={fieldClass}
              placeholder="0"
              {...form.register("precoCusto", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="p-venda">
              Preço de venda
            </label>
            <input
              id="p-venda"
              type="number"
              step="0.01"
              className={fieldClass}
              placeholder="0"
              {...form.register("precoVenda", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="p-qtd">
              Qtd. em estoque
            </label>
            <input
              id="p-qtd"
              type="number"
              className={fieldClass}
              placeholder="0"
              {...form.register("qtdEstoque", { valueAsNumber: true })}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="md" disabled={criar.isPending || atualizar.isPending}>
            {produtoEditandoId !== null ? "Salvar edição" : "Cadastrar"}
          </Button>
          {produtoEditandoId !== null ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setProdutoEditandoId(null);
                form.reset(defaultValues);
              }}
            >
              Cancelar edição
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Produtos cadastrados</h3>
        <DataTable
          columns={columns}
          data={produtos.data ?? []}
          searchPlaceholder="Buscar por nome, SKU, tipo…"
          pageSize={10}
        />
      </div>
    </section>
  );
}
