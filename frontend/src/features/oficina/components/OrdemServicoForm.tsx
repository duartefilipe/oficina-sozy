import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useCriarOrdemServico, useOrdemServico, useOrdensServico, useRemoverOrdemServico } from "@/features/oficina/hooks";
import { OrdemServicoEditorForm } from "@/features/oficina/components/OrdemServicoEditorForm";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { OrdemServicoRequestDto, OrdemServicoResponseDto } from "@/types";

const novaOsSchema = z.object({
  placaMoto: z.string().trim().min(1, "Informe a placa do veículo."),
  cliente: z.string().trim().min(1, "Informe o nome do cliente.")
});

type NovaOsValues = z.infer<typeof novaOsSchema>;

type PainelOs =
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
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl ${
          wide ? "max-w-5xl" : "max-w-md"
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

function formatBrl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));
}

function ResumoOrdemServico({ os, onEditar }: { os: OrdemServicoResponseDto; onEditar: () => void }) {
  return (
    <div className="space-y-4 text-sm text-slate-800">
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">OS</dt>
          <dd className="font-medium">#{os.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
          <dd>{os.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Placa</dt>
          <dd>{os.placaMoto}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Cliente</dt>
          <dd>{os.cliente?.trim() ? os.cliente : "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Total</dt>
          <dd className="text-base font-semibold">{formatBrl(os.valorTotal)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Abertura</dt>
          <dd>{new Date(os.dataAbertura).toLocaleString("pt-BR")}</dd>
        </div>
      </dl>

      <div className="space-y-3 border-t border-slate-200 pt-3">
        <h3 className="text-sm font-semibold text-slate-900">Peças do estoque</h3>
        {os.pecasEstoque.length === 0 ? (
          <p className="text-slate-500">Nenhuma peça lançada.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            {os.pecasEstoque.map((p) => (
              <li key={p.id}>
                {p.produtoNome} × {p.quantidade} — {formatBrl(Number(p.valorCobrado) * p.quantidade)}
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-sm font-semibold text-slate-900">Serviços</h3>
        {os.servicos.length === 0 ? (
          <p className="text-slate-500">Nenhum serviço lançado.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            {os.servicos.map((s) => (
              <li key={s.id}>
                {s.descricao} — {formatBrl(Number(s.valor))}
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-sm font-semibold text-slate-900">Compras externas</h3>
        {os.custosExternos.length === 0 ? (
          <p className="text-slate-500">Nenhuma compra externa.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            {os.custosExternos.map((c) => (
              <li key={c.id}>
                {c.descricao} — custo {formatBrl(Number(c.custoAquisicao))}, cobrado {formatBrl(Number(c.valorCobrado))}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <Button type="button" size="md" onClick={onEditar}>
          Editar OS
        </Button>
      </div>
    </div>
  );
}

export function OrdemServicoForm() {
  const criarMutacao = useCriarOrdemServico();
  const removerMutacao = useRemoverOrdemServico();
  const ordensQuery = useOrdensServico();
  const [modalNovaOs, setModalNovaOs] = useState(false);
  const [painel, setPainel] = useState<PainelOs>(null);

  const painelId = painel?.id ?? null;
  const ordemDetalheQuery = useOrdemServico(painelId);

  const formNovaOs = useForm<NovaOsValues>({
    resolver: zodResolver(novaOsSchema),
    defaultValues: { placaMoto: "", cliente: "" }
  });

  const onNovaOsSubmit = (v: NovaOsValues) => {
    const payload: OrdemServicoRequestDto = {
      placaMoto: v.placaMoto.trim(),
      cliente: v.cliente.trim(),
      status: "ABERTA",
      pecasEstoque: [],
      servicos: [],
      custosExternos: []
    };
    criarMutacao.mutate(payload, {
      onSuccess: () => {
        setModalNovaOs(false);
        formNovaOs.reset({ placaMoto: "", cliente: "" });
      }
    });
  };

  const fecharPainel = () => setPainel(null);

  const colunasOrdens = useMemo<ColumnDef<OrdemServicoResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "OS", cell: ({ getValue }) => `#${getValue()}` },
      { accessorKey: "placaMoto", header: "Placa" },
      {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ getValue }) => (String(getValue() || "").trim() ? String(getValue()) : "—")
      },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "valorTotal",
        header: "Total",
        cell: ({ getValue }) => formatBrl(Number(getValue() ?? 0))
      },
      {
        id: "itens",
        header: "Resumo itens",
        enableSorting: false,
        cell: ({ row }) =>
          `${row.original.pecasEstoque.length} peças · ${row.original.servicos.length} serviços · ${row.original.custosExternos.length} ext.`
      },
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
                  !window.confirm(`Excluir a OS #${row.original.id}? Esta ação não pode ser desfeita.`)
                ) {
                  return;
                }
                removerMutacao.mutate(row.original.id);
              }}
            >
              Excluir
            </Button>
          </div>
        )
      }
    ],
    [removerMutacao]
  );

  const tituloPainel =
    painel?.tela === "resumo"
      ? `OS #${painel.id}`
      : painel?.tela === "editar"
        ? `Editar OS #${painel.id}`
        : "";

  const renderPainelConteudo = () => {
    if (!painel) return null;
    if (ordemDetalheQuery.isLoading) {
      return <p className="text-sm text-slate-600">Carregando…</p>;
    }
    if (ordemDetalheQuery.isError || !ordemDetalheQuery.data) {
      return (
        <p className="text-sm text-red-700" role="alert">
          {ordemDetalheQuery.isError ? getApiErrorMessage(ordemDetalheQuery.error) : "Não foi possível carregar a OS."}
        </p>
      );
    }
    const os = ordemDetalheQuery.data;

    if (painel.tela === "resumo") {
      return (
        <ResumoOrdemServico
          os={os}
          onEditar={() => setPainel({ id: painel.id, tela: "editar", voltarFechaModal: false })}
        />
      );
    }

    return (
      <OrdemServicoEditorForm
        key={painel.id}
        osId={painel.id}
        initialOs={os}
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
          <h1 className="text-2xl font-semibold text-slate-900">Oficina</h1>
          <p className="text-sm text-slate-600">
            Ordens de serviço. Custos externos são lançados separadamente e não entram no estoque.
          </p>
        </div>
        <Button type="button" size="md" className="shrink-0 self-start" onClick={() => setModalNovaOs(true)}>
          Criar OS
        </Button>
      </div>

      <DataTable
        columns={colunasOrdens}
        data={ordensQuery.data ?? []}
        searchPlaceholder="Buscar por placa, cliente, status, total…"
        pageSize={10}
      />

      <ModalShell open={modalNovaOs} title="Nova ordem de serviço" onClose={() => setModalNovaOs(false)} wide={false}>
        <form className="space-y-4" onSubmit={formNovaOs.handleSubmit(onNovaOsSubmit)}>
          {criarMutacao.isError && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(criarMutacao.error)}
            </p>
          )}
          <div>
            <label className={labelClass} htmlFor="nova-os-placa">
              Placa do veículo
            </label>
            <input id="nova-os-placa" className={fieldClass} placeholder="Ex.: ABC1D23" {...formNovaOs.register("placaMoto")} />
            {formNovaOs.formState.errors.placaMoto && (
              <p className="mt-1 text-xs text-red-600">{formNovaOs.formState.errors.placaMoto.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="nova-os-cliente">
              Nome do cliente
            </label>
            <input id="nova-os-cliente" className={fieldClass} placeholder="Nome completo" {...formNovaOs.register("cliente")} />
            {formNovaOs.formState.errors.cliente && (
              <p className="mt-1 text-xs text-red-600">{formNovaOs.formState.errors.cliente.message}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" size="md" disabled={criarMutacao.isPending}>
              {criarMutacao.isPending ? "Salvando…" : "Criar OS"}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={() => setModalNovaOs(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </ModalShell>

      <ModalShell open={!!painel} title={tituloPainel} onClose={fecharPainel} wide={painel?.tela === "editar"}>
        {renderPainelConteudo()}
      </ModalShell>
    </div>
  );
}
