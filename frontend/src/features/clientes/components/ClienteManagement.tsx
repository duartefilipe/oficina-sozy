import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import { useAtualizarCliente, useClientes, useCriarCliente, useHistoricoCliente } from "@/features/clientes/hooks";
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

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  oficinaId: z.string().optional()
}).superRefine((values, ctx) => {
  const role = localStorage.getItem("auth_user_role");
  if (role === "SUPERADMIN" && !values.oficinaId) {
    ctx.addIssue({
      path: ["oficinaId"],
      code: "custom",
      message: "Selecione a oficina do cliente."
    });
  }
});

type FormValues = z.infer<typeof schema>;

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

export function ClienteManagement() {
  const userRole = localStorage.getItem("auth_user_role");
  const oficinasQuery = useOficinas();
  const clientesQuery = useClientes();
  const criarMutacao = useCriarCliente();
  const atualizarMutacao = useAtualizarCliente();
  const [modalCadastro, setModalCadastro] = useState(false);
  const [clienteHistoricoId, setClienteHistoricoId] = useState<number | null>(null);
  const historicoQuery = useHistoricoCliente(clienteHistoricoId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", oficinaId: "" }
  });

  const colunas = useMemo<ColumnDef<ClienteResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "nome", header: "Nome" },
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
            <Button type="button" variant="outline" size="sm" onClick={() => setClienteHistoricoId(row.original.id)}>
              Histórico
            </Button>
            <Button
              type="button"
              variant={row.original.ativo ? "warning" : "dark"}
              size="sm"
              onClick={() =>
                atualizarMutacao.mutate({
                  id: row.original.id,
                  payload: { nome: row.original.nome, ativo: !row.original.ativo }
                })
              }
            >
              {row.original.ativo ? "Inativar" : "Ativar"}
            </Button>
          </div>
        )
      }
    ],
    [atualizarMutacao]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-600">Cadastre clientes e acompanhe histórico de OS e vendas.</p>
        </div>
        <Button type="button" size="md" className="self-start" onClick={() => setModalCadastro(true)}>
          Cadastrar cliente
        </Button>
      </div>

      <DataTable
        columns={colunas}
        data={clientesQuery.data ?? []}
        searchPlaceholder="Buscar cliente por nome, id ou status…"
        pageSize={10}
      />

      <ModalShell open={modalCadastro} title="Novo cliente" onClose={() => setModalCadastro(false)}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) =>
            criarMutacao.mutate(
              {
                nome: values.nome.trim(),
                oficinaId: userRole === "SUPERADMIN" && values.oficinaId ? Number(values.oficinaId) : undefined
              },
              {
                onSuccess: () => {
                  form.reset({ nome: "", oficinaId: "" });
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
          <div>
            <label className={labelClass} htmlFor="cliente-nome">
              Nome
            </label>
            <input id="cliente-nome" className={fieldClass} placeholder="Nome do cliente" {...form.register("nome")} />
            {form.formState.errors.nome && <p className="mt-1 text-xs text-red-600">{form.formState.errors.nome.message}</p>}
          </div>
          {userRole === "SUPERADMIN" ? (
            <div>
              <label className={labelClass} htmlFor="cliente-oficina">
                Oficina
              </label>
              <select id="cliente-oficina" className={fieldClass} {...form.register("oficinaId")}>
                <option value="">Selecione a oficina</option>
                {(oficinasQuery.data ?? []).map((oficina) => (
                  <option key={oficina.id} value={String(oficina.id)}>
                    {oficina.nome}
                  </option>
                ))}
              </select>
              {form.formState.errors.oficinaId && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.oficinaId.message}</p>
              )}
            </div>
          ) : null}
          <Button type="submit" size="md" disabled={criarMutacao.isPending}>
            {criarMutacao.isPending ? "Salvando..." : "Salvar cliente"}
          </Button>
        </form>
      </ModalShell>

      <ModalShell
        open={clienteHistoricoId != null}
        title={historicoQuery.data ? `Histórico de ${historicoQuery.data.clienteNome}` : "Histórico do cliente"}
        onClose={() => setClienteHistoricoId(null)}
      >
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
      </ModalShell>
    </div>
  );
}
