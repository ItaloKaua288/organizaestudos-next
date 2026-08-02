import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <>
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="items-center px-6 pt-7 text-center sm:px-8">
          <Logo />

          <div className="mt-5 space-y-1">
            <CardTitle className="text-xl">
              Bem-vindo de volta!
            </CardTitle>
            <CardDescription>
              Faça login para acessar seus estudos
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-7 sm:px-8">
          <LoginForm />
        </CardContent>
      </Card>
    </>
  )
}