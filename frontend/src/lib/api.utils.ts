"use server";

import { cookies } from "next/headers";
import { PROFILE_COOKIE } from "./profile-cookie";

const isProd = process.env.NODE_ENV === "production";
export const getBaseUrl = async () => isProd ? process.env.API_BASE_URL?.replace(/\/$/, "") : "http://localhost:5000/api";

export async function getAuthHeaders() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const profileId = cookieStore.get(PROFILE_COOKIE)?.value;
    return {
        "Content-Type": "application/json",
        ...(token ? { "Cookie": `token=${token}` } : {}),
        // A API filtra matérias, ciclo, revisões etc. por este perfil (sem ele, usa o primeiro perfil).
        ...(profileId ? { "x-profile-id": profileId } : {})
    };
}
