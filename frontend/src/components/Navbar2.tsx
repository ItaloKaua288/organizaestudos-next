"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { checkAuth as checkAuthApi, logout } from "@/services/login.service";
import { CalendarClock, Captions, ChartColumn, CircleUser, LayoutDashboard, LogOut, Menu, NotepadText, RotateCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalSearch } from "./global-search";
import { Logo } from "./logo";
import { ProfileSwitcher } from "./profile-switcher";

import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
    () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
    {
        ssr: false,
    }
);

const NAV_LINKS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/materias", label: "Matérias", icon: Captions },
    { href: "/revisoes", label: "Revisões", icon: RotateCw },
    { href: "/notas", label: "Notas", icon: NotepadText },
    { href: "/cronograma", label: "Cronograma", icon: CalendarClock },
    { href: "/desempenho", label: "Desempenho", icon: ChartColumn },
] as const;

export function Navbar2() {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await checkAuthApi();
                setIsAuthenticated(response.success);
                setIsAdmin(Boolean(response.user?.isAdmin));
                if (!response.success)
                    router.push("/login");
            } catch {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        try {
            await logout();

            setIsAuthenticated(false);
            router.push("/login");
        } finally {
            router.refresh();
        }
    };

    const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

    return (
        <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
            <div className="glass-strong mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 rounded-2xl pr-2 pl-4">

                {/* Logo */}
                <Link
                    href="/"
                    aria-label="Organiza Estudos, ir para o início"
                    className="shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                    <Logo compact />
                </Link>

                {/* Navegação (desktop) */}
                <nav aria-label="Principal" className="flex items-center gap-0.5 max-xl:hidden">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            aria-current={isActive(href) ? "page" : undefined}
                            className={cn(
                                "rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                isActive(href)
                                    ? "bg-foreground/10 text-foreground"
                                    : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                            )}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Ações e menu mobile */}
                <div className="flex items-center gap-1.5">
                    {!isLoading && !isAuthenticated && (
                        <>
                            <Button
                                className="hidden sm:inline-flex"
                                variant="outline"
                                onClick={() => router.push("/login")}
                            >
                                Entrar
                            </Button>
                            <Button className="hidden sm:inline-flex" onClick={() => router.push("/signup")}>Cadastrar-se</Button>
                        </>
                    )}

                    {!isLoading && isAuthenticated && <GlobalSearch />}

                    {!isLoading && isAuthenticated && <ProfileSwitcher />}

                    {!isLoading && isAuthenticated && isAdmin && (
                        <Link
                            href="/admin"
                            title="Admin"
                            aria-label="Admin"
                            className={cn(
                                buttonVariants({ variant: "ghost", size: "icon" }),
                                "max-xl:hidden",
                                pathname === "/admin" && "bg-foreground/10 text-primary"
                            )}
                        >
                            <ShieldCheck />
                        </Link>
                    )}

                    {!isLoading && isAuthenticated && (
                        <Link
                            href="/perfil"
                            title="Meu perfil"
                            aria-label="Meu perfil"
                            className={cn(
                                buttonVariants({ variant: "ghost", size: "icon" }),
                                "max-xl:hidden",
                                pathname === "/perfil" && "bg-foreground/10 text-primary"
                            )}
                        >
                            <CircleUser />
                        </Link>
                    )}

                    <ThemeToggle size="icon" variant="ghost" />

                    {!isLoading && isAuthenticated && (
                        <Button variant="outline" onClick={handleLogout} className="ml-1 max-xl:hidden">
                            Sair
                        </Button>
                    )}

                    {/* Menu mobile */}
                    <Sheet>
                        <SheetTrigger render={
                            <Button variant="ghost" size="icon" className="xl:hidden" />
                        }>
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Abrir menu</span>
                        </SheetTrigger>

                        <SheetContent side="right" className="flex flex-col gap-6 px-4 pt-5 pb-4">
                            <SheetTitle className="sr-only">Menu</SheetTitle>
                            <Link className="w-fit" href="/">
                                <Logo />
                            </Link>

                            <nav aria-label="Principal" className="flex flex-col gap-1 text-base font-medium">
                                {[
                                    ...NAV_LINKS,
                                    { href: "/perfil", label: "Perfil", icon: CircleUser },
                                    ...(!isLoading && isAuthenticated && isAdmin
                                        ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
                                        : []),
                                ].map(({ href, label, icon: Icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        aria-current={isActive(href) ? "page" : undefined}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                                            isActive(href)
                                                ? "bg-primary/15 text-primary"
                                                : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="size-4.5" /> {label}
                                    </Link>
                                ))}
                            </nav>

                            {!isLoading && isAuthenticated && (
                                <Button variant="outline" onClick={handleLogout} className="mt-auto gap-1.5">
                                    <LogOut size={16} /> Sair
                                </Button>
                            )}
                            {!isLoading && !isAuthenticated && (
                                <div className="mt-auto flex flex-col gap-2">
                                    <Button variant="outline" onClick={() => router.push("/login")}>Entrar</Button>
                                    <Button onClick={() => router.push("/signup")}>Cadastrar-se</Button>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
