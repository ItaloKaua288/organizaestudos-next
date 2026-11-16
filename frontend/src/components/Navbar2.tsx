"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { checkAuth as checkAuthApi, logout } from "@/services/login.service";
import { CalendarClock, Captions, ChartColumn, ChevronDown, CircleUser, Kanban, Keyboard, Layers, LayoutDashboard, LogOut, Menu, NotepadText, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, RotateCw, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalSearch } from "./global-search";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { Logo, LogoSvg } from "./logo";
import { useNavPrefs } from "./nav-prefs-provider";
import { ProfileSwitcher } from "./profile-switcher";

import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
    () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
    {
        ssr: false,
    }
);

type NavItem = { href: string; label: string; description: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

// Itens agrupados pela intenção de uso. Grupo com um item só vira link direto na barra.
const NAV_GROUPS: NavGroup[] = [
    {
        label: "Hoje",
        items: [
            { href: "/", label: "Dashboard", description: "O que estudar e revisar hoje", icon: LayoutDashboard },
            { href: "/revisoes", label: "Revisões", description: "Revisões pendentes e agendadas", icon: RotateCw },
        ],
    },
    {
        label: "Estudar",
        items: [
            { href: "/materias", label: "Matérias", description: "Assuntos de cada matéria", icon: Captions },
            { href: "/flashcards", label: "Flashcards", description: "Baralhos para memorizar", icon: Layers },
            { href: "/notas", label: "Notas", description: "Anotações por matéria", icon: NotepadText },
        ],
    },
    {
        label: "Planejar",
        items: [
            { href: "/cronograma", label: "Cronograma", description: "Semana e ciclo de estudos", icon: CalendarClock },
            { href: "/kanban", label: "Quadro", description: "Arraste os assuntos entre colunas", icon: Kanban },
        ],
    },
    {
        label: "Acompanhar",
        items: [
            { href: "/desempenho", label: "Desempenho", description: "Acertos e pontos fracos", icon: ChartColumn },
        ],
    },
];

// Atalhos da barra inferior (celular). Os demais destinos ficam no "Mais".
const BOTTOM_LINKS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/materias", label: "Matérias", icon: Captions },
    { href: "/revisoes", label: "Revisões", icon: RotateCw },
    { href: "/cronograma", label: "Cronograma", icon: CalendarClock },
] as const;

const ADMIN_CACHE_KEY = "oe:is-admin";
const NAME_CACHE_KEY = "oe:user-name";

const NAV_TRIGGER_CLASS =
    "flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";
const NAV_ACTIVE_CLASS = "bg-foreground/10 text-foreground";
const NAV_IDLE_CLASS = "text-muted-foreground hover:bg-foreground/6 hover:text-foreground";

/** Selo com a quantidade pendente. O texto escondido avisa leitores de tela; o número sozinho não diz o quê. */
function CountBadge({ count, className }: { count: number; className?: string }) {
    if (count <= 0) return null;

    return (
        <span
            className={cn(
                "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums",
                className
            )}
        >
            {count > 99 ? "99+" : count}
            <span className="sr-only"> {count === 1 ? "revisão pendente" : "revisões pendentes"}</span>
        </span>
    );
}

/** Versão do selo para a sidebar recolhida: um pontinho no canto do ícone. */
function CountDot({ count }: { count: number }) {
    if (count <= 0) return null;

    return (
        <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-primary ring-2 ring-background">
            <span className="sr-only">{count === 1 ? "1 revisão pendente" : `${count} revisões pendentes`}</span>
        </span>
    );
}

const RAIL_CLASS =
    "flex items-center justify-center rounded-xl py-2.5 transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";

/** Ações da sidebar recolhida: só o ícone, com o nome no tooltip nativo (title) e para leitores de tela. */
function RailLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
    return (
        <Link href={href} title={label} aria-label={label} aria-current={active ? "page" : undefined} className={cn(RAIL_CLASS, active ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS)}>
            <Icon className="size-4" />
        </Link>
    );
}

