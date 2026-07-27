type LoginCredentials = {
    email: string;
    password: string;
};

export default async function login({
    email,
    password,
}: LoginCredentials) {
    const res = await fetch(
        `/api/auth/login`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify({email, password,}),
        }
    );
    if (!res.ok) {
        throw new Error("Invalid email or password");
    }
    
    const data = await res.json();

    return data;
}