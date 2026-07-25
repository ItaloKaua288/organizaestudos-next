import { Subject } from "./subject";

export interface Note {
    id: string;
    title: string;
    content: string;
    is_pined: boolean;
    subject: Subject;
}