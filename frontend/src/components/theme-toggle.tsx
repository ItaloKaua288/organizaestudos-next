"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { useSyncExternalStore } from "react";

type ThemeToggleVariant = "default" | "outline" | "ghost";
type ThemeToggleSize = "default" | "icon";

export interface ThemeToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ThemeToggleVariant;
  size?: ThemeToggleSize;
}

const emptySubscribe = () => () => { };

export const ThemeToggle = ({
  variant = "outline",
  size = "icon",
  className,
  ...props
}: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme()

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Alterar tema"
        disabled
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(buttonVariants({ variant, size }), className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      {...props}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {size === "default" && (
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      )}
    </button>
  );
};
