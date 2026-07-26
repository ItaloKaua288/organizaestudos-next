export function getAppUrl() {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

    return configuredUrl?.replace(/\/$/, "") || "http://localhost:3000";
}