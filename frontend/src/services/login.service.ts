type LoginCredentials = {
    email: string;
    password: string;
};

export default async function login({
    email,
    password,
}: LoginCredentials) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );
    if (!res.ok) {
        throw new Error("Invalid email or password");
    }

    return res.json();
}