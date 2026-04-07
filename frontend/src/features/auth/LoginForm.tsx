import { useState, type FormEvent } from "react";
import { login } from "@/features/auth/api";

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
        <input
          className="w-full rounded-md border border-slate-300 p-2"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-md border border-slate-300 p-2"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded bg-blue-700 px-4 py-2 text-white" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
