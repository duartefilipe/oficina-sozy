import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { me } from "@/features/auth/api";
import { LoginForm } from "@/features/auth/LoginForm";
import { OrdemServicoForm } from "@/features/oficina/components/OrdemServicoForm";
import { RelatorioResumo } from "@/features/relatorios/components/RelatorioResumo";
import { UserManagement } from "@/features/users/components/UserManagement";
import { VendaRapidaForm } from "@/features/vendas/components/VendaRapidaForm";

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: me,
    enabled: !!token,
    retry: false
  });
  const userName = useMemo(() => meQuery.data?.nome ?? localStorage.getItem("auth_user_nome"), [meQuery.data]);
  const userRole = meQuery.data?.role ?? (localStorage.getItem("auth_user_role") as "SUPERADMIN" | "ADMIN" | "USUARIO" | null);

  if (!token) {
    return <LoginForm onSuccess={() => setToken(localStorage.getItem("auth_token"))} />;
  }

  useEffect(() => {
    if (meQuery.isError) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user_id");
      localStorage.removeItem("auth_user_nome");
      localStorage.removeItem("auth_username");
      localStorage.removeItem("auth_user_role");
      setToken(null);
    }
  }, [meQuery.isError]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between rounded bg-slate-900 px-4 py-2 text-white">
        <span>Logado como: {userName || "Usuario"}</span>
        <button
          className="rounded bg-slate-700 px-3 py-1"
          onClick={() => {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user_id");
            localStorage.removeItem("auth_user_nome");
            localStorage.removeItem("auth_username");
            localStorage.removeItem("auth_user_role");
            setToken(null);
          }}
        >
          Sair
        </button>
      </div>
      <Tabs defaultValue="oficina" className="mx-auto max-w-5xl">
        <TabsList>
          <TabsTrigger value="oficina">Oficina</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          {userRole !== "USUARIO" ? <TabsTrigger value="usuarios">Usuarios</TabsTrigger> : null}
          {userRole !== "USUARIO" ? <TabsTrigger value="relatorios">Relatorios</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="oficina">
          <OrdemServicoForm />
        </TabsContent>
        <TabsContent value="vendas">
          <VendaRapidaForm />
        </TabsContent>
        {userRole !== "USUARIO" ? (
          <TabsContent value="usuarios">
            <UserManagement />
          </TabsContent>
        ) : null}
        {userRole !== "USUARIO" ? (
          <TabsContent value="relatorios">
            <RelatorioResumo />
          </TabsContent>
        ) : null}
      </Tabs>
    </main>
  );
}

export default App;
