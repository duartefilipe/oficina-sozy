import type { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useAtualizarOficina, useCriarOficina, useOficinas } from "@/features/oficinas/hooks";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { getApiErrorMessage } from "@/lib/utils";
import type { OficinaResponseDto } from "@/types";

const schema = z.object({
  nome: z.string().trim().min(2, "Nome da oficina é obrigatório")
});

type FormState = z.infer<typeof schema>;

const defaultState: FormState = { nome: "" };

interface EditState {
  nome: string;
  ativo: boolean;
}

const defaultEdit: EditState = { nome: "", ativo: true };

export function OficinaManagement() {
  const oficinas = useOficinas();
  const criar = useCriarOficina();
  const atualizar = useAtualizarOficina();
  const form = useForm<FormState>({ resolver: zodResolver(schema), defaultValues: defaultState });
  const editForm = useForm<EditState>({ defaultValues: defaultEdit });
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const columns = useMemo<ColumnDef<OficinaResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "nome", header: "Nome" },
      { accessorKey: "ativo", header: "Ativa", cell: ({ getValue }) => ((getValue() as boolean) ? "Sim" : "Não") },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="warning"
              onClick={() => {
                setEditandoId(row.original.id);
                editForm.reset({ nome: row.original.nome, ativo: row.original.ativo });
              }}
            >
              Editar
            </Button>
          </div>
        )
      }
    ],
    [editForm]
  );

  const onCreate = (values: FormState) => {
    criar.mutate(values, {
      onSuccess: () => form.reset(defaultState)
    });
  };

  const onEdit = (values: EditState) => {
    if (!editandoId) return;
    atualizar.mutate(
      { oficinaId: editandoId, payload: values },
      {
        onSuccess: () => {
          setEditandoId(null);
          editForm.reset(defaultEdit);
        }
      }
    );
  };

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Gestão de Oficinas</h2>
      <p className="mb-4 text-sm text-slate-600">Crie e mantenha oficinas para separar usuários e dados operacionais.</p>

      {(criar.isError || atualizar.isError) ? (
        <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {getApiErrorMessage(criar.isError ? criar.error : atualizar.error)}
        </p>
      ) : null}

      <form className="flex flex-wrap items-end gap-2" onSubmit={form.handleSubmit(onCreate)}>
        <div className="min-w-[260px] flex-1">
          <label className={labelClass} htmlFor="ofc-nome">
            Nome da oficina
          </label>
          <input id="ofc-nome" className={fieldClass} placeholder="Ex.: Oficina Centro" {...form.register("nome")} />
        </div>
        <Button type="submit" size="md" disabled={criar.isPending}>
          {criar.isPending ? "Salvando…" : "Criar oficina"}
        </Button>
      </form>

      {editandoId ? (
        <form className="mt-4 rounded-md border border-slate-200 p-4" onSubmit={editForm.handleSubmit(onEdit)}>
          <p className="mb-2 text-sm font-medium text-slate-800">Editando oficina #{editandoId}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nome</label>
              <input className={fieldClass} {...editForm.register("nome")} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={fieldClass}
                {...editForm.register("ativo", { setValueAs: (v) => v === true || v === "true" })}
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" variant="warning" size="md" disabled={atualizar.isPending}>
              {atualizar.isPending ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={() => setEditandoId(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-6">
        <DataTable columns={columns} data={oficinas.data ?? []} searchPlaceholder="Buscar por nome…" pageSize={10} />
      </div>
    </section>
  );
}
