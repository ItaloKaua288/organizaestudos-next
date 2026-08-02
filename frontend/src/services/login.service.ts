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
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ email, password, }),
        }
    );
    if (!res.ok) {
        throw new Error("Invalid email or password");
    }

    return await res.json();
}

type SignupCredentials = {
    username: string;
    email: string;
    password: string;
};

export async function signup({ username, email, password }: SignupCredentials) {
    const res = await fetch(
        `/api/auth/signup`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ email, password, name:username }),
        }
    );
    if (!res.ok) {
        if (res.status === 400)
            throw new Error("Email já cadastrado!");
        else
            throw new Error((await res.json()).message)
    }
    
    await login({email, password})
}

export async function checkAuth() {
    const res = await fetch(`/api/auth/check-auth`);
    if (!res.ok) {
        throw new Error("Usuário não logado");
    }

    return await res.json();
}

export async function logout() {
    const res = await fetch(`/api/auth/logout`, { method: "POST", });
    if (!res.ok) {
        throw new Error("Erro ao tentar sair!");
    }
    
    return await res.json();
}