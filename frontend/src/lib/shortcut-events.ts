/** Evento disparado pelo atalho "N". Quem sabe criar algo na tela atual marca `handled` e age. */
export const NEW_ITEM_EVENT = "app:shortcut-new-item";

export type NewItemEventDetail = { handled: boolean };
