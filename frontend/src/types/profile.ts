export interface Profile {
    id: string;
    name: string;
    /** Quantidade de matérias cadastradas no perfil. */
    subjectsCount: number;
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
