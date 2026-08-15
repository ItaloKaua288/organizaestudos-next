"use client"

import { ArrowRight, LockKeyhole, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import login from "@/services/login.service"

export function LoginForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    // const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    // useEffect(() => {
    //     const checkAuth = async () => {
    //         try {
    //             const res = await checkAuthApi();
    //             if (res.success) {
    //                 router.push("/")
    //             } else {
    //                 setIsCheckingAuth(false)
    //             }
    //         } catch {
    //             setIsCheckingAuth(false)
    //         }
    //     };

    //     checkAuth();
    // }, [router]);

    // if (isCheckingAuth) {
    //     return (
    //         <div className="flex w-full items-center justify-center">
    //             <Loader2 className="size-8 animate-spin text-muted-foreground" />
    //         </div>
    //     )
    // }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError("")
        setIsSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const email = String(formData.get("email"))
        const password = String(formData.get("password"))

        try {
            await login({ email, password })
            router.push("/")
        } catch {
            setError("Não foi possível entrar. Confira seu e-mail e senha.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
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
    )
}