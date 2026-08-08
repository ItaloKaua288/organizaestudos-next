import { Note } from "./note";
import { Topic } from "./topic";

export interface Subject {
    id: string;
    title: string;
    color: string;
    topics?: Topic[]
    notes?: Note[]
}
