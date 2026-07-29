"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NavMenu } from "@/components/nav-menu";
import { NavigationSheet } from "@/components/navigation-sheet";

import dynamic from "next/dynamic";

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
        const response = await fetch(`/api/auth/check-auth`,);
        setIsAuthenticated(response.ok);
        if (!response.ok)
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
      await fetch(`/api/auth/logout`, { method: "POST", });

      setIsAuthenticated(false);
      router.push("/login");
    } finally {
      router.refresh();
    }
  };

  return (
    <nav className="fixed z-10 h-16 min-h-16 border-b bg-muted w-full">
      <div className="mx-auto flex h-full max-w-(--breakpoint-3xl) items-center justify-between px-2">
        <div className="flex items-center gap-12">
            <Logo />

          {/* Desktop Menu */}
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
