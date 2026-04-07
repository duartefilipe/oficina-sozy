import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAtualizarProduto, useCriarProduto, useProdutos, useRemoverProduto } from "@/features/estoque/hooks";
import type { ProdutoTipo } from "@/types";

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

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Estoque - Cadastro de Produtos</h2>
      <p className="mb-4 text-sm text-slate-600">Cadastre pecas e motos para usar em OS e PDV.</p>

      <form className="grid grid-cols-1 gap-2 md:grid-cols-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1 block text-xs text-slate-600">SKU</label>
          <input className="w-full rounded-md border border-slate-300 p-2" placeholder="SKU" {...form.register("sku")} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-slate-600">Nome do produto</label>
          <input className="w-full rounded-md border border-slate-300 p-2" placeholder="Nome" {...form.register("nome")} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Tipo</label>
          <select className="w-full rounded-md border border-slate-300 p-2" {...form.register("tipo")}>
            <option value="PECA">PECA</option>
            <option value="MOTO">MOTO</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Preco de custo</label>
          <input type="number" step="0.01" className="w-full rounded-md border border-slate-300 p-2" placeholder="Custo" {...form.register("precoCusto", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Preco de venda</label>
          <input type="number" step="0.01" className="w-full rounded-md border border-slate-300 p-2" placeholder="Venda" {...form.register("precoVenda", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Quantidade em estoque</label>
          <input type="number" className="w-full rounded-md border border-slate-300 p-2" placeholder="Qtd estoque" {...form.register("qtdEstoque", { valueAsNumber: true })} />
        </div>
        <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white md:col-span-2">
          {produtoEditandoId !== null ? "Salvar edicao" : "Cadastrar"}
        </button>
        {produtoEditandoId !== null ? (
          <button
            type="button"
            className="rounded bg-slate-400 px-4 py-2 text-white md:col-span-2"
            onClick={() => {
              setProdutoEditandoId(null);
              form.reset(defaultValues);
            }}
          >
            Cancelar edicao
          </button>
        ) : null}
      </form>

      <div className="mt-5 space-y-2">
        {(produtos.data ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium">{p.nome} ({p.tipo})</p>
              <p className="text-xs text-slate-500">ID: {p.id} | SKU: {p.sku || "-"} | Estoque: {p.qtdEstoque}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded bg-amber-600 px-3 py-2 text-white"
                onClick={() => {
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
              </button>
              <button type="button" className="rounded bg-red-600 px-3 py-2 text-white" onClick={() => remover.mutate(p.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
