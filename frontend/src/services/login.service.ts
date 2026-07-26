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

    const data = await res.json();

    if (data.token) {
        (await cookies()).set("token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
            path: "/",
        })
    }

    return data;
}