"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { AdminActionResult, AdminUser, AdminUserInput, AdminUsersState, AdminUserUpdated } from "@/types/admin";
import { revalidatePath } from "next/cache";

const MAX_NAME_LENGTH = 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lista todos os usuários com os totais de uso. A API só responde para administradores:
 * 401/403 vira "forbidden" para a página redirecionar quem não deveria estar ali.
 */
export async function getAdminUsersAction(): Promise<AdminUsersState> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const [usersRes, authRes] = await Promise.all([
            fetch(`${baseUrl}/users/admin/users`, { headers, cache: "no-store" }),
            fetch(`${baseUrl}/auth/check-auth`, { headers, cache: "no-store" }),
        ]);

        if (usersRes.status === 401 || usersRes.status === 403) {
            return { status: "forbidden", users: [], currentUserId: null };
        }
        if (!usersRes.ok) return { status: "error", users: [], currentUserId: null };

        const data = await usersRes.json();
        const auth = authRes.ok ? await authRes.json().catch(() => null) : null;

        return {
            status: "ok",
            users: (data.users ?? []) as AdminUser[],
            currentUserId: (auth?.user?._id as string | undefined) ?? null,
        };
    } catch (error) {
        console.error("Erro interno ao buscar os usuários:", error);
        return { status: "error", users: [], currentUserId: null };
    }
}

export async function updateUserAdminAction(id: string, input: AdminUserInput): Promise<AdminActionResult> {
    try {
        const name = input.name.trim().replace(/\s+/g, " ");
        const email = input.email.trim();

        if (!name) return { success: false, message: "O nome é obrigatório." };
        if (name.length > MAX_NAME_LENGTH) {
            return { success: false, message: `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.` };
        }
        if (!EMAIL_REGEX.test(email)) return { success: false, message: "Informe um e-mail válido." };

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/users/admin/users/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ name, email, isAdmin: input.isAdmin, isVerified: input.isVerified }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao atualizar o usuário." };

        revalidatePath("/admin");

        return {
            success: true,
            message: "Usuário atualizado com sucesso!",
            user: data.user as AdminUserUpdated | undefined,
        };
    } catch (error) {
        console.error("Erro interno ao atualizar o usuário:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function deleteUserAdminAction(id: string): Promise<AdminActionResult> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/users/admin/delete-user/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { success: false, message: data.message || "Falha da API ao excluir o usuário." };

        revalidatePath("/admin");

        return { success: true, message: "Usuário excluído com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao excluir o usuário:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}
