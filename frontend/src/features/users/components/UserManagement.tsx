import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCriarUsuario, useRemoverUsuario, useUsuarios } from "@/features/users/hooks";
import type { UserRole } from "@/types";

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

export function UserManagement() {
  const userRole = (localStorage.getItem("auth_user_role") as UserRole | null) ?? "USUARIO";
  const usuarios = useUsuarios();
  const criar = useCriarUsuario();
  const remover = useRemoverUsuario();
  const form = useForm<FormState>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultState
  });

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

  const onSubmit = (values: FormState) => {
    const payload = userRole === "ADMIN" ? { ...values, role: "USUARIO" as const } : values;
    criar.mutate(payload, {
      onSuccess: () => form.reset(defaultState)
    });
  };

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Gestao de Usuarios</h2>
      <p className="mb-4 text-sm text-slate-600">
        Superadmin cria ADMIN e USUARIO. Admin cria somente USUARIO.
      </p>

      <form className="grid grid-cols-1 gap-2 md:grid-cols-5" onSubmit={form.handleSubmit(onSubmit)}>
        <input
          className="rounded-md border border-slate-300 p-2"
          placeholder="Nome"
          {...form.register("nome")}
        />
        <input
          className="rounded-md border border-slate-300 p-2"
          placeholder="Username"
          {...form.register("username")}
        />
        <input
          className="rounded-md border border-slate-300 p-2"
          placeholder="Senha"
          type="password"
          {...form.register("password")}
        />
        <select
          className="rounded-md border border-slate-300 p-2"
          {...form.register("role")}
          disabled={userRole === "ADMIN"}
        >
          {userRole === "SUPERADMIN" ? <option value="ADMIN">ADMIN</option> : null}
          <option value="USUARIO">USUARIO</option>
        </select>
        <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white">
          Criar
        </button>

        {userRole === "SUPERADMIN" && selectedRole === "USUARIO" ? (
          <select
            className="rounded-md border border-slate-300 p-2 md:col-span-2"
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
        ) : null}
        {form.formState.errors.nome ? <p className="text-xs text-red-600">{form.formState.errors.nome.message}</p> : null}
        {form.formState.errors.username ? <p className="text-xs text-red-600">{form.formState.errors.username.message}</p> : null}
        {form.formState.errors.password ? <p className="text-xs text-red-600">{form.formState.errors.password.message}</p> : null}
      </form>

      <div className="mt-6 space-y-2">
        {(usuarios.data ?? []).map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium">
                {u.nome} ({u.username}) - {u.role}
              </p>
              <p className="text-xs text-slate-500">
                Grupo admin: {u.createdByAdminId ?? "n/a"} | Ativo: {u.ativo ? "sim" : "nao"}
              </p>
            </div>
            {u.role !== "SUPERADMIN" ? (
              <button className="rounded bg-red-600 px-3 py-2 text-white" onClick={() => remover.mutate(u.id)}>
                Remover
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
