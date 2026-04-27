import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useClientes, useCriarCliente } from "@/features/clientes/hooks";
import { useProdutos } from "@/features/estoque/hooks";
import { useOficinas } from "@/features/oficinas/hooks";
import { useCriarVendaRapida, useVendas, useAtualizarStatusVenda, useAtualizarVenda } from "@/features/vendas/hooks";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { VendaRequestDto, VendaResponseDto } from "@/types";

interface VendaFormValues {
  clienteSelecionado: string;
  novoClienteNome: string;
  novaClienteOficinaId?: string;
  status: "PENDENTE" | "PAGA";
  itens: Array<{
    produtoId: number;
    quantidade: number;
    valorUnitario: number;
  }>;
}

const defaultValues: VendaFormValues = {
  clienteSelecionado: "NOVO",
  novoClienteNome: "",
  novaClienteOficinaId: "",
  status: "PENDENTE",
  itens: [{ produtoId: 0, quantidade: 1, valorUnitario: 0 }]
};

const novaVendaSchema = z.object({
  clienteSelecionado: z.string().min(1, "Selecione um cliente."),
  novoClienteNome: z.string().optional(),
  novaClienteOficinaId: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGA"]),
  itens: z
    .array(
      z.object({
        produtoId: z.coerce.number().int().positive("Selecione um produto."),
        quantidade: z.coerce.number().int().positive("Quantidade deve ser maior que zero."),
        valorUnitario: z.coerce.number().nonnegative("Valor unitário inválido.")
      })
    )
    .min(1, "Adicione ao menos um item.")
}).superRefine((values, ctx) => {
  const userRole = localStorage.getItem("auth_user_role");
  if (values.clienteSelecionado === "NOVO") {
    if (!values.novoClienteNome?.trim()) {
      ctx.addIssue({
        path: ["novoClienteNome"],
        code: "custom",
        message: "Informe o nome do cliente para cadastro rápido."
      });
    }
    if (userRole === "SUPERADMIN" && !values.novaClienteOficinaId) {
      ctx.addIssue({
        path: ["novaClienteOficinaId"],
        code: "custom",
        message: "Selecione a oficina do cliente."
      });
    }
  }
});

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function normalizarStatus(status?: string) {
  return String(status ?? "").trim().toUpperCase();
}

function descricaoProduto(nome: string, tipo: string, qtdEstoque: number) {
  return `${nome} (${tipo}) - estoque ${qtdEstoque}`;
}

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
          wide ? "max-w-5xl" : "max-w-3xl"
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

