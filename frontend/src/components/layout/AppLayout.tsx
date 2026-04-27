import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppTheme, type AppThemeMode } from "@/hooks/useAppTheme";

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
  { id: "oficina", label: "Ordens de serviço" },
  { id: "clientes", label: "Clientes" },
  { id: "estoque", label: "Estoque" },
  { id: "vendas", label: "Vendas" },
  { id: "oficinas", label: "Oficinas", superadminOnly: true },
  { id: "usuarios", label: "Usuários", hideForUsuario: true },
  { id: "relatorios", label: "Relatórios" }
];

const SIDEBAR_COLLAPSED_KEY = "app_sidebar_collapsed";

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [themeMode, setThemeMode] = useAppTheme();

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

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
  const collapsedDesktop = sidebarCollapsed;

  return (
    <div className="flex min-h-screen bg-slate-50/90 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-[width,transform] duration-200 dark:border-slate-700/80 dark:bg-slate-900 lg:static lg:z-0 lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsedDesktop && "lg:w-[4.5rem]"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-3 dark:border-slate-800",
            collapsedDesktop ? "lg:justify-center lg:px-2" : "px-5"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            M
          </div>
          <div className={cn("min-w-0 flex-1", collapsedDesktop && "lg:hidden")}>
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Moto Manager</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Gestão de oficina</p>
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:inline-flex"
              aria-label={collapsedDesktop ? "Expandir menu lateral" : "Recolher menu lateral"}
              title={collapsedDesktop ? "Expandir menu" : "Só ícones"}
              onClick={() => setSidebarCollapsed((c) => !c)}
            >
              {collapsedDesktop ? <IconChevronRight /> : <IconChevronLeft />}
            </button>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className={cn("flex-1 space-y-0.5 overflow-y-auto p-2", collapsedDesktop && "lg:p-2")}>
          {visibleNav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              title={collapsedDesktop ? item.label : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                collapsedDesktop && "lg:justify-center lg:px-2",
                activeTab === item.id
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <NavIcon tab={item.id} active={activeTab === item.id} />
              <span className={cn(collapsedDesktop && "lg:sr-only")}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div
          className={cn(
            "border-t border-slate-100 p-4 dark:border-slate-800",
            collapsedDesktop && "lg:flex lg:flex-col lg:items-center lg:px-2 lg:py-3"
          )}
        >
          <ThemePicker mode={themeMode} onChange={setThemeMode} collapsed={collapsedDesktop} />
          <div className={cn("mt-3", collapsedDesktop && "lg:mt-3 lg:w-full lg:text-center")}>
            <p
              className={cn(
                "truncate text-xs font-medium text-slate-500 dark:text-slate-400",
                collapsedDesktop && "lg:sr-only"
              )}
            >
              Sessão
            </p>
            <p
              className={cn(
                "truncate text-sm font-semibold text-slate-900 dark:text-slate-50",
                collapsedDesktop && "lg:sr-only"
              )}
            >
              {userName || "Usuário"}
            </p>
            {oficinaNome ? (
              <p className={cn("mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400", collapsedDesktop && "lg:sr-only")}>
                {oficinaNome}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "mt-3 w-full border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
              collapsedDesktop && "lg:mt-2 lg:w-auto lg:min-w-0 lg:px-2"
            )}
            title="Sair"
            onClick={onLogout}
          >
            <span className={cn(collapsedDesktop && "lg:sr-only")}>Sair</span>
            <span className={cn("hidden", collapsedDesktop && "lg:inline-flex")} aria-hidden>
              <IconLogout className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/85 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
              {currentLabel}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
              {oficinaNome ? `${oficinaNome} · ` : ""}
              {userRole === "SUPERADMIN" ? "Superadmin" : userRole === "ADMIN" ? "Administrador" : "Usuário"}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as AppNavTab)} className="mx-auto w-full max-w-7xl">
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

function ThemePicker({
  mode,
  onChange,
  collapsed
}: {
  mode: AppThemeMode;
  onChange: (m: AppThemeMode) => void;
  collapsed: boolean;
}) {
  const btn = (m: AppThemeMode, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => onChange(m)}
      title={label}
      aria-label={label}
      aria-pressed={mode === m}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-slate-600 transition-colors dark:text-slate-300",
        mode === m
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", collapsed && "lg:flex-col lg:justify-center")}>
      <span
        className={cn(
          "mr-1 w-full text-xs font-medium text-slate-500 dark:text-slate-400 lg:w-auto",
          collapsed && "lg:sr-only"
        )}
      >
        Tema
      </span>
      {btn("system", "Seguir cor do sistema", <IconSystem />)}
      {btn("light", "Tema claro", <IconSun />)}
      {btn("dark", "Tema escuro", <IconMoon />)}
    </div>
  );
}

function NavIcon({ tab, active }: { tab: AppNavTab; active: boolean }) {
  const cls = cn("h-5 w-5 shrink-0", active ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500");
  switch (tab) {
    case "home":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    case "oficina":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "clientes":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    case "estoque":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      );
    case "vendas":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    case "oficinas":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case "usuarios":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case "relatorios":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
  }
}

function IconChevronLeft() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function IconSun() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function IconSystem() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
