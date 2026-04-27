import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppNavTab =
  | "home"
  | "oficina"
  | "clientes"
  | "estoque"
  | "vendas"
  | "oficinas"
  | "usuarios"
  | "relatorios";

const navItems: { id: AppNavTab; label: string; superadminOnly?: boolean; hideForUsuario?: boolean }[] = [
  { id: "home", label: "Início" },
  { id: "oficina", label: "Oficina" },
  { id: "clientes", label: "Clientes" },
  { id: "estoque", label: "Estoque" },
  { id: "vendas", label: "Vendas" },
  { id: "oficinas", label: "Oficinas", superadminOnly: true },
  { id: "usuarios", label: "Usuários", hideForUsuario: true },
  { id: "relatorios", label: "Relatórios" }
];

type Props = {
  userName: string;
  oficinaNome: string | null;
  userRole: "SUPERADMIN" | "ADMIN" | "USUARIO" | null;
  activeTab: AppNavTab;
  onTabChange: (tab: AppNavTab) => void;
  onLogout: () => void;
  children: (tab: AppNavTab) => ReactNode;
};

export function AppLayout({ userName, oficinaNome, userRole, activeTab, onTabChange, onLogout, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  const visibleNav = navItems.filter((item) => {
    if (item.superadminOnly && userRole !== "SUPERADMIN") return false;
    if (item.hideForUsuario && userRole === "USUARIO") return false;
    return true;
  });

  const go = (tab: AppNavTab) => {
    onTabChange(tab);
    setSidebarOpen(false);
  };

  const currentLabel = visibleNav.find((n) => n.id === activeTab)?.label ?? "Menu";

  return (
    <div className="flex min-h-screen bg-slate-50/90 text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">Moto Manager</p>
            <p className="truncate text-xs text-slate-500">Gestão de oficina</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <NavIcon tab={item.id} active={activeTab === item.id} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <p className="truncate text-xs font-medium text-slate-500">Sessão</p>
          <p className="truncate text-sm font-semibold text-slate-900">{userName || "Usuário"}</p>
          {oficinaNome ? <p className="mt-0.5 truncate text-xs text-slate-500">{oficinaNome}</p> : null}
          <Button type="button" variant="outline" size="sm" className="mt-3 w-full border-slate-200" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{currentLabel}</h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              {oficinaNome ? `${oficinaNome} · ` : ""}
              {userRole === "SUPERADMIN" ? "Superadmin" : userRole === "ADMIN" ? "Administrador" : "Usuário"}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as AppNavTab)} className="w-full max-w-7xl mx-auto">
            <TabsList className="sr-only">
              {visibleNav.map((item) => (
                <TabsTrigger key={item.id} value={item.id}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {visibleNav.map((item) => (
              <TabsContent key={item.id} value={item.id} className="mt-0 outline-none focus-visible:outline-none">
                {children(item.id)}
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ tab, active }: { tab: AppNavTab; active: boolean }) {
  const cls = cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400");
  switch (tab) {
    case "home":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "oficina":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "relatorios":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
  }
}