function RailButton({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
    return (
        <button type="button" title={label} aria-label={label} onClick={onClick} className={cn(RAIL_CLASS, NAV_IDLE_CLASS)}>
            <Icon className="size-4" />
        </button>
    );
}

/** Grupo da barra (desktop): abre uma lista com ícone, nome e uma linha explicando cada tela. */
function NavGroupMenu({ group, isActive, counts }: { group: NavGroup; isActive: (href: string) => boolean; counts: Record<string, number> }) {
    const [open, setOpen] = useState(false);
    const groupActive = group.items.some((item) => isActive(item.href));
    const groupCount = group.items.reduce((sum, item) => sum + (counts[item.href] ?? 0), 0);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className={cn(NAV_TRIGGER_CLASS, groupActive ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS)}>
                {group.label} <CountBadge count={groupCount} /> <ChevronDown className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 gap-0.5 p-1.5">
                {group.items.map(({ href, label, description, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(href) ? "page" : undefined}
                        className={cn(
                            "flex items-start gap-3 rounded-xl px-3 py-2 transition-colors",
                            isActive(href) ? "bg-foreground/10" : "hover:bg-foreground/6"
                        )}
                    >
                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                {label}
                                <CountBadge count={counts[href] ?? 0} />
                            </span>
                            <span className="text-xs text-muted-foreground">{description}</span>
                        </span>
                    </Link>
                ))}
            </PopoverContent>
        </Popover>
    );
}

/**
 * `hasToken` vem do servidor (cookie de sessão). O proxy já barra quem não tem token, então a barra
 * aparece completa de imediato, sem esperar a chamada à API. A verificação real roda em segundo plano
 * (fora do caminho crítico de renderização) só para confirmar a sessão e descobrir se é admin.
 */
