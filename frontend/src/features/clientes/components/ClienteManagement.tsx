import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import { useAtualizarCliente, useClientes, useCriarCliente, useHistoricoCliente, useRemoverCliente } from "@/features/clientes/hooks";
import { useOficinas } from "@/features/oficinas/hooks";
import type { ClienteResponseDto } from "@/types";

function ModalShell({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Fechar" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
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

const emailOpcional = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, "Informe um email válido.");

const clienteBaseSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  sobrenome: z.string().trim().optional(),
  email: emailOpcional,
  telefone: z.string().trim().optional(),
  dataAniversario: z.string().optional(),
  cidade: z.string().trim().optional(),
  oficinaId: z.string().optional()
});

const clienteSchema = clienteBaseSchema.superRefine((values, ctx) => {
  const role = localStorage.getItem("auth_user_role");
  if (role === "SUPERADMIN" && !values.oficinaId) {
    ctx.addIssue({
      path: ["oficinaId"],
      code: "custom",
      message: "Selecione a oficina do cliente."
    });
  }
});

const clienteEditSchema = clienteBaseSchema.extend({
  ativo: z.boolean()
});

type ClienteFormValues = z.infer<typeof clienteSchema>;
type ClienteEditFormValues = z.infer<typeof clienteEditSchema>;
type PainelCliente = null | { id: number; tela: "visualizar" | "editar" | "historico" };

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function clienteFormDefaults(cliente?: ClienteResponseDto): ClienteFormValues {
  return {
    nome: cliente?.nome ?? "",
    sobrenome: cliente?.sobrenome ?? "",
    email: cliente?.email ?? "",
    telefone: cliente?.telefone ?? "",
    dataAniversario: cliente?.dataAniversario ?? "",
    cidade: cliente?.cidade ?? "",
    oficinaId: cliente?.oficinaId ? String(cliente.oficinaId) : ""
  };
}

function clienteEditDefaults(cliente?: ClienteResponseDto): ClienteEditFormValues {
  return {
    ...clienteFormDefaults(cliente),
    ativo: cliente?.ativo ?? true
  };
}

function limparOpcional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : undefined;
}

