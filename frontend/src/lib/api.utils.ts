"use server";

import { cookies } from "next/headers";

const isProd = process.env.NODE_ENV === "production";
export const getBaseUrl = async () => isProd ? process.env.API_BASE_URL?.replace(/\/$/, "") : "http://localhost:5000/api";

export async function getAuthHeaders() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    return {
        "Content-Type": "application/json",
        ...(token ? { "Cookie": `token=${token}` } : {})
    };
}