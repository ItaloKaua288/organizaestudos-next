"use client";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { checkAuth as checkAuthApi, logout } from "@/services/login.service";
import { CalendarClock, Captions, LayoutDashboard, Menu, NotepadText, RotateCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
    () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
    {
        ssr: false,
    }
);

export function Navbar2() {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await checkAuthApi();
                setIsAuthenticated(response.success);
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

    return (
        <header className="bg-muted fixed top-0 left-0 right-0 w-full z-50 border-b">
            <div className="relative mx-auto flex items-center justify-between gap-8 py-5 px-2">

                {/* Logo */}
                <div className="transition-opacity hover:opacity-80">
                    <div className="flex items-center gap-3">
                        <Link className="hover:text-primary hover:scale-105 transition-all" href="/">
                            <Logo />
                        </Link>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className=" absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6 font-medium max-lg:hidden ">
                    <Link
                        href="/"
                        className={`transition-all duration-300 ease-in-out hover:text-primary ${pathname === "/" ? "text-primary text-lg" : "text-muted-foreground text-base"}`}
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/materias"
                        className={`transition-all duration-300 ease-in-out hover:text-primary ${pathname === "/materias" ? "text-primary text-lg" : "text-muted-foreground text-base"}`}
                    >
                        Matérias
                    </Link>

                    <Link
                        href="/revisoes"
                        className={`transition-all duration-300 ease-in-out hover:text-primary ${pathname === "/revisoes" ? "text-primary text-lg" : "text-muted-foreground text-base"}`}
                    >
                        Revisões
                    </Link>

                    <Link
                        href="/notas"
                        className={`transition-all duration-300 ease-in-out hover:text-primary ${pathname === "/notas" ? "text-primary text-lg" : "text-muted-foreground text-base"}`}
                    >
                        Notas
                    </Link>

                    <Link
                        href="/cronograma"
                        className={`transition-all duration-300 ease-in-out hover:text-primary ${pathname === "/cronograma" ? "text-primary text-lg" : "text-muted-foreground text-base"}`}
                    >
                        Cronograma
                    </Link>
                </nav>

                {/* Actions & Mobile Menu */}
                <div className="flex items-center gap-2">

                    <div className="flex items-center gap-2 sm:gap-3">
                        {!isLoading && !isAuthenticated && (
                            <>
                                <Button
                                    className="hidden sm:inline-flex"
                                    variant="outline"
                                    onClick={() => router.push("/login")}
                                >
                                    Entrar
                                </Button>
                                <Button className="hidden sm:inline-flex">Cadastrar-se</Button>
                            </>
                        )}

                        {!isLoading && isAuthenticated && (
                            <Button variant="outline" onClick={handleLogout}>
                                Sair
                            </Button>
                        )}

                        <ThemeToggle size="icon" variant="outline" />

                    </div>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger render={
                            <Button variant="outline" size="icon" className="lg:hidden" />
                        }>
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </SheetTrigger>

                        <SheetContent side="right" className="flex flex-col gap-6 pt-2.5 px-2">
                            <div className="transition-opacity hover:opacity-80">
                                <div className="flex items-center gap-3">
                                    <Link className="hover:text-primary hover:scale-105 transition-all" href="/">
                                        <Logo />
                                    </Link>
                                </div>
                            </div>
                            {/* Condicionais aplicadas nos links Mobile */}
                            <nav className="flex flex-col gap-2 text-lg font-medium">
                                <Link
                                    href="/"
                                    className={`transition-all duration-300 ease-in-out border rounded-sm hover:bg-primary hover:text-primary-foreground flex gap-1 items-center ${pathname === "/" ? "bg-primary text-primary-foreground p-4" : "text-muted-foreground p-2"}`}
                                >
                                    <LayoutDashboard /> Dashboard
                                </Link>

                                <Link
                                    href="/materias"
                                    className={`transition-all duration-300 ease-in-out border rounded-sm hover:bg-primary hover:text-primary-foreground flex gap-1 items-center ${pathname === "/materias" ? "bg-primary text-primary-foreground p-4" : "text-muted-foreground p-2"}`}
                                >
                                    <Captions /> Matérias
                                </Link>

                                <Link
                                    href="/revisoes"
                                    className={`transition-all duration-300 ease-in-out border rounded-sm hover:bg-primary hover:text-primary-foreground flex gap-1 items-center ${pathname === "/revisoes" ? "bg-primary text-primary-foreground p-4" : "text-muted-foreground p-2"}`}
                                >
                                    <RotateCw /> Revisões
                                </Link>

                                <Link
                                    href="/notas"
                                    className={`transition-all duration-300 ease-in-out border rounded-sm hover:bg-primary hover:text-primary-foreground flex gap-1 items-center ${pathname === "/notas" ? "bg-primary text-primary-foreground p-4" : "text-muted-foreground p-2"}`}
                                >
                                    <NotepadText /> Notas
                                </Link>

                                <Link
                                    href="/cronograma"
                                    className={`transition-all duration-300 ease-in-out border rounded-sm hover:bg-primary hover:text-primary-foreground flex gap-1 items-center ${pathname === "/cronograma" ? "bg-primary text-primary-foreground p-4" : "text-muted-foreground p-2"}`}
                                >
                                    <CalendarClock /> Cronograma
                                </Link>
                            </nav>
                            <div className="flex items-center gap-2 sm:gap-3">
                                {!isLoading && !isAuthenticated && (
                                    <>
                                        <Button
                                            className="hidden sm:inline-flex"
                                            variant="outline"
                                            onClick={() => router.push("/login")}
                                        >
                                            Entrar
                                        </Button>
                                        <Button className="hidden sm:inline-flex">Cadastrar-se</Button>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                </div>
            </div>
        </header>
    )
}