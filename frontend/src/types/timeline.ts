import { Subject } from "./subject";

export interface Timeline {
    id: string,
    day: string,
    start_time: string,
    end_time: string,
    subject?: Subject,
}