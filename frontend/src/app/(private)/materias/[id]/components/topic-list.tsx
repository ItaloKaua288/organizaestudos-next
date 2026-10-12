"use client"

import { TopicDragGhost, TopicRow } from "@/components/topic-row";
import { useTopicReorder } from "@/hooks/use-topic-reorder";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";

interface TopicListProps {
    sortedTopics: Topic[];
    subject: Subject;
}

export function TopicList({ sortedTopics, subject }: TopicListProps) {
    const { topics, moveTopic, isReordering, draggedId, overId, ghost, ghostRef, getDragProps } = useTopicReorder(subject.id, sortedTopics);

    return (
        <div className="flex flex-col gap-2">
            {topics.map((topic, index) => (
                <TopicRow
                    key={topic.id || `topic-${index}`}
                    topic={topic}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === topics.length - 1}
                    subject={subject}
                    isReordering={isReordering}
                    dragProps={getDragProps(topic.id)}
                    isDragging={draggedId === topic.id}
                    isDragOver={overId === topic.id}
                    onMoveUp={() => moveTopic(topic.id, "up")}
                    onMoveDown={() => moveTopic(topic.id, "down")}
                />
            ))}
            <TopicDragGhost ghost={ghost} elementRef={ghostRef} />
        </div>
    )
}
