"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderClock,
  Building2,
  LogOut,
  Map,
  Menu,
  Sprout,
  UserRound,
  X,
  type LucideProps,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";

interface NavigationItem {
  label: string;
  href: string;
  icon: ComponentType<LucideProps>;
}

const primaryNavigationItems: NavigationItem[] = [
  { label: "Consola Geoespacial", href: "/mapa", icon: Map },
  { label: "Repositorio", href: "/historial", icon: FolderClock },
  { label: "Mi perfil", href: "/perfil", icon: UserRound },
];

const SIDEBAR_STORAGE_KEY = "biogrid-sidebar-collapsed";

interface TooltipProps {
  children: string;
  visible: boolean;
}

function SidebarTooltip({ children, visible }: TooltipProps) {
  if (!visible) return null;

  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:block"
    >
      {children}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { isAdmin } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigationItems = isAdmin
    ? [
        ...primaryNavigationItems,
        { label: "Administración", href: "/administracion", icon: Building2 },
      ]
    : primaryNavigationItems;

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (savedPreference !== null) {
      // La preferencia solo existe en el navegador y se aplica tras hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(savedPreference === "true");
    }

    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [hasLoadedPreference, isCollapsed]);

  useEffect(() => {
    // Cierra el drawer móvil después de cualquier navegación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  const toggleDesktopSidebar = () => {
    setIsCollapsed((currentValue) => !currentValue);
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <Link href="/mapa" className="flex items-center gap-2 font-bold text-emerald-900">
          <Sprout aria-hidden="true" className="h-6 w-6" />
          <span>BioGrid</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-controls="protected-sidebar"
          aria-expanded={isOpen}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <Menu aria-hidden="true" className="h-6 w-6" />
        </button>
      </header>

      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        id="protected-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-20" : "md:w-72"}`}
      >
        <div
          className={`flex h-20 shrink-0 items-center border-b border-slate-100 px-4 transition-all duration-300 ${
            isCollapsed ? "md:justify-center" : "md:justify-between md:px-6"
          }`}
        >
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            aria-label={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            className="group relative flex min-w-0 items-center gap-3 rounded-xl text-left text-emerald-900 outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
          >
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white transition group-hover:bg-emerald-900">
              <Sprout aria-hidden="true" className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 hidden h-5 w-5 place-items-center rounded-full border border-emerald-100 bg-white text-emerald-800 shadow-sm md:grid">
                {isCollapsed ? (
                  <ChevronRight aria-hidden="true" className="h-3 w-3" />
                ) : (
                  <ChevronLeft aria-hidden="true" className="h-3 w-3" />
                )}
              </span>
            </span>

            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isCollapsed
                  ? "md:max-w-0 md:opacity-0"
                  : "md:max-w-44 md:opacity-100"
              }`}
            >
              <span className="block text-lg font-bold leading-none">BioGrid</span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                Core Workspace
              </span>
            </span>

            <SidebarTooltip visible={isCollapsed}>Expandir menú</SidebarTooltip>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Navegación principal"
          className={`flex-1 space-y-1 px-4 py-6 transition-all duration-300 ${
            isCollapsed ? "md:px-3" : ""
          }`}
        >
          <p
            className={`mb-3 overflow-hidden whitespace-nowrap px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400 transition-all duration-300 ${
              isCollapsed ? "md:h-0 md:opacity-0" : "opacity-100"
            }`}
          >
            Plataforma
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                    isCollapsed
                      ? "md:justify-center md:gap-0 md:px-2"
                      : ""
                  } ${
                    isActive
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span
                    className={`max-w-48 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ${
                      isCollapsed
                        ? "md:max-w-0 md:opacity-0"
                        : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
                <SidebarTooltip visible={isCollapsed}>{item.label}</SidebarTooltip>
              </div>
            );
          })}
        </nav>

        <div className={`border-t border-slate-200 p-4 ${isCollapsed ? "md:p-3" : ""}`}>
          <div className="group relative">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label={isCollapsed ? "Cerrar sesión" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
                isCollapsed ? "md:justify-center md:gap-0 md:px-2" : ""
              }`}
            >
              <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span
                className={`max-w-40 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ${
                  isCollapsed
                    ? "md:max-w-0 md:opacity-0"
                    : ""
                }`}
              >
                {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </span>
            </button>
            <SidebarTooltip visible={isCollapsed}>Cerrar sesión</SidebarTooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