export function Navbar2({ hasToken = false, pendingReviews = 0 }: { hasToken?: boolean; pendingReviews?: number }) {
    const { prefs, update } = useNavPrefs();
    const { collapsed, side } = prefs;
    const sidebarMode = prefs.layout === "sidebar";
    // A sidebar só existe a partir de xl. Os widgets com atalho global (busca, perfil) ficam montados em
    // um lugar só: na sidebar em telas grandes, na barra do topo nas demais.
    const isDesktop = useMediaQuery("(min-width: 1280px)");
    const inSidebar = sidebarMode && isDesktop;
    // Selos por destino do menu (hoje só as revisões pendentes).
    const counts: Record<string, number> = { "/revisoes": pendingReviews };
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const isLoading = false;

    useEffect(() => {
        let cancelled = false;

        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (sessionStorage.getItem(ADMIN_CACHE_KEY) === "1") setIsAdmin(true);
            const cachedName = sessionStorage.getItem(NAME_CACHE_KEY);
            if (cachedName) setUserName(cachedName);
        } catch {
            // sessionStorage indisponível: segue sem cache
        }

        const checkAuth = async () => {
            try {
                const response = await checkAuthApi();
                if (cancelled) return;
                setIsAuthenticated(response.success);
                const admin = Boolean(response.user?.isAdmin);
                setIsAdmin(admin);
                const name = response.user?.name?.trim() || null;
                setUserName(name);
                try {
                    sessionStorage.setItem(ADMIN_CACHE_KEY, admin ? "1" : "0");
                    if (name) sessionStorage.setItem(NAME_CACHE_KEY, name);
                } catch { }
                if (!response.success)
                    router.push("/login");
            } catch {
                if (!cancelled) setIsAuthenticated(false);
            }
        };

        // Adia a verificação para depois da hidratação/pintura da página.
        const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
        const hasIdle = typeof w.requestIdleCallback === "function";
        const handle = hasIdle
            ? w.requestIdleCallback!(checkAuth, { timeout: 2000 })
            : window.setTimeout(checkAuth, 300);

        return () => {
            cancelled = true;
            if (hasIdle && w.cancelIdleCallback) w.cancelIdleCallback(handle);
            else window.clearTimeout(handle);
        };
    }, [router]);

    const handleLogout = async () => {
        try {
            await logout();
            try {
                sessionStorage.removeItem(ADMIN_CACHE_KEY);
                sessionStorage.removeItem(NAME_CACHE_KEY);
            } catch { }

            setIsAuthenticated(false);
            router.push("/login");
        } finally {
            router.refresh();
        }
    };

    const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

    // "Mais" (barra inferior) fica ativo em qualquer tela que não tem atalho próprio.
    const moreActive = !BOTTOM_LINKS.some((link) => isActive(link.href));
    const accountActive = pathname === "/perfil" || pathname === "/admin";
    const firstName = userName?.split(" ")[0] ?? null;

    return (
        <>
            {!isLoading && isAuthenticated && <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />}

            {sidebarMode && (
                <aside
                    aria-label="Menu lateral"
                    className={cn(
                        "glass-strong fixed top-3 bottom-3 z-40 flex flex-col gap-3 rounded-2xl p-3 transition-[width] duration-200 ease-out max-xl:hidden",
                        side === "right" ? "right-3" : "left-3",
                        collapsed ? "w-[4.5rem]" : "w-60"
                    )}
                >
                    <div className={cn("flex shrink-0 items-center", collapsed ? "flex-col gap-2" : "justify-between gap-1")}>
                        <Link
                            href="/"
                            aria-label="Organiza Estudos, ir para o início"
                            className={cn(
                                "min-w-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                collapsed ? "p-1" : "px-2 py-1"
                            )}
                        >
                            {collapsed ? <LogoSvg /> : <Logo />}
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => update({ collapsed: !collapsed })}
                            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                            aria-expanded={!collapsed}
                            title={collapsed ? "Expandir menu" : "Recolher menu"}
                        >
                            {side === "right"
                                ? collapsed ? <PanelRightClose /> : <PanelRightOpen />
                                : collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                        </Button>
                    </div>

                    {!isLoading && isAuthenticated && inSidebar && <GlobalSearch fullWidth={!collapsed} iconOnly={collapsed} />}

                    <nav aria-label="Principal" className={cn("-mx-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-1 py-1", collapsed ? "gap-1" : "gap-4")}>
                        {NAV_GROUPS.map((group, index) => (
                            <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
                                {collapsed ? (
                                    index > 0 && <div role="separator" className="mx-3 mb-1 border-t border-(--glass-ring)" />
                                ) : (
                                    <h3 className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</h3>
                                )}
                                {group.items.map(({ href, label, icon: Icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        title={collapsed ? label : undefined}
                                        aria-current={isActive(href) ? "page" : undefined}
                                        className={cn(
                                            "relative flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                            collapsed ? "justify-center px-0" : "px-3",
                                            isActive(href) ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
                                        {collapsed ? <CountDot count={counts[href] ?? 0} /> : <CountBadge count={counts[href] ?? 0} className="ml-auto" />}
                                    </Link>
                                ))}
                            </section>
                        ))}
                    </nav>

                    <div className={cn("flex shrink-0 flex-col border-t border-(--glass-ring) pt-3", collapsed ? "gap-1" : "gap-1.5")}>
                        {!isLoading && !isAuthenticated && !collapsed && (
                            <>
                                <Button variant="outline" onClick={() => router.push("/login")}>
                                    Entrar
                                </Button>
                                <Button onClick={() => router.push("/signup")}>Cadastrar-se</Button>
                            </>
                        )}

                        {!isLoading && isAuthenticated && inSidebar && collapsed && (
                            <>
                                <ProfileSwitcher iconOnly />
                                <div className="flex justify-center">
                                    <ThemeToggle size="icon" variant="ghost" />
                                </div>
                                <RailLink href="/perfil" label="Meu perfil" icon={CircleUser} active={pathname === "/perfil"} />
                                {isAdmin && <RailLink href="/admin" label="Admin" icon={ShieldCheck} active={pathname === "/admin"} />}
                                <RailButton label="Atalhos de teclado" icon={Keyboard} onClick={() => setShortcutsOpen(true)} />
                                <RailButton label="Sair" icon={LogOut} onClick={() => void handleLogout()} />
                            </>
                        )}

                        {!isLoading && isAuthenticated && inSidebar && !collapsed && (
                            <>
                                <ProfileSwitcher fullWidth />

                                <div className="mt-1 flex items-center justify-between gap-1 px-1">
                                    <span className="truncate text-xs font-medium text-muted-foreground">
                                        {firstName ? `Conta · ${firstName}` : "Conta"}
                                    </span>
                                    <ThemeToggle size="icon" variant="ghost" />
                                </div>

                                <Link
                                    href="/perfil"
                                    aria-current={pathname === "/perfil" ? "page" : undefined}
                                    className={cn(
                                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                                        pathname === "/perfil" ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS
                                    )}
                                >
                                    <CircleUser className="size-4" /> Meu perfil
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/admin"
                                        aria-current={pathname === "/admin" ? "page" : undefined}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                                            pathname === "/admin" ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS
                                        )}
                                    >
                                        <ShieldCheck className="size-4" /> Admin
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShortcutsOpen(true)}
                                    className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors", NAV_IDLE_CLASS)}
                                >
                                    <Keyboard className="size-4" /> Atalhos
                                    <kbd className="ml-auto rounded-md border border-(--glass-ring) bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium">?</kbd>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleLogout()}
                                    className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors", NAV_IDLE_CLASS)}
                                >
                                    <LogOut className="size-4" /> Sair
                                </button>
                            </>
                        )}
                    </div>
                </aside>
            )}

            <header className={cn("fixed inset-x-0 top-3 z-50 px-3 sm:px-6", sidebarMode && "xl:hidden")}>
                <div className="glass-strong mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 rounded-2xl pr-2 pl-4 xl:grid xl:grid-cols-[1fr_auto_1fr]">

                    {/* Logo */}
                    <Link
                        href="/"
                        aria-label="Organiza Estudos, ir para o início"
                        className="shrink-0 justify-self-start rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                        <Logo compact />
                    </Link>

                    {/* Navegação (desktop), agrupada por intenção */}
                    <nav aria-label="Principal" className="flex items-center gap-0.5 max-xl:hidden">
                        {NAV_GROUPS.map((group) =>
                            group.items.length === 1 ? (
                                <Link
                                    key={group.label}
                                    href={group.items[0].href}
                                    aria-current={isActive(group.items[0].href) ? "page" : undefined}
                                    className={cn(NAV_TRIGGER_CLASS, isActive(group.items[0].href) ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS)}
                                >
                                    {group.items[0].label}
                                </Link>
                            ) : (
                                <NavGroupMenu key={group.label} group={group} isActive={isActive} counts={counts} />
                            )
                        )}
                    </nav>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 justify-self-end">
                        {!isLoading && !isAuthenticated && (
                            <>
                                <Button variant="outline" onClick={() => router.push("/login")}>
                                    Entrar
                                </Button>
                                <Button className="hidden sm:inline-flex" onClick={() => router.push("/signup")}>Cadastrar-se</Button>
                            </>
                        )}

                        {!isLoading && isAuthenticated && !inSidebar && <GlobalSearch />}

                        {!isLoading && isAuthenticated && !inSidebar && <ProfileSwitcher />}

                        {!inSidebar && <ThemeToggle size="icon" variant="ghost" />}

                        {!isLoading && isAuthenticated && !inSidebar && (
                            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                                <PopoverTrigger
                                    title="Minha conta"
                                    aria-label="Minha conta"
                                    className={cn(
                                        buttonVariants({ variant: "ghost" }),
                                        "max-w-32 max-xl:hidden",
                                        accountActive && "bg-foreground/10 text-primary"
                                    )}
                                >
                                    <CircleUser />
                                    <span className="truncate">{firstName ?? "Conta"}</span>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-48 gap-0.5 p-1.5">
                                    <Link
                                        href="/perfil"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
                                    >
                                        <CircleUser className="size-4" /> Meu perfil
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
                                        >
                                            <ShieldCheck className="size-4" /> Admin
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => { setUserMenuOpen(false); setShortcutsOpen(true); }}
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
                                    >
                                        <Keyboard className="size-4" /> Atalhos
                                        <kbd className="ml-auto rounded-md border border-(--glass-ring) bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium">?</kbd>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setUserMenuOpen(false); void handleLogout(); }}
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
                                    >
                                        <LogOut className="size-4" /> Sair
                                    </button>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
            </header>

            {/* Celular: barra inferior com os atalhos principais e o "Mais" */}
            {!isLoading && isAuthenticated && (
                <>
                    <nav
                        aria-label="Atalhos"
                        className="fixed inset-x-0 bottom-3 z-40 mb-[env(safe-area-inset-bottom)] px-3 xl:hidden"
                    >
                        <div className="glass-strong mx-auto flex h-16 max-w-md items-stretch justify-around gap-1 rounded-2xl p-1.5">
                            {BOTTOM_LINKS.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-current={isActive(href) ? "page" : undefined}
                                    className={cn(
                                        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                        isActive(href) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                                    )}
                                >
                                    <span className="relative">
                                        <Icon className="size-5" />
                                        <CountBadge count={counts[href] ?? 0} className="absolute -top-1.5 -right-3 h-4 min-w-4 px-1 text-[10px]" />
                                    </span>
                                    <span className="max-w-full truncate">{label}</span>
                                </Link>
                            ))}
                            <button
                                type="button"
                                onClick={() => setSheetOpen(true)}
                                aria-haspopup="dialog"
                                className={cn(
                                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                    moreActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                                )}
                            >
                                <Menu className="size-5" />
                                <span>Mais</span>
                            </button>
                        </div>
                    </nav>

                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-5 overflow-y-auto rounded-t-3xl px-4 pt-5 pb-6">
                            <SheetTitle className="sr-only">Menu</SheetTitle>

                            {NAV_GROUPS.map((group) => (
                                <section key={group.label} aria-label={group.label} className="flex flex-col gap-1.5">
                                    <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {group.items.map(({ href, label, icon: Icon }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                onClick={() => setSheetOpen(false)}
                                                aria-current={isActive(href) ? "page" : undefined}
                                                className={cn(
                                                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                                    isActive(href) ? "bg-primary/15 text-primary" : "text-foreground hover:bg-foreground/6"
                                                )}
                                            >
                                                <Icon className="size-4.5 shrink-0" /> {label}
                                                <CountBadge count={counts[href] ?? 0} className="ml-auto" />
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            ))}

                            <section aria-label="Conta" className="flex flex-col gap-1.5">
                                <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {firstName ? `Conta · ${firstName}` : "Conta"}
                                </h3>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <Link
                                        href="/perfil"
                                        onClick={() => setSheetOpen(false)}
                                        aria-current={pathname === "/perfil" ? "page" : undefined}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                            pathname === "/perfil" ? "bg-primary/15 text-primary" : "text-foreground hover:bg-foreground/6"
                                        )}
                                    >
                                        <CircleUser className="size-4.5 shrink-0" /> Meu perfil
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setSheetOpen(false)}
                                            aria-current={pathname === "/admin" ? "page" : undefined}
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                                pathname === "/admin" ? "bg-primary/15 text-primary" : "text-foreground hover:bg-foreground/6"
                                            )}
                                        >
                                            <ShieldCheck className="size-4.5 shrink-0" /> Admin
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => { setSheetOpen(false); void handleLogout(); }}
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-foreground/6"
                                    >
                                        <LogOut className="size-4.5 shrink-0" /> Sair
                                    </button>
                                </div>
                            </section>
                        </SheetContent>
                    </Sheet>
                </>
            )}
        </>
    )
}
