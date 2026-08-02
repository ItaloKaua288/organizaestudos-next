import { Logo } from "@/components/logo"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { ThemeToggle } from "@/components/theme-toggle"
import { SignupForm } from "./components/signup-form"


export default function SignupPage() {
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
                            Crie sua conta
                        </CardTitle>
                        <CardDescription>
                            Comece a organizar seus estudos hoje mesmo
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-7 sm:px-8">
                    <SignupForm />
                </CardContent>
            </Card>
        </>
    )
}