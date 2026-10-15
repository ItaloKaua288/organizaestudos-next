export interface AdminSubject {
    _id: string;
    title: string;
    color: string;
    /** Matéria desativada some de revisões, cronograma e dashboard. */
    active: boolean;
    topicsCount: number;
}

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    isVerified: boolean;
    createdAt: string;
    lastLogin: string | null;
    /** Tempo de estudo registrado, em minutos. */
    totalStudyTime: number;
    profilesCount: number;
    subjectsCount: number;
    topicsCount: number;
    concludedTopicsCount: number;
    attachmentsCount: number;
    notesCount: number;
    subjects: AdminSubject[];
}

export interface AdminUsersState {
    /** "forbidden": quem acessou não é administrador. */
    status: "ok" | "forbidden" | "error";
    users: AdminUser[];
    currentUserId: string | null;
}

export interface AdminUserInput {
    name: string;
    email: string;
    isAdmin: boolean;
    isVerified: boolean;
}

/** Campos que a API devolve ao editar um usuário (sem os totais de uso). */
export type AdminUserUpdated = Pick<
    AdminUser,
    "_id" | "name" | "email" | "isAdmin" | "isVerified" | "createdAt" | "lastLogin" | "totalStudyTime"
>;

export interface AdminActionResult {
    success: boolean;
    message: string;
    user?: AdminUserUpdated;
}
