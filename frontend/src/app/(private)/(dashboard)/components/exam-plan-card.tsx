"use client";

import { updateProfileExamDateAction } from "@/actions/profiles.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatExamDate, type ExamPlan } from "@/lib/exam-plan";
import { cn } from "@/lib/utils";
import { CalendarClock, CalendarPlus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type ExamPlanCardProps = {
    profileId: string;
    /** Dia da prova (AAAA-MM-DD) ou null quando ainda não foi definido. */
    examDate: string | null;
    plan: ExamPlan | null;
};

const TOAST_ID = "exam-date";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

type Tone = "good" | "warn" | "neutral";

/** Frase principal do plano (texto + tom de cor) para cada situação. */
function describePlan(plan: ExamPlan): { text: string; tone: Tone } {
    const required = plan.requiredPerWeek !== null ? `${fmt(plan.requiredPerWeek)} por semana` : "";
    const late = plan.projectedDaysLate;
    const finish = plan.projectedFinish ? formatExamDate(plan.projectedFinish) : "";

    switch (plan.status) {
        case "exam_passed":
            return { text: "A data da prova já passou. Atualize a data para o próximo concurso.", tone: "neutral" };
        case "exam_today":
            return { text: "A prova é hoje. Confie no que você estudou. Boa sorte!", tone: "good" };
        case "no_topics":
            return { text: "Cadastre os assuntos das matérias para calcular quantos você precisa estudar por semana.", tone: "neutral" };
        case "completed":
            return { text: "Você concluiu todos os assuntos. Use o tempo que resta para revisões e questões.", tone: "good" };
        case "final_stretch":
            return {
                text: `Reta final: restam ${plural(plan.remainingTopics, "assunto", "assuntos")} sem estudar. Priorize os mais cobrados e mantenha as revisões e questões em dia.`,
                tone: "warn",
            };
        case "not_started":
            return { text: `Conclua o primeiro assunto para medirmos seu ritmo. Para fechar o edital a tempo, a meta é ${required}.`, tone: "neutral" };
        case "on_track": {
            const margin = late !== null && late < 0
                ? `${plural(-late, "dia", "dias")} antes da meta`
                : "no dia da meta";
            return { text: `No ritmo: mantendo o ritmo atual você termina os assuntos em ${finish}, ${margin}.`, tone: "good" };
        }
        case "behind":
            return late !== null
                ? {
                    text: `Abaixo do ritmo: mantendo o ritmo atual você termina em ${finish}, ${plural(late, "dia", "dias")} depois da meta. Você precisa de ${required}.`,
                    tone: "warn",
                }
                : {
                    text: `Abaixo do ritmo: nenhum assunto concluído nos últimos 14 dias. Para fechar o edital a tempo, faça ${required}.`,
                    tone: "warn",
                };
    }
}

const toneClass: Record<Tone, string> = {
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    neutral: "text-muted-foreground",
};

/** Contagem regressiva e planejamento reverso da prova do perfil ativo (editável pelo próprio card). */
export function ExamPlanCard({ profileId, examDate, plan }: ExamPlanCardProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(examDate ?? "");
    const [isBusy, setIsBusy] = useState(false);

    const handleOpenChange = (next: boolean) => {
        if (isBusy) return;
        if (next) setValue(examDate ?? "");
        setOpen(next);
    };

    const save = async (nextDate: string | null) => {
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Salvando data da prova...", { id: TOAST_ID });

        try {
            const result = await updateProfileExamDateAction(profileId, nextDate);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setOpen(false);
            router.refresh();
        } catch {
            toast.error("Erro ao salvar a data da prova.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const dialog = (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (value) void save(value);
                    }}
                    className="flex flex-col gap-4"
                >
                    <DialogHeader>
                        <DialogTitle>Data da prova</DialogTitle>
                        <DialogDescription>
                            Vale para o perfil ativo. Com ela, o app calcula quantos assuntos por semana você precisa concluir.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="exam-date">Dia da prova</Label>
                        <Input
                            id="exam-date"
                            type="date"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            min="2000-01-01"
                            max="2100-12-31"
                            disabled={isBusy}
                            required
                        />
                    </div>

                    <DialogFooter>
                        {examDate && (
                            <Button type="button" variant="ghost" disabled={isBusy} onClick={() => void save(null)}>
                                Remover data
                            </Button>
                        )}
                        <Button type="submit" disabled={isBusy || !value}>
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );

    if (!examDate || !plan) {
        return (
            <section aria-label="Planejamento da prova" className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <span aria-hidden="true" className="hidden size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary sm:grid">
                        <CalendarClock className="size-6" />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <h2 className="text-sm font-medium text-muted-foreground">Rumo à prova</h2>
                        <p className="text-base font-semibold tracking-tight text-balance">
                            Informe a data da prova para saber se seu ritmo de estudo fecha o edital a tempo.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="lg" onClick={() => handleOpenChange(true)} className="w-full sm:w-auto">
                    <CalendarPlus data-icon="inline-start" />
                    Definir data da prova
                </Button>
                {dialog}
            </section>
        );
    }

    const { text, tone } = describePlan(plan);
    const percent = plan.totalTopics > 0 ? Math.round((plan.doneTopics / plan.totalTopics) * 100) : 0;
    const showMetrics = plan.status === "on_track" || plan.status === "behind" || plan.status === "not_started";

    const countdown = plan.daysLeft < 0
        ? { value: "Encerrada", caption: `prova em ${formatExamDate(plan.examDate)}` }
        : plan.daysLeft === 0
            ? { value: "Hoje", caption: `prova em ${formatExamDate(plan.examDate)}` }
            : { value: plural(plan.daysLeft, "dia", "dias"), caption: `até a prova, em ${formatExamDate(plan.examDate)}` };

    const metrics = [
        { label: "Meta", value: plan.requiredPerWeek !== null ? `${fmt(plan.requiredPerWeek)} / semana` : "-", hint: "assuntos para fechar o edital" },
        { label: "Seu ritmo", value: `${fmt(plan.currentPerWeek)} / semana`, hint: "média dos últimos 14 dias" },
        { label: "Previsão", value: plan.projectedFinish ? formatExamDate(plan.projectedFinish) : "-", hint: `meta: ${formatExamDate(plan.studyDeadline)}` },
    ];

    return (
        <section aria-label="Planejamento da prova" className="glass flex flex-col gap-4 rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarClock className="size-4" aria-hidden="true" />
                        Rumo à prova
                    </h2>
                    <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
                        {countdown.value}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">{countdown.caption}</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
                    <Pencil data-icon="inline-start" />
                    Alterar data
                </Button>
            </div>

            {plan.totalTopics > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Assuntos concluídos</span>
                        <span className="font-medium tabular-nums">
                            {plan.doneTopics} de {plan.totalTopics}
                            <Badge variant="secondary" className="ml-2">{percent}%</Badge>
                        </span>
                    </div>
                    <Progress value={percent} aria-label={`${percent}% dos assuntos concluídos`} />
                </div>
            )}

            {showMetrics && (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-foreground/5 px-3 py-2.5">
                            <dt className="text-xs text-muted-foreground">{metric.label}</dt>
                            <dd className="text-lg font-semibold tabular-nums">{metric.value}</dd>
                            <dd className="text-xs text-muted-foreground">{metric.hint}</dd>
                        </div>
                    ))}
                </dl>
            )}

            <p className={cn("text-sm font-medium text-balance", toneClass[tone])} role="status">{text}</p>

            {showMetrics && (
                <p className="text-xs text-muted-foreground">
                    Os últimos {plan.reviewBufferDays} dias antes da prova ficam reservados para revisão geral. Todos os assuntos contam com o mesmo peso.
                </p>
            )}

            {dialog}
        </section>
    );
}
