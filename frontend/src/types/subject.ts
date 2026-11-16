import { Note } from "./note";
import { Timeline } from "./timeline";
import { Topic } from "./topic";

export interface Subject {
    id: string;
    title: string;
    color: string;
    /** Matéria desativada some de revisões, cronograma e dashboard. Ausente = ativa. */
    active?: boolean;
    /** Posição manual na lista de matérias (a lista já chega ordenada pela API). */
    order?: number;
    topics?: Topic[];
    notes?: Note[];
    timelines?: Timeline[];
}
