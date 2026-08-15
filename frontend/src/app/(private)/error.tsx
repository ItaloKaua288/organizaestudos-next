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
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle size={48} className="text-destructive" />
                <h2 className="text-2xl font-bold text-destructive">Erro ao carregar dados</h2>
                
                <p className="text-muted-foreground text-sm max-w-md">
                    {error.message || "Não foi possível conectar ao servidor no momento."}
                </p>

                <Button 
                    variant="outline" 
                    onClick={() => reset()} 
                    className="mt-4"
                >
                    Tentar novamente
                </Button>
            </div>
        </main>
    );
}