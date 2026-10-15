import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <>
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="glass-strong introduction-Page w-full max-w-md rounded-3xl px-6 py-8 sm:px-9 sm:py-10">
        <Logo />
        <div className="mt-8 mb-7 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
          <p className="text-sm text-muted-foreground">Entre para continuar seus estudos.</p>
        </div>
        <LoginForm />
      </div>
    </>
  )
}
