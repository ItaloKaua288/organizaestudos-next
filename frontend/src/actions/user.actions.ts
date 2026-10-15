"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { Account, UserActionResult } from "@/types/user";
import { revalidatePath } from "next/cache";

const MAX_NAME_LENGTH = 60;
const MIN_PASSWORD_LENGTH = 8;

/** Dados da conta (nome, datas e resumo dos estudos). Retorna null se não for possível carregar. */
export async function getAccountAction(): Promise<Account | null> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/users/me`, { headers, cache: "no-store" });
        if (!res.ok) return null;

        const data = await res.json();
        return (data.account ?? null) as Account | null;
    } catch (error) {
        console.error("Erro interno ao buscar os dados da conta:", error);
        return null;
    }
}

export async function updateNameAction(name: string): Promise<UserActionResult> {
    try {
        const trimmed = name.trim().replace(/\s+/g, " ");
        if (!trimmed) return { success: false, message: "O nome é obrigatório." };
        if (trimmed.length > MAX_NAME_LENGTH) {
            return { success: false, message: `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.` };
        }

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/users/update-user`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao atualizar o nome." };

        revalidatePath("/perfil");

        return { success: true, message: "Nome atualizado com sucesso!", name: data.user?.name ?? trimmed };
    } catch (error) {
        console.error("Erro interno ao atualizar o nome:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<UserActionResult> {
    try {
        if (!currentPassword || !newPassword) {
            return { success: false, message: "Informe a senha atual e a nova senha." };
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return { success: false, message: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` };
        }

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/users/change-password`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao alterar a senha." };

        return { success: true, message: data.message || "Senha alterada com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao alterar a senha:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}
