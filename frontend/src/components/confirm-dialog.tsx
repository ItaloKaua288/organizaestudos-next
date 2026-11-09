"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    /** Estilo vermelho para ações que não dá para desfazer. */
    destructive?: boolean;
    onConfirm: () => void;
};

/** Confirmação no padrão do app, no lugar do window.confirm. */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirmar",
    destructive = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
                    <Button
                        type="button"
                        variant={destructive ? "destructive" : "default"}
                        className={destructive ? "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90" : undefined}
                        onClick={() => {
                            onOpenChange(false);
                            onConfirm();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
