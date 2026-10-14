"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { PROFILE_COOKIE } from "@/lib/profile-cookie";
import { Profile, ProfileActionResult, ProfilesState } from "@/types/profile";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function setActiveProfileCookie(profileId: string) {
    const cookieStore = await cookies();
    cookieStore.set(PROFILE_COOKIE, profileId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: ONE_YEAR,
    });
}

// Tudo que depende das matérias do perfil precisa ser recarregado quando o perfil muda.
function revalidateEverything() {
    revalidatePath("/", "layout");
}

export async function getProfilesAction(): Promise<ProfilesState> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/profiles`, { headers, cache: "no-store" });

        if (!res.ok) return { profiles: [], activeProfileId: null };

        const data = await res.json();
        return {
            profiles: (data.profiles ?? []) as Profile[],
            activeProfileId: data.activeProfileId ?? null,
        };
    } catch (error) {
        console.error("Erro interno ao buscar os perfis:", error);
        return { profiles: [], activeProfileId: null };
    }
}

export async function switchProfileAction(profileId: string): Promise<ProfileActionResult> {
    try {
        if (!profileId) return { success: false, message: "Perfil inválido." };

        // Confirma na API que o perfil existe e é do usuário antes de gravar o cookie.
        const baseUrl = await getBaseUrl();
        const headers = { ...(await getAuthHeaders()), "x-profile-id": profileId };
        const res = await fetch(`${baseUrl}/profiles`, { headers, cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.activeProfileId !== profileId) {
            return { success: false, message: "Perfil não encontrado." };
        }

        await setActiveProfileCookie(profileId);
        revalidateEverything();

        return { success: true, message: "Perfil alterado!" };
    } catch (error) {
        console.error("Erro interno ao trocar de perfil:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function createProfileAction(name: string): Promise<ProfileActionResult> {
    try {
        const trimmed = name.trim();
        if (!trimmed) return { success: false, message: "O nome do perfil é obrigatório." };

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/profiles`, {
            method: "POST",
            headers,
            body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao criar o perfil." };

        // O perfil recém-criado já vira o perfil ativo.
        await setActiveProfileCookie(data.profile.id);
        revalidateEverything();

        return { success: true, message: "Perfil criado com sucesso!", profile: data.profile };
    } catch (error) {
        console.error("Erro interno ao criar perfil:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function renameProfileAction(profileId: string, name: string): Promise<ProfileActionResult> {
    try {
        const trimmed = name.trim();
        if (!trimmed) return { success: false, message: "O nome do perfil é obrigatório." };

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/profiles/${profileId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao renomear o perfil." };

        revalidateEverything();

        return { success: true, message: "Perfil renomeado com sucesso!", profile: data.profile };
    } catch (error) {
        console.error("Erro interno ao renomear perfil:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function deleteProfileAction(profileId: string): Promise<ProfileActionResult> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/profiles/${profileId}`, { method: "DELETE", headers });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao excluir o perfil." };

        // Se o perfil excluído era o ativo, o cookie fica inválido e a API volta para o primeiro perfil.
        const cookieStore = await cookies();
        if (cookieStore.get(PROFILE_COOKIE)?.value === profileId) cookieStore.delete(PROFILE_COOKIE);

        revalidateEverything();

        return { success: true, message: "Perfil excluído com sucesso." };
    } catch (error) {
        console.error("Erro interno ao excluir perfil:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}
