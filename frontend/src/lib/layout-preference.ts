/** Preferências de aparência do site, guardadas em cookies (escolhidas na página de perfil). */

/** "top": barra flutuante no topo (padrão). "sidebar": menu lateral fixo. */
export type NavLayout = "top" | "sidebar";
export type NavSide = "left" | "right";
export type Density = "comfortable" | "compact";
export type ContentWidth = "narrow" | "default" | "wide";

export type AppearancePrefs = {
  layout: NavLayout;
  /** Sidebar recolhida (só ícones). */
  collapsed: boolean;
  side: NavSide;
  density: Density;
  width: ContentWidth;
};

export const DEFAULT_PREFS: AppearancePrefs = {
  layout: "top",
  collapsed: false,
  side: "left",
  density: "comfortable",
  width: "default",
};

export const PREF_COOKIES: Record<keyof AppearancePrefs, string> = {
  layout: "navLayout",
  collapsed: "navCollapsed",
  side: "navSide",
  density: "uiDensity",
  width: "uiWidth",
};

/** Mantido por compatibilidade com o código que já importava este nome. */
export const LAYOUT_COOKIE = PREF_COOKIES.layout;

export function parseNavLayout(value: string | undefined | null): NavLayout {
  return value === "sidebar" ? "sidebar" : "top";
}

/** Lê as preferências de um leitor de cookies, caindo no padrão para valores ausentes ou inválidos. */
export function readPrefs(get: (name: string) => string | undefined): AppearancePrefs {
  const side = get(PREF_COOKIES.side);
  const density = get(PREF_COOKIES.density);
  const width = get(PREF_COOKIES.width);
  return {
    layout: parseNavLayout(get(PREF_COOKIES.layout)),
    collapsed: get(PREF_COOKIES.collapsed) === "1",
    side: side === "right" ? "right" : "left",
    density: density === "compact" ? "compact" : "comfortable",
    width: width === "narrow" || width === "wide" ? width : "default",
  };
}

/** Valor de cookie de uma preferência. */
export function serializePref(key: keyof AppearancePrefs, value: AppearancePrefs[keyof AppearancePrefs]): string {
  if (key === "collapsed") return value ? "1" : "0";
  return String(value);
}
