"use client"

import { TopicRow } from "@/components/topic-row";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";

interface TopicListProps {
    sortedTopics: Topic[];
    subject: Subject;
}

export function TopicList({ sortedTopics, subject }: TopicListProps) {
    return (
        <div className="flex flex-col gap-2">
            {sortedTopics.map((topic, index) => (
                <TopicRow
                    key={topic.id || `topic-${index}`}
                    topic={topic}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === sortedTopics.length - 1}
                    subject={subject}
                />
            ))}
        </div>
    )
}