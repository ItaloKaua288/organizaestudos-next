"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { NavMenu } from "@/components/nav-menu";
import { NavigationSheet } from "@/components/navigation-sheet";
import { Button } from "@/components/ui/button";
import { checkAuth as checkAuthApi, logout } from "@/services/login.service";

import dynamic from "next/dynamic";
import Link from "next/link";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
  {
    ssr: false,
  }
);

const Navbar = () => {
  const router = useRouter();
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
    <nav className="fixed left-1/2 z-10 h-16 min-h-16 w-full  -translate-x-1/2 border-b bg-muted">
      <div className="relative mx-auto flex h-full max-w-(--breakpoint-3xl) items-center justify-between px-2 ">
        <div className="flex items-center">
          <Link className="hover:text-primary hover:scale-105 transition-all" href="/">
            <Logo />
          </Link>
        </div>
        {/* Desktop Menu */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <NavMenu className="hidden md:block" />
        </div>
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
