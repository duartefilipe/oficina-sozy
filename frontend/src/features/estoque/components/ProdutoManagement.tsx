import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCriarProduto, useProdutos, useRemoverProduto } from "@/features/estoque/hooks";
import type { ProdutoPayload } from "@/features/estoque/api";
import { ProdutoEditorForm } from "@/features/estoque/components/ProdutoEditorForm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { ProdutoDto } from "@/types";

const novaProdutoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto."),
  tipo: z.enum(["PECA", "MOTO"])
});

type NovaProdutoValues = z.infer<typeof novaProdutoSchema>;

type PainelProduto =
  | null
  | { id: number; tela: "resumo" }
  | { id: number; tela: "editar"; voltarFechaModal: boolean };

function ModalShell({
  open,
  title,
  onClose,
  children,
  wide
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Fechar" onClick={onClose} />
      <div
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl ${
          wide ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function moeda(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function ResumoProduto({ p, onEditar }: { p: ProdutoDto; onEditar: () => void }) {
  return (
    <div className="space-y-4 text-sm text-slate-800">
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">ID</dt>
          <dd className="font-medium">{p.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Tipo</dt>
          <dd>{p.tipo}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Nome</dt>
          <dd className="font-medium">{p.nome}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">SKU</dt>
          <dd>{p.sku?.trim() ? p.sku : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Qtd. estoque</dt>
          <dd>{p.qtdEstoque}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Preço custo</dt>
          <dd>{moeda(p.precoCusto)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Preço venda</dt>
          <dd>{moeda(p.precoVenda)}</dd>
        </div>
        {(p.chassi || p.renavam || p.ano) && (
          <div className="sm:col-span-2 border-t border-slate-200 pt-2">
            <dt className="text-xs font-medium uppercase text-slate-500">Veículo (se aplicável)</dt>
            <dd className="mt-1 text-slate-700">
              {[p.chassi && `Chassi: ${p.chassi}`, p.renavam && `Renavam: ${p.renavam}`, p.ano && `Ano: ${p.ano}`]
                .filter(Boolean)
                .join(" · ") || "—"}
            </dd>
          </div>
        )}
      </dl>
      <div className="border-t border-slate-200 pt-4">
        <Button type="button" size="md" onClick={onEditar}>
          Editar produto
        </Button>
      </div>
    </div>
  );
}

export function ProdutoManagement() {
  const produtos = useProdutos();
  const criar = useCriarProduto();
  const remover = useRemoverProduto();
  const [modalNovo, setModalNovo] = useState(false);
  const [painel, setPainel] = useState<PainelProduto>(null);

  const formNovo = useForm<NovaProdutoValues>({
    resolver: zodResolver(novaProdutoSchema),
    defaultValues: { nome: "", tipo: "PECA" }
  });

  const produtoSelecionado = useMemo(() => {
    if (!painel) return null;
    return produtos.data?.find((x) => x.id === painel.id) ?? null;
  }, [painel, produtos.data]);

  const onNovoSubmit = (v: NovaProdutoValues) => {
    const payload: ProdutoPayload = {
      nome: v.nome.trim(),
      tipo: v.tipo,
      precoCusto: 0,
      precoVenda: 0,
      qtdEstoque: 0
    };
    criar.mutate(payload, {
      onSuccess: () => {
        setModalNovo(false);
        formNovo.reset({ nome: "", tipo: "PECA" });
      }
    });
  };

  const fecharPainel = () => setPainel(null);

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
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPainel({ id: row.original.id, tela: "resumo" })}
            >
              Visualizar
            </Button>
            <Button
              type="button"
              variant="warning"
              size="sm"
              onClick={() => setPainel({ id: row.original.id, tela: "editar", voltarFechaModal: true })}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  !window.confirm(`Excluir o produto "${row.original.nome}"? Esta ação não pode ser desfeita.`)
                ) {
                  return;
                }
                remover.mutate(row.original.id);
              }}
            >
              Excluir
            </Button>
          </div>
        )
      }
    ],
    [remover]
  );

  const tituloPainel =
    painel?.tela === "resumo"
      ? `Produto #${painel.id}`
      : painel?.tela === "editar"
        ? `Editar produto #${painel.id}`
        : "";

  const renderPainel = () => {
    if (!painel) return null;
    if (produtos.isLoading) {
      return <p className="text-sm text-slate-600">Carregando…</p>;
    }
    if (!produtoSelecionado) {
      return (
        <p className="text-sm text-amber-800" role="status">
          Produto não encontrado na lista. Feche e tente de novo.
        </p>
      );
    }
    const p = produtoSelecionado;

    if (painel.tela === "resumo") {
      return <ResumoProduto p={p} onEditar={() => setPainel({ id: painel.id, tela: "editar", voltarFechaModal: false })} />;
    }

    return (
      <ProdutoEditorForm
        key={painel.id}
        produtoId={painel.id}
        initial={p}
        onCancel={() => {
          if (painel.voltarFechaModal) fecharPainel();
          else setPainel({ id: painel.id, tela: "resumo" });
        }}
        onSaved={fecharPainel}
      />
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Estoque</h1>
          <p className="text-sm text-slate-600">Peças e motos para usar em OS e PDV.</p>
        </div>
        <Button type="button" size="md" className="shrink-0 self-start" onClick={() => setModalNovo(true)}>
          Cadastrar produto
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={produtos.data ?? []}
        searchPlaceholder="Buscar por nome, SKU, tipo…"
        pageSize={10}
      />

      <ModalShell open={modalNovo} title="Novo produto" onClose={() => setModalNovo(false)} wide={false}>
        <form className="space-y-4" onSubmit={formNovo.handleSubmit(onNovoSubmit)}>
          {criar.isError && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(criar.error)}
            </p>
          )}
          <div>
            <label className={labelClass} htmlFor="novo-p-nome">
              Nome do produto
            </label>
            <input id="novo-p-nome" className={fieldClass} placeholder="Ex.: Filtro de óleo" {...formNovo.register("nome")} />
            {formNovo.formState.errors.nome && (
              <p className="mt-1 text-xs text-red-600">{formNovo.formState.errors.nome.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="novo-p-tipo">
              Tipo
            </label>
            <select id="novo-p-tipo" className={fieldClass} {...formNovo.register("tipo")}>
              <option value="PECA">PECA</option>
              <option value="MOTO">MOTO</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Preços e quantidade iniciam em zero. Use <strong>Editar</strong> na lista para preencher custo, venda e estoque.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" size="md" disabled={criar.isPending}>
              {criar.isPending ? "Salvando…" : "Criar produto"}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={() => setModalNovo(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </ModalShell>

      <ModalShell open={!!painel} title={tituloPainel} onClose={fecharPainel} wide={painel?.tela === "editar"}>
        {renderPainel()}
      </ModalShell>
    </div>
  );
}
