"use client";

import { Button } from "@/components/ui/button";
import { Subject } from "@/types/subject";
import { Paperclip, Pin } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

/** Números do cartão: quantas notas a matéria tem e quando a última foi editada. */
export type SubjectNotesSummary = {
    count: number;
    pinned: number;
    attachments: number;
    /** Texto pronto, ex.: "há 2 dias" (vazio quando não há notas). */
    lastLabel: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RedirectButton({ subject, summary, index }: { subject: Subject, summary?: SubjectNotesSummary, index?: number }) {
    const count = summary?.count ?? 0;

    return (
        <Button
            key={subject.id}
            variant="outline"
            className="h-auto justify-start rounded-2xl px-5 py-4"
            nativeButton={false}
            onClick={() => {
                sessionStorage.setItem("showRedirectToast", "true");
                toast.loading("Redirecionando...", {
                    id: "redirect"
                });
            }}
            render={
                <Link href={`/notas/${subject.id}`} className="flex min-w-0 flex-col items-stretch gap-1.5 text-left">
                    <span className="flex min-w-0 items-center gap-3">
                        <span
                            className="inline-block size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: subject.color }}
                            aria-hidden="true"
                        />
                        <span className="truncate font-medium">{subject.title}</span>
                    </span>

                    {summary && (
                        <span className="flex min-w-0 items-center gap-2 pl-6 text-xs font-normal text-muted-foreground">
                            {count === 0 ? (
                                <span>Sem notas ainda</span>
                            ) : (
                                <>
                                    <span className="truncate">
                                        <span className="font-medium text-foreground/80">{count === 1 ? "1 nota" : `${count} notas`}</span>
                                        {summary.lastLabel && ` · editada ${summary.lastLabel}`}
                                    </span>
                                    {summary.pinned > 0 && (
                                        <span
                                            className="flex shrink-0 items-center gap-0.5 tabular-nums"
                                            title={`${summary.pinned} ${summary.pinned === 1 ? "nota fixada" : "notas fixadas"}`}
                                        >
                                            <Pin size={11} aria-hidden="true" />
                                            {summary.pinned}
                                            <span className="sr-only">{summary.pinned === 1 ? "nota fixada" : "notas fixadas"}</span>
                                        </span>
                                    )}
                                    {summary.attachments > 0 && (
                                        <span
                                            className="flex shrink-0 items-center gap-0.5 tabular-nums"
                                            title={`${summary.attachments} ${summary.attachments === 1 ? "anexo" : "anexos"}`}
                                        >
                                            <Paperclip size={11} aria-hidden="true" />
                                            {summary.attachments}
                                            <span className="sr-only">{summary.attachments === 1 ? "anexo" : "anexos"}</span>
                                        </span>
                                    )}
                                </>
                            )}
                        </span>
                    )}
                </Link>
            }
        />
    );
}
