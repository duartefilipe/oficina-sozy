import type { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAtualizarUsuario, useCriarUsuario, useRemoverUsuario, useUsuarios } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { fieldClass, labelClass } from "@/lib/form-styles";
import type { UserResponseDto, UserRole } from "@/types";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["SUPERADMIN", "ADMIN", "USUARIO"]),
  createdByAdminId: z.number().int().positive().optional()
});

type FormState = z.infer<typeof formSchema>;

const defaultState: FormState = {
  nome: "",
  username: "",
  password: "",
  role: "USUARIO"
};

interface EditFormState {
  nome: string;
  username: string;
  password: string;
  role: UserRole;
  createdByAdminId?: number;
  ativo: boolean;
}

const defaultEditState: EditFormState = {
  nome: "",
  username: "",
  password: "",
  role: "USUARIO",
  ativo: true
};

export function UserManagement() {
  const userRole = (localStorage.getItem("auth_user_role") as UserRole | null) ?? "USUARIO";
  const usuarios = useUsuarios();
  const criar = useCriarUsuario();
  const atualizar = useAtualizarUsuario();
  const remover = useRemoverUsuario();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const form = useForm<FormState>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultState
  });
  const editForm = useForm<EditFormState>({ defaultValues: defaultEditState });

  if (userRole === "USUARIO") {
    return (
      <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <p className="text-sm text-slate-600">Seu perfil nao possui permissao para gerenciar usuarios.</p>
      </section>
    );
  }

  const admins = (usuarios.data ?? []).filter((u) => u.role === "ADMIN");
  const selectedRole = form.watch("role");
  const selectedEditRole = editForm.watch("role");

  const colunasUsuarios = useMemo<ColumnDef<UserResponseDto>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "nome", header: "Nome" },
      { accessorKey: "username", header: "Usuário" },
      { accessorKey: "role", header: "Perfil" },
      {
        accessorKey: "createdByAdminId",
        header: "Grupo (admin)",
        cell: ({ getValue }) => (getValue() != null ? String(getValue()) : "—")
      },
      {
        accessorKey: "ativo",
        header: "Ativo",
        cell: ({ getValue }) => ((getValue() as boolean) ? "Sim" : "Não")
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          if (u.role === "SUPERADMIN") {
            return <span className="text-slate-500">—</span>;
          }
          return (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="warning"
                size="md"
                onClick={() => {
                  setEditandoId(u.id);
                  editForm.reset({
                    nome: u.nome,
                    username: u.username,
                    password: "",
                    role: u.role,
                    createdByAdminId: u.createdByAdminId,
                    ativo: u.ativo
                  });
                }}
              >
                Editar
              </Button>
              <Button type="button" variant="danger" size="md" onClick={() => remover.mutate(u.id)}>
                Remover
              </Button>
            </div>
          );
        }
      }
    ],
    [editForm, remover]
  );

  const onSubmit = (values: FormState) => {
    const payload = userRole === "ADMIN" ? { ...values, role: "USUARIO" as const } : values;
    criar.mutate(payload, {
      onSuccess: () => form.reset(defaultState)
    });
  };

  const onSubmitEdicao = (values: EditFormState) => {
    if (!editandoId) return;
    const payload =
      userRole === "ADMIN"
        ? { ...values, role: "USUARIO" as const, createdByAdminId: undefined }
        : values;
    atualizar.mutate(
      {
        userId: editandoId,
        payload: {
          ...payload,
          password: payload.password || undefined
        }
      },
      {
        onSuccess: () => {
          setEditandoId(null);
          editForm.reset(defaultEditState);
        }
      }
    );
  };

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Gestao de Usuarios</h2>
      <p className="mb-4 text-sm text-slate-600">
        Superadmin cria ADMIN e USUARIO. Admin cria somente USUARIO.
      </p>

      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div>
          <label className={labelClass} htmlFor="u-nome">
            Nome
          </label>
          <input id="u-nome" className={fieldClass} placeholder="Nome" {...form.register("nome")} />
        </div>
        <div>
          <label className={labelClass} htmlFor="u-user">
            Usuário
          </label>
          <input id="u-user" className={fieldClass} placeholder="Username" {...form.register("username")} />
        </div>
        <div>
          <label className={labelClass} htmlFor="u-pass">
            Senha
          </label>
          <input
            id="u-pass"
            className={fieldClass}
            placeholder="Senha"
            type="password"
            {...form.register("password")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="u-role">
            Perfil
          </label>
          <select id="u-role" className={fieldClass} {...form.register("role")} disabled={userRole === "ADMIN"}>
            {userRole === "SUPERADMIN" ? <option value="ADMIN">ADMIN</option> : null}
            <option value="USUARIO">USUARIO</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full sm:w-auto" size="md">
            Criar
          </Button>
        </div>

        {userRole === "SUPERADMIN" && selectedRole === "USUARIO" ? (
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="u-grupo">
              Grupo (admin)
            </label>
            <select
              id="u-grupo"
              className={fieldClass}
              {...form.register("createdByAdminId", {
                setValueAs: (v) => (v === "" ? undefined : Number(v))
              })}
            >
              <option value="">Selecione o ADMIN do grupo</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.nome} ({admin.username})
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {(form.formState.errors.nome || form.formState.errors.username || form.formState.errors.password) ? (
          <div className="col-span-full space-y-1">
            {form.formState.errors.nome ? <p className="text-xs text-red-600">{form.formState.errors.nome.message}</p> : null}
            {form.formState.errors.username ? <p className="text-xs text-red-600">{form.formState.errors.username.message}</p> : null}
            {form.formState.errors.password ? <p className="text-xs text-red-600">{form.formState.errors.password.message}</p> : null}
          </div>
        ) : null}
      </form>

      {editandoId ? (
        <form
          className="mt-6 space-y-3 rounded-md border border-slate-200 p-4"
          onSubmit={editForm.handleSubmit(onSubmitEdicao)}
        >
          <p className="text-sm font-medium text-slate-800">Editando usuário #{editandoId}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Nome</label>
              <input className={fieldClass} placeholder="Nome" {...editForm.register("nome")} />
            </div>
            <div>
              <label className={labelClass}>Usuário</label>
              <input className={fieldClass} placeholder="Username" {...editForm.register("username")} />
            </div>
            <div>
              <label className={labelClass}>Nova senha (opcional)</label>
              <input
                className={fieldClass}
                placeholder="Opcional"
                type="password"
                {...editForm.register("password")}
              />
            </div>
            <div>
              <label className={labelClass}>Perfil</label>
              <select className={fieldClass} {...editForm.register("role")} disabled={userRole === "ADMIN"}>
                {userRole === "SUPERADMIN" ? <option value="ADMIN">ADMIN</option> : null}
                <option value="USUARIO">USUARIO</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Ativo</label>
              <select
                className={fieldClass}
                {...editForm.register("ativo", { setValueAs: (v) => v === "true" || v === true })}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            {userRole === "SUPERADMIN" && selectedEditRole === "USUARIO" ? (
              <div>
                <label className={labelClass}>Grupo (admin)</label>
                <select
                  className={fieldClass}
                  {...editForm.register("createdByAdminId", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v))
                  })}
                >
                  <option value="">Selecione o ADMIN do grupo</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.nome} ({admin.username})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="warning" size="md">
              Salvar alterações
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setEditandoId(null);
                editForm.reset(defaultEditState);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Usuários cadastrados</h3>
        <DataTable
          columns={colunasUsuarios}
          data={usuarios.data ?? []}
          searchPlaceholder="Buscar por nome, usuário, perfil…"
          pageSize={10}
        />
      </div>
    </section>
  );
}
