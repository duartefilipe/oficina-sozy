import { useState, type FormEvent } from "react";
import { login } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/lib/form-styles";

interface Props {
  onSuccess: () => void;
}

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
      onSuccess();
    } catch {
      setError("Login invalido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form className="w-full max-w-sm space-y-3 rounded-lg border border-slate-200 bg-white p-6" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold">Entrar</h1>
        <div>
          <label className={labelClass} htmlFor="login-user">
            Usuário
          </label>
          <input
            id="login-user"
            className={fieldClass}
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="login-pass">
            Senha
          </label>
          <input
            id="login-pass"
            type="password"
            className={fieldClass}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" size="md" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
