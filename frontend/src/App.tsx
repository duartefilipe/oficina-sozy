import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { me } from "@/features/auth/api";
import { ClienteManagement } from "@/features/clientes/components/ClienteManagement";
import { ProdutoManagement } from "@/features/estoque/components/ProdutoManagement";
import { LoginForm } from "@/features/auth/LoginForm";
import { HomeDashboard } from "@/features/home/components/HomeDashboard";
import { OficinaManagement } from "@/features/oficinas/components/OficinaManagement";
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
  const oficinaNome = meQuery.data?.oficinaNome ?? localStorage.getItem("auth_oficina_nome");

  useEffect(() => {
    if (!token || !meQuery.isError) return;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user_id");
    localStorage.removeItem("auth_user_nome");
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_user_role");
    localStorage.removeItem("auth_oficina_id");
    localStorage.removeItem("auth_oficina_nome");
    setToken(null);
  }, [token, meQuery.isError]);

  if (!token) {
    return <LoginForm onSuccess={() => setToken(localStorage.getItem("auth_token"))} />;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-2 rounded border border-slate-700 bg-slate-900 px-4 py-2.5 text-white shadow-sm">
        <span className="text-sm font-medium">
          Logado como: {userName || "Usuario"}
          {oficinaNome ? ` · ${oficinaNome}` : ""}
        </span>
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user_id");
            localStorage.removeItem("auth_user_nome");
            localStorage.removeItem("auth_username");
            localStorage.removeItem("auth_user_role");
            localStorage.removeItem("auth_oficina_id");
            localStorage.removeItem("auth_oficina_nome");
            setToken(null);
          }}
        >
          Sair
        </Button>
      </div>
      <Tabs defaultValue="home" className="mx-auto max-w-5xl">
        <TabsList>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="oficina">Oficina</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          {userRole === "SUPERADMIN" ? <TabsTrigger value="oficinas">Oficinas</TabsTrigger> : null}
          {userRole !== "USUARIO" ? <TabsTrigger value="usuarios">Usuarios</TabsTrigger> : null}
          <TabsTrigger value="relatorios">Relatorios</TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <HomeDashboard />
        </TabsContent>
        <TabsContent value="oficina">
          <OrdemServicoForm />
        </TabsContent>
        <TabsContent value="clientes">
          <ClienteManagement />
        </TabsContent>
        <TabsContent value="estoque">
          <ProdutoManagement />
        </TabsContent>
        <TabsContent value="vendas">
          <VendaRapidaForm />
        </TabsContent>
        {userRole === "SUPERADMIN" ? (
          <TabsContent value="oficinas">
            <OficinaManagement />
          </TabsContent>
        ) : null}
        {userRole !== "USUARIO" ? (
          <TabsContent value="usuarios">
            <UserManagement />
          </TabsContent>
        ) : null}
        <TabsContent value="relatorios">
          <RelatorioResumo />
        </TabsContent>
      </Tabs>
    </main>
  );
}

export default App;
