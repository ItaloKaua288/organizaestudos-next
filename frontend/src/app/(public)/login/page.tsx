"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import login from "@/services/login.service"
import dynamic from "next/dynamic"

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
  {
    ssr: false,
  }
);

export default function LoginPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await login({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      })

      router.push("/")
    } catch {
      setError("Não foi possível entrar. Confira seu e-mail e senha.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40 px-4 py-8 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-72 bg-linear-to-br from-primary/15 via-primary/5 to-transparent" />

      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="items-center px-6 pt-7 text-center sm:px-8">
          <Logo />

          <div className="mt-5 space-y-1">
            <CardTitle className="text-xl">
              Que bom ter você de volta
            </CardTitle>
            <CardDescription>
              Entre para continuar organizando seus estudos.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-7 sm:px-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Label htmlFor="email">E-mail</Label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    className="h-10 pl-9"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Senha</Label>
                  <span className="text-xs text-muted-foreground">
                    Mínimo de 8 caracteres
                  </span>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="h-10 pl-9"
                    minLength={8}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </Field>
            </FieldGroup>

            <FieldError>{error}</FieldError>

            <Button className="h-10 w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
              {!isSubmitting && <ArrowRight />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}