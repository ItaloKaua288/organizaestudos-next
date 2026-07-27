"use server";

import { cookies } from "next/headers";
import { getAppUrl } from "@/utils/url.utils"

type LoginCredentials = {
    email: string;
    password: string;
};



export default async function login({
    email,
    password,
}: LoginCredentials) {
    const appUrl = getAppUrl();

    const res = await fetch(
        `${appUrl}/api/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );
    if (!res.ok) {
        throw new Error("Invalid email or password");
    }

    const setCookieHeader = res.headers.get("set-cookie");
    
    if (setCookieHeader) {
        const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
        
        if (tokenMatch && tokenMatch[1]) {
            (await cookies()).set("token", tokenMatch[1], {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: "/",
            });
        }
    }
    
    const data = await res.json();

    return data;
}