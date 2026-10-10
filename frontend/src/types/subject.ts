import { Note } from "./note";
import { Timeline } from "./timeline";
import { Topic } from "./topic";

export interface Subject {
    id: string;
    title: string;
    color: string;
    /** Matéria desativada some de revisões, cronograma e dashboard. Ausente = ativa. */
    active?: boolean;
    topics?: Topic[];
    notes?: Note[];
    timelines?: Timeline[];
}