function VendaAcoesCell({ row }: { row: VendaResponseDto }) {
  const atualizarStatus = useAtualizarStatusVenda(row.id);
  const statusNormalizado = normalizarStatus(row.status);
  if (statusNormalizado === "PAGA" || statusNormalizado === "CANCELADA") {
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

function VendaResumo({
  venda,
  onEditar,
  onMarcarPaga,
  onCancelar
}: {
  venda: VendaResponseDto;
  onEditar: () => void;
  onMarcarPaga: () => void;
  onCancelar: () => void;
}) {
  const pendente = normalizarStatus(venda.status) === "PENDENTE";
  const colunasItens = useMemo<ColumnDef<VendaResponseDto["itens"][number]>[]>(
    () => [
      {
        accessorKey: "produtoNome",
        header: "Produto",
        cell: ({ row }) => row.original.produtoNome || "—"
      },
      { accessorKey: "quantidade", header: "Qtd." },
      {
        accessorKey: "valorUnitario",
        header: "Valor un.",
        cell: ({ getValue }) => moeda(Number(getValue() ?? 0))
      },
      {
        id: "subtotal",
        header: "Subtotal",
        cell: ({ row }) => moeda(Number(row.original.valorUnitario) * Number(row.original.quantidade))
      }
    ],
    []
  );

  return (
    <div className="space-y-4 text-sm text-slate-800">
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Venda</dt>
          <dd className="font-medium">#{venda.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
          <dd>{venda.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Cliente</dt>
          <dd>{venda.cliente?.trim() ? venda.cliente : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Data</dt>
          <dd>{new Date(venda.dataVenda).toLocaleString("pt-BR")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Total</dt>
          <dd className="text-base font-semibold">{moeda(venda.valorTotal)}</dd>
        </div>
      </dl>

      <div className="space-y-2 border-t border-slate-200 pt-3">
        <h3 className="text-sm font-semibold text-slate-900">Itens da venda</h3>
        {venda.itens.length === 0 ? (
          <p className="text-slate-500">Nenhum item.</p>
        ) : (
          <DataTable
            columns={colunasItens}
            data={venda.itens}
            pageSize={5}
            searchPlaceholder="Buscar item por produto, quantidade ou valor…"
            className="pt-1"
          />
        )}
      </div>

      {pendente ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <Button type="button" size="sm" variant="warning" onClick={onEditar}>
            Editar venda
          </Button>
          <Button type="button" size="sm" variant="success" onClick={onMarcarPaga}>
            Marcar como paga
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={onCancelar}>
            Cancelar venda
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function VendaRapidaForm() {
  const userRole = localStorage.getItem("auth_user_role");
  const clientesQuery = useClientes();
  const criarCliente = useCriarCliente();
  const oficinasQuery = useOficinas();
  const criarVenda = useCriarVendaRapida();
  const atualizarVenda = useAtualizarVenda();
  const vendasQuery = useVendas();
  const produtosQuery = useProdutos();
  const produtos = produtosQuery.data ?? [];
  const form = useForm<VendaFormValues>({ resolver: zodResolver(novaVendaSchema), defaultValues });
  const itensArray = useFieldArray({ control: form.control, name: "itens" });
  const [modalNovaVenda, setModalNovaVenda] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaResponseDto | null>(null);
  const [vendaEditandoId, setVendaEditandoId] = useState<number | null>(null);
  const [buscaProdutoPorLinha, setBuscaProdutoPorLinha] = useState<Record<string, string>>({});
  const [linhaComboboxAberta, setLinhaComboboxAberta] = useState<string | null>(null);
  const statusMutacao = useAtualizarStatusVenda(vendaSelecionada?.id ?? 0);

  const abrirNovaVenda = () => {
    setVendaEditandoId(null);
    setBuscaProdutoPorLinha({});
    setLinhaComboboxAberta(null);
    form.reset(defaultValues);
    setModalNovaVenda(true);
  };

  const abrirEdicao = (venda: VendaResponseDto) => {
    setVendaSelecionada(null);
    setVendaEditandoId(venda.id);
    const buscaInicial: Record<string, string> = {};
    venda.itens.forEach((item, idx) => {
      buscaInicial[`edit-${idx}`] = item.produtoNome;
    });
    setBuscaProdutoPorLinha(buscaInicial);
    setLinhaComboboxAberta(null);
    form.reset({
      clienteSelecionado: venda.clienteId ? String(venda.clienteId) : "NOVO",
      novoClienteNome: venda.clienteId ? "" : (venda.cliente ?? ""),
      novaClienteOficinaId: "",
      status: venda.status === "CANCELADA" ? "PENDENTE" : venda.status,
      itens: venda.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        valorUnitario: Number(item.valorUnitario)
      }))
    });
    setModalNovaVenda(true);
  };

  const fecharModalVenda = () => {
    setModalNovaVenda(false);
    setVendaEditandoId(null);
    setBuscaProdutoPorLinha({});
    setLinhaComboboxAberta(null);
    form.reset(defaultValues);
  };

  const onSubmit = async (values: VendaFormValues) => {
    let clienteId: number | undefined =
      values.clienteSelecionado !== "NOVO" ? Number(values.clienteSelecionado) : undefined;

    if (values.clienteSelecionado === "NOVO") {
      const novoCliente = await criarCliente.mutateAsync({
        nome: values.novoClienteNome.trim(),
        oficinaId: userRole === "SUPERADMIN" && values.novaClienteOficinaId ? Number(values.novaClienteOficinaId) : undefined
      });
      clienteId = novoCliente.id;
    }

    const payload: VendaRequestDto = {
      clienteId,
      cliente: undefined,
      status: values.status,
      itens: values.itens.map((item) => ({
        produtoId: Number(item.produtoId),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario)
      }))
    };

    const acao = vendaEditandoId ? atualizarVenda.mutate : criarVenda.mutate;
    const params = vendaEditandoId ? { vendaId: vendaEditandoId, payload } : payload;
    acao(params as never, {
      onSuccess: () => {
        fecharModalVenda();
      }
    });
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
        cell: ({ getValue }) => moeda(Number(getValue() ?? 0))
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
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setVendaSelecionada(row.original)}>
              Visualizar
            </Button>
            {normalizarStatus(row.original.status) === "PENDENTE" ? (
              <Button type="button" variant="warning" size="sm" onClick={() => abrirEdicao(row.original)}>
                Editar
              </Button>
            ) : null}
            <VendaAcoesCell row={row.original} />
          </div>
        )
      }
    ],
    [abrirEdicao]
  );

  const produtosBusca = useMemo(
    () =>
      produtos.map((produto) => ({
        id: produto.id,
        nomeNormalizado: produto.nome.toLowerCase(),
        descricao: descricaoProduto(produto.nome, produto.tipo, produto.qtdEstoque)
      })),
    [produtos]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Vendas</h1>
          <p className="text-sm text-slate-600">PDV com baixa de estoque somente quando a venda estiver PAGA.</p>
        </div>
        <Button type="button" size="md" className="shrink-0 self-start" onClick={abrirNovaVenda}>
          Criar venda
        </Button>
      </div>

      <DataTable
        columns={colunasVendas}
        data={vendasQuery.data ?? []}
        searchPlaceholder="Buscar por ID, cliente, status…"
        pageSize={10}
      />

      <ModalShell
        open={modalNovaVenda}
        title={vendaEditandoId ? `Editar venda #${vendaEditandoId}` : "Nova venda"}
        onClose={fecharModalVenda}
        wide
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {criarVenda.isError || atualizarVenda.isError || criarCliente.isError ? (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
              {getApiErrorMessage(
                criarCliente.isError ? criarCliente.error : criarVenda.isError ? criarVenda.error : atualizarVenda.error
              )}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="v-cliente">
                Cliente
              </label>
              <select id="v-cliente" className={fieldClass} {...form.register("clienteSelecionado")}>
                <option value="NOVO">Cadastrar cliente</option>
                {(clientesQuery.data ?? [])
                  .filter((c) => c.ativo)
                  .map((cliente) => (
                    <option key={cliente.id} value={String(cliente.id)}>
                      {cliente.nome}
                    </option>
                  ))}
              </select>
              {form.watch("clienteSelecionado") === "NOVO" ? (
                <div className="mt-2 space-y-2">
                  <input
                    className={fieldClass}
                    placeholder="Nome do cliente"
                    {...form.register("novoClienteNome")}
                  />
                  {userRole === "SUPERADMIN" ? (
                    <select className={fieldClass} {...form.register("novaClienteOficinaId")}>
                      <option value="">Selecione a oficina</option>
                      {(oficinasQuery.data ?? []).map((oficina) => (
                        <option key={oficina.id} value={String(oficina.id)}>
                          {oficina.nome}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ) : null}
              {form.formState.errors.novoClienteNome ? (
                <p className="mt-1 text-xs text-red-600">{String(form.formState.errors.novoClienteNome.message)}</p>
              ) : null}
              {form.formState.errors.novaClienteOficinaId ? (
                <p className="mt-1 text-xs text-red-600">{String(form.formState.errors.novaClienteOficinaId.message)}</p>
              ) : null}
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
            size="sm"
            onClick={() => itensArray.append({ produtoId: 0, quantidade: 1, valorUnitario: 0 })}
          >
            Adicionar item
          </Button>
        </div>

        <div className="space-y-2">
          {itensArray.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_auto] md:items-end"
            >
              <div>
                <label className={labelClass}>Produto</label>
                {(() => {
                  const linhaId = field.id;
                  const produtoSelecionadoId = Number(form.watch(`itens.${index}.produtoId`) ?? 0);
                  const produtoSelecionado = produtos.find((p) => p.id === produtoSelecionadoId);
                  const textoSelecionado = produtoSelecionado
                    ? descricaoProduto(produtoSelecionado.nome, produtoSelecionado.tipo, produtoSelecionado.qtdEstoque)
                    : "";
                  const buscaAtual = buscaProdutoPorLinha[linhaId] ?? textoSelecionado;
                  const termo = buscaAtual.trim().toLowerCase();
                  const opcoesFiltradas = produtosBusca
                    .filter((produto) => !termo || produto.descricao.toLowerCase().includes(termo) || produto.nomeNormalizado.includes(termo))
                    .slice(0, 12);

                  return (
                    <div className="relative">
                      <input
                        type="search"
                        className={fieldClass}
                        placeholder="Buscar produto por nome, tipo ou estoque"
                        value={buscaAtual}
                        autoComplete="off"
                        onFocus={() => setLinhaComboboxAberta(linhaId)}
                        onBlur={() => {
                          window.setTimeout(() => {
                            setLinhaComboboxAberta((prev) => (prev === linhaId ? null : prev));
                          }, 120);
                        }}
                        onChange={(event) => {
                          setBuscaProdutoPorLinha((prev) => ({ ...prev, [linhaId]: event.target.value }));
                          form.setValue(`itens.${index}.produtoId`, 0, { shouldValidate: true, shouldDirty: true });
                          form.setValue(`itens.${index}.valorUnitario`, 0, { shouldValidate: true, shouldDirty: true });
                          setLinhaComboboxAberta(linhaId);
                        }}
                      />
                      {linhaComboboxAberta === linhaId ? (
                        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-slate-300 bg-white shadow-lg">
                          {opcoesFiltradas.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-500">Nenhum produto encontrado.</p>
                          ) : (
                            opcoesFiltradas.map((produto) => (
                              <button
                                key={produto.id}
                                type="button"
                                className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  form.setValue(`itens.${index}.produtoId`, produto.id, { shouldValidate: true, shouldDirty: true });
                                  const selecionado = produtos.find((p) => p.id === produto.id);
                                  if (selecionado) {
                                    form.setValue(`itens.${index}.valorUnitario`, selecionado.precoVenda, {
                                      shouldValidate: true,
                                      shouldDirty: true
                                    });
                                  }
                                  setBuscaProdutoPorLinha((prev) => ({ ...prev, [linhaId]: produto.descricao }));
                                  setLinhaComboboxAberta(null);
                                }}
                              >
                                {produto.descricao}
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
                {form.formState.errors.itens?.[index]?.produtoId?.message ? (
                  <p className="mt-1 text-xs text-red-600">{String(form.formState.errors.itens[index]?.produtoId?.message)}</p>
                ) : null}
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
                  type="text"
                  className={`${fieldClass} cursor-not-allowed bg-slate-100 text-slate-600`}
                  value={(() => {
                    const valor = Number(form.watch(`itens.${index}.valorUnitario`) ?? 0);
                    return valor > 0 ? moeda(valor) : "Definido pelo estoque";
                  })()}
                  readOnly
                  aria-readonly="true"
                />
                <input type="hidden" {...form.register(`itens.${index}.valorUnitario`, { valueAsNumber: true })} />
              </div>
              <Button type="button" variant="danger" size="sm" className="shrink-0" onClick={() => itensArray.remove(index)}>
                Remover
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="md" disabled={criarVenda.isPending || atualizarVenda.isPending || criarCliente.isPending}>
            {criarVenda.isPending || atualizarVenda.isPending || criarCliente.isPending
              ? "Salvando…"
              : vendaEditandoId
                ? "Salvar edição"
                : "Registrar venda"}
          </Button>
          {vendaEditandoId ? (
            <Button type="button" variant="outline" size="md" onClick={fecharModalVenda}>
              Cancelar edição
            </Button>
          ) : null}
        </div>
        </form>
      </ModalShell>

      <ModalShell
        open={!!vendaSelecionada}
        title={vendaSelecionada ? `Venda #${vendaSelecionada.id}` : "Venda"}
        onClose={() => setVendaSelecionada(null)}
      >
        {vendaSelecionada ? (
          <VendaResumo
            venda={vendaSelecionada}
            onEditar={() => abrirEdicao(vendaSelecionada)}
            onMarcarPaga={() => statusMutacao.mutate({ status: "PAGA" }, { onSuccess: () => setVendaSelecionada(null) })}
            onCancelar={() => statusMutacao.mutate({ status: "CANCELADA" }, { onSuccess: () => setVendaSelecionada(null) })}
          />
        ) : null}
      </ModalShell>
    </div>
  );
}
