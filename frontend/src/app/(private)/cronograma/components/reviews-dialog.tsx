"use client";

import { ReviewItem } from "@/components/reviewSection";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RotateCw } from "lucide-react";
import type { TodayReview } from "./cycle-utils";

type ReviewsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reviews: TodayReview[];
};

/** Modal com todas as revisões de hoje (e as atrasadas). Use "Feito" para concluir; clicar na linha abre o assunto. */
export function ReviewsDialog({ open, onOpenChange, reviews }: ReviewsDialogProps) {
    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl">
                    <DialogHeader className="shrink-0 gap-1.5 px-5 pt-5 pb-3">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <RotateCw className="h-5 w-5 text-primary" aria-hidden="true" />
                            Revisões de hoje
                            <Badge variant="secondary">{reviews.length}</Badge>
                        </DialogTitle>
                        <DialogDescription>Assuntos para revisar hoje, incluindo os atrasados.</DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                        {reviews.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nenhuma revisão para hoje nem atrasada.</p>
                        ) : (
                            <ul className="flex flex-col">
                                {reviews.map(({ topic, number }) => (
                                    <li key={`${topic.id}-${number}`} className="py-0.5">
                                        {/* Mesma linha da página de revisões: "Feito" abre a avaliação e conclui a revisão. */}
                                        <ReviewItem item={topic} reviewIndex={number} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </>
    );
}
