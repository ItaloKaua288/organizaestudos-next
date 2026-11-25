export interface Profile {
    id: string;
    name: string;
    /** Quantidade de matérias cadastradas no perfil. */
    subjectsCount: number;
    /** Dia da prova do concurso (AAAA-MM-DD) ou null quando ainda não foi informado. */
    examDate: string | null;
    /** Máximo de revisões em um mesmo dia (ou null = sem limite). */
    reviewDailyLimit: number | null;
}

export interface ProfilesState {
    profiles: Profile[];
    activeProfileId: string | null;
}

export interface ProfileActionResult {
    success: boolean;
    message: string;
    profile?: Profile;
}
