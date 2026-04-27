import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { me } from "@/features/auth/api";
import { AppLayout, type AppNavTab } from "@/components/layout/AppLayout";
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
  const [activeTab, setActiveTab] = useState<AppNavTab>("home");

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
    if (userRole === "USUARIO" && (activeTab === "usuarios" || activeTab === "oficinas")) {
      setActiveTab("home");
    } else if (userRole !== "SUPERADMIN" && activeTab === "oficinas") {
      setActiveTab("home");
    }
  }, [userRole, activeTab]);

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

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user_id");
    localStorage.removeItem("auth_user_nome");
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_user_role");
    localStorage.removeItem("auth_oficina_id");
    localStorage.removeItem("auth_oficina_nome");
    setToken(null);
    setActiveTab("home");
  };

  if (!token) {
    return <LoginForm onSuccess={() => setToken(localStorage.getItem("auth_token"))} />;
  }

  const renderPage = (tab: AppNavTab) => {
    switch (tab) {
      case "home":
        return <HomeDashboard />;
      case "oficina":
        return <OrdemServicoForm />;
      case "clientes":
        return <ClienteManagement />;
      case "estoque":
        return <ProdutoManagement />;
      case "vendas":
        return <VendaRapidaForm />;
      case "oficinas":
        return userRole === "SUPERADMIN" ? <OficinaManagement /> : null;
      case "usuarios":
        return userRole !== "USUARIO" ? <UserManagement /> : null;
      case "relatorios":
        return <RelatorioResumo />;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      userName={userName || "Usuário"}
      oficinaNome={oficinaNome}
      userRole={userRole}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={logout}
    >
      {(tab) => renderPage(tab)}
    </AppLayout>
  );
}

export default App;