function formatarData(data?: string) {
  if (!data) return "—";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function DadosCliente({ cliente }: { cliente: ClienteResponseDto }) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm text-slate-800 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-medium uppercase text-slate-500">Nome</dt>
        <dd className="font-medium">{cliente.nomeCompleto}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
        <dd>{cliente.ativo ? "Ativo" : "Inativo"}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase text-slate-500">Email</dt>
        <dd>{cliente.email || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase text-slate-500">Telefone</dt>
        <dd>{cliente.telefone || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase text-slate-500">Data de aniversário</dt>
        <dd>{formatarData(cliente.dataAniversario)}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase text-slate-500">Cidade</dt>
        <dd>{cliente.cidade || "—"}</dd>
      </div>
      {cliente.oficinaNome ? (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Oficina</dt>
          <dd>{cliente.oficinaNome}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function ClienteManagement() {
  const userRole = localStorage.getItem("auth_user_role");
  const isSuperadmin = userRole === "SUPERADMIN";
  const oficinasQuery = useOficinas();
  const clientesQuery = useClientes();
  const criarMutacao = useCriarCliente();
  const atualizarMutacao = useAtualizarCliente();
  const removerMutacao = useRemoverCliente();
  const [modalCadastro, setModalCadastro] = useState(false);
  const [painel, setPainel] = useState<PainelCliente>(null);
  const [erroRemover, setErroRemover] = useState<string | null>(null);
  const historicoQuery = useHistoricoCliente(painel?.tela === "historico" ? painel.id : null);

  const clienteSelecionado = useMemo(() => {
    if (!painel) return null;
    return clientesQuery.data?.find((cliente) => cliente.id === painel.id) ?? null;
  }, [clientesQuery.data, painel]);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: clienteFormDefaults()
  });

  const editForm = useForm<ClienteEditFormValues>({
    resolver: zodResolver(clienteEditSchema),
    defaultValues: clienteEditDefaults()
  });

  useEffect(() => {
    if (painel?.tela === "editar" && clienteSelecionado) {
      editForm.reset(clienteEditDefaults(clienteSelecionado));
    }
  }, [clienteSelecionado, editForm, painel?.tela]);

  const montarPayload = (values: ClienteFormValues) => ({
    nome: values.nome.trim(),
    sobrenome: limparOpcional(values.sobrenome),
    email: limparOpcional(values.email),
    telefone: limparOpcional(values.telefone),
    dataAniversario: limparOpcional(values.dataAniversario),
    cidade: limparOpcional(values.cidade),
    oficinaId: isSuperadmin && values.oficinaId ? Number(values.oficinaId) : undefined
  });

  const colunas = useMemo<ColumnDef<ClienteResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "nomeCompleto", header: "Nome" },
      ...(isSuperadmin
        ? [
            {
              accessorKey: "oficinaNome",
              header: "Oficina",
              cell: ({ getValue }) => (getValue() as string) || "—"
            } satisfies ColumnDef<ClienteResponseDto>
          ]
        : []),
      { accessorKey: "telefone", header: "Telefone", cell: ({ getValue }) => (getValue() as string) || "—" },
      { accessorKey: "email", header: "Email", cell: ({ getValue }) => (getValue() as string) || "—" },
      { accessorKey: "cidade", header: "Cidade", cell: ({ getValue }) => (getValue() as string) || "—" },
      {
        accessorKey: "ativo",
        header: "Status",
        cell: ({ getValue }) => (getValue() ? "Ativo" : "Inativo")
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setPainel({ id: row.original.id, tela: "visualizar" })}>
              Visualizar
            </Button>
            <Button type="button" variant="warning" size="sm" onClick={() => setPainel({ id: row.original.id, tela: "editar" })}>
              Editar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPainel({ id: row.original.id, tela: "historico" })}>
              Histórico
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  !window.confirm(`Excluir o cliente "${row.original.nomeCompleto}"? Esta ação não pode ser desfeita.`)
                ) {
                  return;
                }
                setErroRemover(null);
                removerMutacao.mutate(row.original.id, {
                  onError: (error) => setErroRemover(getApiErrorMessage(error)),
                  onSuccess: () => {
                    if (painel?.id === row.original.id) setPainel(null);
                  }
                });
              }}
            >
              Excluir
            </Button>
          </div>
        )
      }
    ],
    [isSuperadmin, painel?.id, removerMutacao]
  );

  const fecharPainel = () => {
    setPainel(null);
    setErroRemover(null);
  };

  const renderCamposCliente = (
    prefixo: string,
    register: UseFormRegister<ClienteFormValues | ClienteEditFormValues>,
    errors: FieldErrors<ClienteFormValues | ClienteEditFormValues>
  ) => (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-nome`}>
            Nome
          </label>
          <input id={`${prefixo}-nome`} className={fieldClass} placeholder="Nome" {...register("nome")} />
          {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-sobrenome`}>
            Sobrenome
          </label>
          <input id={`${prefixo}-sobrenome`} className={fieldClass} placeholder="Sobrenome" {...register("sobrenome")} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-email`}>
            Email
          </label>
          <input id={`${prefixo}-email`} className={fieldClass} type="email" placeholder="cliente@email.com" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-telefone`}>
            Telefone
          </label>
          <input id={`${prefixo}-telefone`} className={fieldClass} placeholder="Telefone ou WhatsApp" {...register("telefone")} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-data-aniversario`}>
            Data de aniversário
          </label>
          <input id={`${prefixo}-data-aniversario`} className={fieldClass} type="date" {...register("dataAniversario")} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-cidade`}>
            Cidade
          </label>
          <input id={`${prefixo}-cidade`} className={fieldClass} placeholder="Cidade" {...register("cidade")} />
        </div>
      </div>
      {isSuperadmin ? (
        <div>
          <label className={labelClass} htmlFor={`${prefixo}-oficina`}>
            Oficina
          </label>
          <select id={`${prefixo}-oficina`} className={fieldClass} {...register("oficinaId")} disabled={prefixo === "cliente-edit"}>
            <option value="">Selecione a oficina</option>
            {(oficinasQuery.data ?? []).map((oficina) => (
              <option key={oficina.id} value={String(oficina.id)}>
                {oficina.nome}
              </option>
            ))}
          </select>
          {errors.oficinaId && <p className="mt-1 text-xs text-red-600">{errors.oficinaId.message}</p>}
        </div>
      ) : null}
    </>
  );

  const renderPainel = () => {
    if (!painel) return null;
    if (!clienteSelecionado) {
      return <p className="text-sm text-amber-800">Cliente não encontrado na lista. Feche e tente novamente.</p>;
    }

    if (painel.tela === "visualizar") {
      return (
        <div className="space-y-4">
          <DadosCliente cliente={clienteSelecionado} />
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <Button type="button" size="md" onClick={() => setPainel({ id: clienteSelecionado.id, tela: "editar" })}>
              Editar dados
            </Button>
            <Button type="button" variant="outline" size="md" onClick={() => setPainel({ id: clienteSelecionado.id, tela: "historico" })}>
              Ver histórico
            </Button>
          </div>
        </div>
      );
    }

    if (painel.tela === "editar") {
      return (
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit((values) =>
            atualizarMutacao.mutate(
              {
                id: clienteSelecionado.id,
                payload: {
                  ...montarPayload(values),
                  ativo: values.ativo
                }
              },
              { onSuccess: () => setPainel({ id: clienteSelecionado.id, tela: "visualizar" }) }
            )
          )}
        >
          {atualizarMutacao.isError && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(atualizarMutacao.error)}
            </p>
          )}
          {renderCamposCliente("cliente-edit", editForm.register, editForm.formState.errors)}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...editForm.register("ativo")} />
            Cliente ativo
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" size="md" disabled={atualizarMutacao.isPending}>
              {atualizarMutacao.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={() => setPainel({ id: clienteSelecionado.id, tela: "visualizar" })}>
              Cancelar
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <DadosCliente cliente={clienteSelecionado} />
        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">Histórico</h3>
          {historicoQuery.isLoading ? <p className="text-sm text-slate-600">Carregando histórico...</p> : null}
          {historicoQuery.isError ? (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(historicoQuery.error)}
            </p>
          ) : null}
          {historicoQuery.data ? (
            <div className="space-y-2">
              {historicoQuery.data.itens.length === 0 ? (
                <p className="text-sm text-slate-600">Nenhum lançamento para este cliente.</p>
              ) : (
                historicoQuery.data.itens.map((item) => (
                  <div key={`${item.tipo}-${item.id}-${item.data}`} className="rounded border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">
                      {item.tipo === "ORDEM_SERVICO" ? "OS" : "Venda"} · {item.descricao}
                    </p>
                    <p className="text-slate-600">
                      {new Date(item.data).toLocaleString("pt-BR")} · {item.status}
                    </p>
                    <p className="font-semibold text-slate-900">{moeda(item.valorTotal)}</p>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-600">Cadastre dados de contato e acompanhe histórico de OS e vendas.</p>
        </div>
        <Button type="button" size="md" className="self-start" onClick={() => setModalCadastro(true)}>
          Cadastrar cliente
        </Button>
      </div>

      <DataTable
        columns={colunas}
        data={clientesQuery.data ?? []}
        searchPlaceholder="Buscar cliente por nome, email, telefone, cidade ou status…"
        pageSize={10}
      />
      {erroRemover ? (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
          {erroRemover}
        </p>
      ) : null}

      <ModalShell open={modalCadastro} title="Novo cliente" onClose={() => setModalCadastro(false)}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) =>
            criarMutacao.mutate(
              montarPayload(values),
              {
                onSuccess: () => {
                  form.reset(clienteFormDefaults());
                  setModalCadastro(false);
                }
              }
            )
          )}
        >
          {criarMutacao.isError && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(criarMutacao.error)}
            </p>
          )}
          {renderCamposCliente("cliente-novo", form.register, form.formState.errors)}
          <Button type="submit" size="md" disabled={criarMutacao.isPending}>
            {criarMutacao.isPending ? "Salvando..." : "Salvar cliente"}
          </Button>
        </form>
      </ModalShell>

      <ModalShell
        open={!!painel}
        title={
          painel?.tela === "editar"
            ? "Editar cliente"
            : painel?.tela === "historico"
              ? "Cliente e histórico"
              : "Dados do cliente"
        }
        onClose={fecharPainel}
      >
        {renderPainel()}
      </ModalShell>
    </div>
  );
}
