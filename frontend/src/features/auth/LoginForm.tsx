import { useState, type FormEvent } from "react";
import { login } from "@/features/auth/api";
import { Button } from "@/components/ui/button";

interface Props {
  onSuccess: () => void;
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10";

export function LoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({ username, password });
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user_id", String(result.userId));
      localStorage.setItem("auth_user_nome", result.nome);
      localStorage.setItem("auth_username", result.username);
      localStorage.setItem("auth_user_role", result.role);
      if (result.oficinaId != null) {
        localStorage.setItem("auth_oficina_id", String(result.oficinaId));
      } else {
        localStorage.removeItem("auth_oficina_id");
      }
      if (result.oficinaNome) {
        localStorage.setItem("auth_oficina_nome", result.oficinaNome);
      } else {
        localStorage.removeItem("auth_oficina_nome");
      }
      onSuccess();
    } catch {
      setError("Usuário ou senha inválidos. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-center bg-slate-900 px-6 py-12 text-white lg:px-16 lg:py-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700/50 via-slate-900 to-slate-950" />
        <div className="relative mx-auto w-full max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold text-slate-900 shadow-lg">
              M
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Moto Manager</p>
              <p className="text-sm text-slate-400">Gestão de oficina, estoque e vendas</p>
            </div>
          </div>
          <div className="hidden space-y-4 text-slate-300 lg:block">
            <p className="text-2xl font-semibold leading-snug tracking-tight text-white">
              Tudo o que a oficina precisa, num só lugar.
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Ordens de serviço e clientes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Estoque e PDV
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Relatórios e visão gerencial
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Acesso</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Entrar na conta</h1>
          </div>
          <div className="hidden lg:mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar</h1>
            <p className="mt-1 text-sm text-slate-500">Use suas credenciais para continuar.</p>
          </div>

          <form
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 sm:p-8"
            onSubmit={onSubmit}
          >
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="login-user">
                  Usuário
                </label>
                <input
                  id="login-user"
                  className={inputClass}
                  placeholder="nome.de.usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="login-pass">
                  Senha
                </label>
                <input
                  id="login-pass"
                  type="password"
                  className={inputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="mt-6 h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold hover:bg-slate-800" size="md" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>

            <p className="mt-6 text-center text-xs text-slate-400">Ambiente seguro. Em caso de dúvida, fale com o administrador.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
