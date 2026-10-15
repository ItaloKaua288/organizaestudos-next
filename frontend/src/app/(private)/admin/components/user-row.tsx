"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminUser } from "@/types/admin";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { accessText, count, formatDate, formatStudyTime, getInitials } from "./admin-utils";

interface UserRowProps {
    user: AdminUser;
    now: number;
    /** true quando a linha é da própria conta de quem está logado. */
    isSelf: boolean;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
}

/** Uma linha da lista de usuários: quem é, quanto já usou, quando acessou e as ações. */
export function UserRow({ user, now, isSelf, onEdit, onDelete }: UserRowProps) {
    const [expanded, setExpanded] = useState(false);

    const hasTopics = user.topicsCount > 0;
    const percent = hasTopics ? (user.concludedTopicsCount / user.topicsCount) * 100 : 0;
    const detailsId = `admin-details-${user._id}`;
    const subjects = [...user.subjects].sort((a, b) => b.topicsCount - a.topicsCount);

    return (
        <li className="relative py-4 transition-colors hover:bg-foreground/4 sm:-mx-3 sm:rounded-xl sm:px-3">
            <div className="grid gap-x-6 gap-y-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 items-center gap-3 max-md:pr-28">
                    <div
                        aria-hidden
                        className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-xl font-heading text-base font-semibold",
                            user.isAdmin ? "bg-primary/15 text-primary" : "bg-foreground/8 text-muted-foreground"
                        )}
                    >
                        {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-medium wrap-anywhere">{user.name}</p>
                            {user.isAdmin && <Badge>Admin</Badge>}
                            {isSelf && <Badge variant="outline">Você</Badge>}
                            {!user.isVerified && <Badge variant="secondary">E-mail não verificado</Badge>}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    {hasTopics ? (
                        <>
                            <p className="text-sm">
                                <span className="font-semibold tabular-nums">
                                    {user.concludedTopicsCount.toLocaleString("pt-BR")}
                                </span>{" "}
                                de <span className="tabular-nums">{user.topicsCount.toLocaleString("pt-BR")}</span> assuntos
                                concluídos
                            </p>
                            <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhum assunto cadastrado</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {count(user.subjectsCount, "matéria", "matérias")}, {count(user.attachmentsCount, "anexo", "anexos")},{" "}
                        {count(user.notesCount, "nota", "notas")}
                    </p>
                </div>

                <div className="space-y-0.5">
                    <p className="text-sm" title={formatDate(user.lastLogin, true)}>
                        {accessText(user.lastLogin, now)}
                    </p>
                    <p className="text-xs text-muted-foreground">Cadastro em {formatDate(user.createdAt)}</p>
                </div>

                <div className="flex items-center gap-1 max-md:absolute max-md:top-3.5 max-md:right-0 md:justify-self-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded((value) => !value)}
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        aria-label={`${expanded ? "Ocultar" : "Ver"} detalhes de ${user.name}`}
                        title={expanded ? "Ocultar detalhes" : "Ver detalhes"}
                    >
                        <ChevronDown
                            className={cn("transition-transform motion-reduce:transition-none", expanded && "rotate-180")}
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(user)}
                        aria-label={`Editar ${user.name}`}
                        title="Editar"
                    >
                        <Pencil />
                    </Button>
                    <span title={isSelf ? "Você não pode excluir a sua própria conta." : "Excluir"}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(user)}
                            disabled={isSelf}
                            aria-label={isSelf ? `Excluir ${user.name} (indisponível para a sua conta)` : `Excluir ${user.name}`}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 />
                        </Button>
                    </span>
                </div>
            </div>

            {expanded && (
                <div id={detailsId} className="mt-4 space-y-3 rounded-xl bg-foreground/5 p-4 text-sm">
                    <p className="text-muted-foreground">
                        {count(user.profilesCount, "perfil de estudo", "perfis de estudo")}.{" "}
                        {user.totalStudyTime > 0
                            ? `${formatStudyTime(user.totalStudyTime)} de estudo registrados.`
                            : "Nenhum tempo de estudo registrado."}
                    </p>

                    {subjects.length === 0 ? (
                        <p className="text-muted-foreground">Ainda não cadastrou matérias.</p>
                    ) : (
                        <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                            {subjects.map((subject) => (
                                <li key={subject._id} className="flex items-center gap-2">
                                    <span
                                        aria-hidden
                                        className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/15"
                                        style={{ backgroundColor: subject.color }}
                                    />
                                    <span className={cn("min-w-0 flex-1 truncate", !subject.active && "text-muted-foreground")}>
                                        {subject.title}
                                    </span>
                                    {!subject.active && <span className="text-xs text-muted-foreground">desativada</span>}
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {count(subject.topicsCount, "assunto", "assuntos")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </li>
    );
}
