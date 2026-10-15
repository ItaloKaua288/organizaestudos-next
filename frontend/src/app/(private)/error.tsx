"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Erro capturado pelo limite (Error Boundary):", error);
    }, [error]);

    return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="glass flex max-w-md flex-col items-center gap-3 rounded-3xl p-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <AlertCircle size={24} />
                </span>
                <h2 className="text-xl font-semibold">Não foi possível carregar os dados</h2>

                <p className="text-sm text-muted-foreground">
                    {error.message || "Não foi possível conectar ao servidor no momento."}
                </p>

                <Button variant="outline" onClick={() => reset()} className="mt-2">
                    Tentar novamente
                </Button>
            </div>
        </main>
    );
}
