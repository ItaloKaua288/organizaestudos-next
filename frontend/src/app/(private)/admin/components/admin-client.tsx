"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdminUser, AdminUserUpdated } from "@/types/admin";
import { Search } from "lucide-react";
import { useState } from "react";
import { ActivityStrip } from "./activity-strip";
import { count, FilterKey, matchesFilter, matchesQuery, SORT_OPTIONS, SortKey, sortUsers } from "./admin-utils";
import { DeleteUserDialog } from "./delete-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { UserRow } from "./user-row";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "admins", label: "Administradores" },
    { key: "unverified", label: "Sem verificação" },
    { key: "idle", label: "Sem acesso há mais de 30 dias" },
];

interface AdminClientProps {
    initialUsers: AdminUser[];
    currentUserId: string | null;
}

export function AdminClient({ initialUsers, currentUserId }: AdminClientProps) {
    const [users, setUsers] = useState(initialUsers);
    // "Agora" fixo desde a abertura da página: mantém os textos relativos ("há 3 dias") estáveis.
    const [now] = useState(() => Date.now());
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterKey>("all");
    const [sort, setSort] = useState<SortKey>("joined");
    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState<AdminUser | null>(null);

    const counts: Record<FilterKey, number> = {
        all: users.length,
        admins: users.filter((user) => matchesFilter(user, "admins", now)).length,
        unverified: users.filter((user) => matchesFilter(user, "unverified", now)).length,
        idle: users.filter((user) => matchesFilter(user, "idle", now)).length,
    };

    // "Sem verificação" só aparece quando há alguém nessa situação (ou quando o filtro já está ativo).
    const visibleFilters = FILTERS.filter(({ key }) => key !== "unverified" || counts.unverified > 0 || filter === key);

    const visibleUsers = sortUsers(
        users.filter((user) => matchesFilter(user, filter, now) && matchesQuery(user, query)),
        sort
    );

    const isFiltering = filter !== "all" || query.trim().length > 0;

    const clearFilters = () => {
        setQuery("");
        setFilter("all");
    };

    const handleSaved = (updated: AdminUserUpdated) =>
        setUsers((current) => current.map((user) => (user._id === updated._id ? { ...user, ...updated } : user)));

    const handleDeleted = (id: string) => setUsers((current) => current.filter((user) => user._id !== id));

    return (
        <div className="space-y-6">
            <ActivityStrip users={users} now={now} />

            <section aria-labelledby="admin-users-title" className="glass space-y-4 rounded-3xl p-5 sm:p-7">
                <div className="flex items-baseline justify-between gap-4">
                    <h2 id="admin-users-title" className="text-lg font-medium">
                        Usuários
                    </h2>
                    <p aria-live="polite" className="text-sm text-muted-foreground">
                        {visibleUsers.length === 0
                            ? "Nenhum usuário encontrado"
                            : isFiltering
                              ? `${visibleUsers.length.toLocaleString("pt-BR")} de ${count(users.length, "usuário", "usuários")}`
                              : count(users.length, "usuário", "usuários")}
                    </p>
                </div>

                <div role="group" aria-label="Filtrar usuários" className="flex flex-wrap gap-2">
                    {visibleFilters.map(({ key, label }) => {
                        const active = filter === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setFilter(key)}
                                className={cn(
                                    "inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                                    active
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-foreground/5 hover:bg-foreground/10"
                                )}
                            >
                                {label}
                                <span
                                    className={cn(
                                        "text-xs tabular-nums",
                                        active ? "text-primary-foreground/80" : "text-muted-foreground"
                                    )}
                                >
                                    {counts[key].toLocaleString("pt-BR")}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1 sm:max-w-sm">
                        <Search
                            aria-hidden
                            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar por nome ou e-mail"
                            aria-label="Buscar por nome ou e-mail"
                            autoComplete="off"
                            className="pl-8"
                        />
                    </div>

                    <Select value={sort} onValueChange={(value) => value && setSort(value as SortKey)}>
                        <SelectTrigger aria-label="Ordenar usuários" className="w-full sm:ml-auto sm:w-52">
                            <SelectValue
                                render={(value) => (
                                    <span className="truncate">
                                        {SORT_OPTIONS.find((option) => option.value === value.children)?.label ?? "Ordenar"}
                                    </span>
                                )}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {visibleUsers.length === 0 ? (
                    <div className="flex flex-col items-start gap-3 border-t border-border pt-6">
                        <p className="text-sm text-muted-foreground">
                            {isFiltering
                                ? "Nenhum usuário combina com a busca e os filtros atuais."
                                : "Ainda não há usuários cadastrados."}
                        </p>
                        {isFiltering && (
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                Limpar filtros
                            </Button>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-border border-y border-border">
                        {visibleUsers.map((user) => (
                            <UserRow
                                key={user._id}
                                user={user}
                                now={now}
                                isSelf={user._id === currentUserId}
                                onEdit={setEditing}
                                onDelete={setDeleting}
                            />
                        ))}
                    </ul>
                )}
            </section>

            {editing && (
                <EditUserDialog
                    key={editing._id}
                    user={editing}
                    isSelf={editing._id === currentUserId}
                    onClose={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            )}
            {deleting && (
                <DeleteUserDialog
                    key={deleting._id}
                    user={deleting}
                    onClose={() => setDeleting(null)}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    );
}
