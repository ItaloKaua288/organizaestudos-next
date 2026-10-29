/** Layout da tela de Matérias: "detalhado" (caixas com assuntos) ou "compacto" (só as matérias). */
export const LAYOUT_COOKIE = "materias_layout";

export type MateriasLayout = "detalhado" | "compacto";

export function parseLayout(value: string | undefined | null): MateriasLayout {
    return value === "compacto" ? "compacto" : "detalhado";
}
